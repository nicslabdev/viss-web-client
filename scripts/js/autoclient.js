// Vars for the client context
var clientContext;
var clientKey;
var clientUser;
var clientApp;
var clientDevice;
// List of at, agt and purpose associated to the context
var filteredAtList;
var filteredAgtList;
var filteredPurposeList;

// Gets the data tree fom vsspathlist.json file holded by the client server
var dataTree; treeInit();
function treeInit(){    
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let temptree = JSON.parse(xhr.responseText)
            dataTree = pathListJson(JSON.stringify(temptree["LeafPaths"]));
        }
    }
    xhr.open('GET', 'specs/vsspathlist.json');
    xhr.send();
}

// Obtains the ATs avaliable for the client context
function initContextAtList(){
    getAtList().then((result)=>{    // Filters depending on the context
        filteredAtList = result.filter(at => at.payload.clx == clientContext);
    })
}

// Obtains the AGTs avaliable for the client context
function initContextAgtList(){
    getAgtList().then((result)=>{   // Filters depending on the context and key associated
        filteredAgtList = result.filter(agt => (agt.payload.clx == clientContext && agt.keyAssociated == clientKey) );
    })
}

// Obtains the purposes avaliable for the client context
function initClientPurposeList(){
    if (purposeList == undefined){ // If purposeList isnt already filled, retry after 100ms
        setTimeout(initClientPurposeList, 100);
    } else {        // Filters depending on the context
        filteredPurposeList = purposeList.filter(checkPurposeRoles);
    }
}

// Checks if the purpose given contains the client roles the user has
function checkPurposeRoles(purposeIt){
    if (purposeIt.contexts.length == undefined){ // Single context
        return ((purposeIt.contexts.app == clientApp || 
        (purposeIt.contexts.app.length != undefined && purposeIt.contexts.app.includes(clientApp))) &&
        (purposeIt.contexts.device == clientDevice ||
         (purposeIt.contexts.device.length != undefined && purposeIt.contexts.device.includes(clientDevice))) &&
        (purposeIt.contexts.user == clientUser || 
        (purposeIt.contexts.user.length != undefined && purposeIt.contexts.user.includes(clientUser))));
    } else {
        for (let contextIt in purposeIt.contexts){
            if (((purposeIt.contexts[contextIt].app == clientApp || 
            (purposeIt.contexts[contextIt].app.length != undefined && purposeIt.contexts[contextIt].app.includes(clientApp))) &&
            (purposeIt.contexts[contextIt].device == clientDevice ||
            (purposeIt.contexts[contextIt].device.length != undefined && purposeIt.contexts[contextIt].device.includes(clientDevice))) &&
            (purposeIt.contexts[contextIt].user == clientUser || 
            (purposeIt.contexts[contextIt].user.length != undefined && purposeIt.contexts[contextIt].user.includes(clientUser))))){
                return true;
            }
        }
        return false
    }
}

// // Gets a signal, checks if an AT for that signal path is avaliable.
// // Returns extended AT object if avaliable, null if not avaliable
// function getAtforPath(path){
//     let purposesforPath = getPurposesContainingSignalforContext(path.replace("/",".")); // Get the purposes containing that path
//     for (purpose in purposesforPath){  
//         for (let atIndex in filteredAtList){ // Compares the access token purposes with the purposes in the purpose list obtained
//             if (purpose.short == filteredAtList[atIndex].payload.scp){ // If the at works for that purpose
//                 if (filteredAtList[atIndex].payload.exp > (Date.now()/1000)){ // Also check that the at is not expired
//                     return filteredAtList[atIndex];
//                 } else{ // Expired 
//                     deleteAt(filteredAtList[atIndex].tokenId);
//                     filteredAtList.splice(atIndex, 1);
//                     atIndex--;
//                 }
//             }
//         }
//     }
//     return null;
// }

// Checks if a signal is included in the filteredPurposeList
// If included, an array including all the purposes including that signal is returned
// If not included, an empty array is returned
function getPurposesContainingSignalforContext(signal){
    var purposes = [];
    for (var purpose of filteredPurposeList){   // Iterates all the purposes in the purpose list
        if (purpose.signal_access.length == undefined){ // If the purpose contains a single signal
            if (purpose.signal_access.path == signal){
                purposes.push(purpose);
            }
        } else {
            for (var signalSet of purpose.signal_access){ // If the purpose contains a set of signals
                if (signalSet.path == signal){
                    purposes.push(purpose);
                    break;
                }
            }
        }
    }
    return purposes;
}

// Gets the purpose and a signal, an checks if the signal is avaliable in the purpose
function checkPurposeSignal(purpose, signal){
    let signalparts = signal.split(".");        // Splits the signal in its parts
    let signalInPurpose;    //Each one of the signals in the purpose
    let signalpartsinPurpose; // Each one of the parts of a signal in the purpose

    // Checks if the purpose contains a single signal or an array of them
    if (purpose.signal_access.length == undefined){//If its a single signal
        signalpartsinPurpose = purpose.signal_access.path.split(".");
        // Suppose that a purpose that holds at a parent node, gives access to all children nodes (?)
        if (signalparts.length < signalpartsinPurpose.length){ // The length of the signal we want can not be less than the one in the purpose
            return false;
        } 
        for (let i in signalpartsinPurpose){ // Compares all the parts of the signal in purpose, if all matches, it is parent node or the same node
            if (signalpartsinPurpose[i] != signalInPurpose[i]){
                return false;
            }
        }
        return true;

    } else { // If contains more than a signal, same but iterating
        for (let signalinPurpose of purpose.signal_access){ // Iterates each one of the signal accessible for the purpose
            signalpartsinPurpose = signalinPurpose.signal_access.path.split(".");
            if (signalparts.length < signalpartsinPurpose.length){ // The length of the signal we want can not be less than the one in the purpose
                break;
            } 
            for (let i in signalpartsinPurpose){ // Compares all the parts of the signal in purpose, if all matches, it is parent node or the same node
                if (signalpartsinPurpose[i] != signalInPurpose[i]){
                    break;
                } else if (i == signalpartsinPurpose.length -1){
                    return true;
                }
            }
        }
        return false;
    }
}


// Gets the AT neccesary to make a request for a Path
// If no AT is avaliable / is expired, a new AT is requested using an AGT.
// If no AGT is avaliable, a new AGT is requested
function getAtforPath(path){
    return new Promise(async function(resolve,reject){
        let accessGrantToken = null;
        let purposesforPath = getPurposesContainingSignalforContext(path.replace("/", "").replaceAll("/",".")); // Get the purposes containing that path
        if (purposesforPath.length == 0){
            reject("No purpose for that path avaliable");
            return;
        }
        for (purpose of purposesforPath){  
            for (let filteredAt of filteredAtList){ // Compares the access token purposes with the purposes in the purpose list obtained
                if (purpose.short == filteredAt.payload.scp){ // If the at works for that purpose
                    resolve(filteredAt.encoded);
                    return;
                }
            }
        }
        // No AT is avaliable, must request one
        // Checks if AGT is avaliable
        if (filteredAgtList.length == 0){ // Must request a new AGT
            // No AGT is avaliable, must request one
            let agtreq = new XMLHttpRequest();
            agtreq.onreadystatechange = function(){
                if (this.readyState == 4){
                    if (this.status != 200){
                        reject("Could not obtain AGT: " + this.statusText);
                    } else {
                        let agt_resp = JSON.parse(this.responseText);
                        if (agt_resp.token == undefined){
                            reject("No AGT was received: "+ this.responseText);
                        } else {    // An AGT was received
                            storeAgt(clientKey, agt_resp.token);
                            accessGrantToken = agt_resp.token;
                        }
                    }
                }
            }
            agtreq.open("POST", AgtUrl, false); // Not asynchronous AGT request
            let requestContent = {
                context: clientContext,
                proof: "ABC",
                vin: undefined,
                key: undefined
            }
            if (clientKey != "None"){
                let pop = await generatePop(clientKey, "vissv2/agts");
                agtreq.setRequestHeader("PoP", pop);
                requestContent.key = await getPublicThumbprint(clientKey);
            } 
            agtreq.send(JSON.stringify(requestContent));
        } else { // There is an AGT avaliable
            accessGrantToken = filteredAgtList[0].encoded;
        }
        // If no agt is avaliable, returns and rejects
        if (accessGrantToken == undefined){
            reject("No AGT avaliable");
            return;
        }
        
        // Request an AT using the AGT
        let atreq = new XMLHttpRequest();
        let atRequestContent = { 
            purpose: purposesforPath[0].short,      // Purpose is in a select
            token: accessGrantToken,
            pop: clientKey=="None"?undefined:await generatePop(clientKey, "vissv2/ats")
        }
        atreq.onreadystatechange = function(){
            if (this.readyState == 4){
                if (this.status != 200){
                    reject("Could not obtain AT: " + this.statusText);
                } else {
                    let at_resp = JSON.parse(this.responseText);
                    if (at_resp.token == undefined){
                        reject("No AT was received: " + this.responseText);
                    } else{
                        storeAt(at_resp.token);
                        resolve(at_resp.token);
                        setClientData(); // If a new access token is issued, needs to initialize the token lists and signals avaliable
                    }
                }
            }
        }
        atreq.open("POST", AtUrl, true);
        atreq.send(JSON.stringify(atRequestContent));
    })
}

// Checks ats and agts for a expired token, then deletes them from the list
function removeExpiredTokens(){
    let unixTime = Date.now() / 1000 + 5; // 5 seconds of upper margin

    for (let i = 0; i < filteredAtList.length; i++){
        if (filteredAtList[i].payload.exp < unixTime){
            deleteAt(filteredAtList[i].tokenId);
            filteredAtList.splice(i, 1);
            i --;
        }   
    }

    for (let i = 0; i < filteredAgtList.length; i++){
        if (filteredAgtList[i].payload.exp < unixTime){
            deleteAgt(filteredAgtList[i].tokenId);
            filteredAgtList.splice(i, 1);
            i --;
        }   
    }
    initClientPurposeList();
    initPath();
}

// Gets a parent or child node and checks if that parent node appears in an AT associated to the context
// ONLY USE FOR DEMONSTRATION PURPOSES
function isSignalinAtNoTrust(signal){
    let purposeNames = [];
    for (let atCheck of filteredAtList){    // Obtains all the scopes of the ats avaliables
        purposeNames.push(atCheck.payload.scp)
    }
    let purposesInAts = [];
    for (let purposeName of purposeNames){  // With the ats, obtains all the purpose objects named like the scope of those ats
        purposesInAts = purposesInAts.concat(filteredPurposeList.filter(purpose => purpose.short == purposeName));
    }
    for (let purposetoCheck of purposesInAts){  // Checks the signals with the purpose objects
        if (isSignalinSinglePurposeNoTrust(signal, purposetoCheck)){
            return true;
        }
    }
    return false;
}

// Gets a parent or child node and checks if that node appears in the purposelist of the client context
// ONLY USE FOR DEMONSTRATION PURPOSES
function isSignalinPurposeListNoTrust(signal){
    for (let purposetoCheck of filteredPurposeList){    // Iterates purpose list
        if (isSignalinSinglePurposeNoTrust(signal, purposetoCheck)){    // If the signal is in the purpose checked, return true
            return true;                                
        }
    }
    return false;   // Signal is not in a single purpose checked
}

// Gets a parent or child node and checks if that node appears in a purpose given
// ONLY USE FOR DEMONSTRATION PURPOSES
function isSignalinSinglePurposeNoTrust(signal, purposetoCheck){
    let signalparts = signal.split(".");        // Splits the signal in its parts
    let signalpartsinPurpose; // Each one of the parts of a signal in the purpose

    // Checks if the purpose contains a single signal or an array of them
    if (purposetoCheck.signal_access.length == undefined){//If its a single signal
        signalpartsinPurpose = purposetoCheck.signal_access.path.split(".");
        if (signalparts.length < signalpartsinPurpose.length){ // A children node might be contained
            for (let i in signalparts){
                if(signalparts[i] != signalpartsinPurpose[i]){
                    return false
                }
            }
            return true
        } else {
            for (let i in signalpartsinPurpose){ // Compares all the parts of the signal in purpose, if all matches, it is parent node or the same node
                if (signalpartsinPurpose[i] != signalparts[i]){
                    return false;
                }
            }
            return true;
        }
    } else { // If contains more than a signal, same but iterating
        for (let signalinPurpose of purposetoCheck.signal_access){ // Iterates each one of the signals accessible for the purpose
            signalpartsinPurpose = signalinPurpose.path.split(".");
            if (signalparts.length < signalpartsinPurpose.length){ // A children node might be contained
                for (let i in signalparts){
                    if(signalparts[i] != signalpartsinPurpose[i]){
                        break;
                    } else if (i == signalparts.length-1){
                        return true;
                    }
                }
            } else {
                for (let i in signalpartsinPurpose){ // Compares all the parts of the signal in purpose, if all matches, it is parent node or the same node
                    if (signalpartsinPurpose[i] != signalparts[i]){
                        break;
                    } else if (i == signalpartsinPurpose.length - 1) {
                        return true;
                    }
                }
            }
        }
        return false
    }
}
