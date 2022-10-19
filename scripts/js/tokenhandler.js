// **************************               DATABASE RELATED                **************************
// Creates or initalizes the Database
var clientDbRequest = window.indexedDB.open("TokenDB", 1);
// Error management
clientDbRequest.onerror = function (event) {
    logStatus("Error","Error with TokenDB" + event, "console");
    window.alert("Error using Token indexedDB");
}
// Used when creating a DB or changing its version number
clientDbRequest.onupgradeneeded = function (event) {
    // Creates access grant token store
    var agtStore = clientDbRequest.result.createObjectStore("AGTStorage", {keyPath: "tokenId"});
    agtStore.createIndex("tokenId", "tokenId", {unique: true});  // Index for token Id (internal), must be unique
    agtStore.createIndex("jti", "jti", {unique:true});           // Index for token jti, must be unique
    agtStore.createIndex("vin", "payload.vin", {unique:false});  // Index to search tokens by the vin
    agtStore.createIndex("clx", "payload.clx", {unique:false});  // Index to search tokens by the context of the client
    agtStore.createIndex("keyAssociated", "keyId", {unique:false}); // Index to search tokens by the key associated
    // Access Token Store
    var atStore = clientDbRequest.result.createObjectStore("ATStorage", {keyPath: "tokenId"});
    atStore.createIndex("tokenId", "tokenId", {unique: true});
    atStore.createIndex("vin", "payload.vin", {unique:false});  // Index to search tokens by the vin
    atStore.createIndex("scp", "payload.scp", {unique:false});  // Index to search tokens by the scope
    atStore.createIndex("clx", "payload.clx", {unique: false}); // Index to search tokens by the context
    atStore.createIndex("jti", "jti", {unique:true});          // Index to search tokens by the jti (unique)
}
clientDbRequest.onsuccess = function (event) {
    logStatus("Info", "TokenHandler: IndexedDB Ok", "console");
}

// **************************               AGT RELATED                     **************************

// Stores the AGT using Indexed DB. It is stored along with an ID.
// The decoded AGT is saved as an object. KeyId is ES256, RS256 or None
// The id of the key associated, the agt itself and the id of the agt must be given (id is optional)
function storeAgt(keyId, agt, id) {
    if (id == "" || id == null){
        id = keyId + "#" + crypto.randomUUID().slice(undefined, 8);
    }
    let parts = agt.split(".");
    parts[0] = strDecodeBase64URLSafe(parts[0]);
    parts[1] = strDecodeBase64URLSafe(parts[1]);
    let agtExtended = {
        tokenId: id,
        keyAssociated : keyId,
        encoded : agt,
        header: JSON.parse(parts[0]),
        payload: JSON.parse(parts[1])
    }
    request = window.indexedDB.open("TokenDB", 1);
    request.onerror = function (event) {
        logStatus("Error", "Error with client TokenDB", "console");
        console.error(event);
        window.alert("Error using client TokenDB");
    }
    request.onsuccess = function (event) {
        var db = event.target.result;
        let putrequest = db.transaction("AGTStorage", "readwrite").objectStore("AGTStorage").put(agtExtended);
        putrequest.onerror = function (event) {
            logStatus("Error", "Could not save AGT in TokenDB: " + event, "console")
            window.alert("Could not store AGT")
        }
        putrequest.onsuccess = function (event) {
            window.alert("AGT Stored");
            logStatus("Info", "AGT Stored in TokenDB", "console");
        }
    }
}

// Obtains all the Access Grant Tokens avaliable
// A promise is returned, that returns an array of extendedAgts if resolved
function getAgtList(){
    return new Promise(function(resolve,reject){    
        request = window.indexedDB.open("TokenDB", 1);  // Request to open the token db
        request.onerror = function (event) {
            reject(event);
        }
        request.onsuccess = function (event) {     // If db is avaliable
            var agtList = [];   // Array containing the agts
            var db = event.target.result;   // Database
            // Creates transactions, request for an object store, then get the index "keypath"
            var storeIndex = db.transaction("AGTStorage", "readonly").objectStore("AGTStorage").index("tokenId");
            let cursor = storeIndex.openCursor();
            cursor.onsuccess = function(event) {   // Open cursor to iterate
                var cursor = event.target.result;
                if (cursor){    // If cursor is a value
                    agtList.push(cursor.value);
                    cursor.continue();
                } else{
                    resolve(agtList);
                }
            }
            cursor.onerror = function(event){
                reject(event)
            }
        }
    })
}

function deleteAgt(id){
    dbrequest = window.indexedDB.open("TokenDB", 1);  // open db 
    logStatus("Info", "Deleting Access Grant Token with ID: " + id, "console");
    dbrequest.onerror = function (event){
        logStatus("Info", "Can not delete AGT: " + event.value, "console");
    }
    dbrequest.onsuccess = function(){
        var db = dbrequest.result;// gets db
        var deleteRequest = db.transaction("AGTStorage", "readwrite").objectStore("AGTStorage").delete(id);
        deleteRequest.onsuccess = function() {
            logStatus("Info", "Access Grant Token with ID: " + id + " deleted successfully", "console");
        }
        deleteRequest.onerror = function(event){
            logStatus("Info", "Could not delete Access Grant Token with ID: " + id + ": " + event.result, "console");
        }
    }
}

// **************************               AT RELATED                     **************************

// Stores the AT using Indexed DB. It is stored along with an ID.
// The decoded AT is saved as an object
function storeAt(at, id) {
    if (id == "" || id == null){
        id = "#" + crypto.randomUUID().slice(undefined, 8);
    }
    let parts = at.split(".");
    parts[0] = strDecodeBase64URLSafe(parts[0]);
    parts[1] = strDecodeBase64URLSafe(parts[1]);
    let atExtended = {
        tokenId: id,
        encoded : at,
        header: JSON.parse(parts[0]),
        payload: JSON.parse(parts[1])
    }
    request = window.indexedDB.open("TokenDB", 1);
    request.onerror = function (event) {
        logStatus("Error", "Error with client TokenDB", "console");
        console.error(event);
        window.alert("Error using client TokenDB");
    }
    request.onsuccess = function (event) {
        var db = event.target.result;
        let putrequest = db.transaction("ATStorage", "readwrite").objectStore("ATStorage").put(atExtended);
        putrequest.onerror = function (event) {
            logStatus("Error", "Could not save AT in TokenDB: " + event, "console")
            window.alert("Could not store AT")
        }
        putrequest.onsuccess = function (event) {
            window.alert("AT Stored");
            logStatus("Info", "AT Stored in TokenDB", "console");
        }
    }
}

// Obtains all the Access Tokens avaliable
// A promise is returned, that returns an array of extendedAts if resolved
function getAtList(){
    return new Promise(function(resolve,reject){    
        logStatus("Info", "Obtaining AT List from Token DB", "console");
        request = window.indexedDB.open("TokenDB", 1);  // Request to open the token db
        request.onerror = function (event) {
            reject(event);
            logStatus("Error", "AT List could not be obtained: error in Token DB: " +event , "console");
        }
        request.onsuccess = function (event) {     // If db is avaliable
            var atList = [];   // Array containing the agts
            var db = event.target.result;   // Database
            // Creates transactions, request for an object store, then get the index "keypath"
            var storeIndex = db.transaction("ATStorage", "readonly").objectStore("ATStorage").index("tokenId");
            let cursor = storeIndex.openCursor();
            cursor.onsuccess = function(event) {   // Open cursor to iterate
                var cursor = event.target.result;
                if (cursor){    // If cursor is a value
                    atList.push(cursor.value);
                    cursor.continue();
                } else{
                    logStatus("Info", "AT List Obtained", "console");
                    resolve(atList);
                }
            }
            cursor.onerror = function(event){
                logStatus("Error", "AT List could not be obtained: " +event , "console");
                reject(event)
            }
        }
    })
}

function deleteAt(id){
    logStatus("Info", "Deleting Access Token with ID: " + id, "console");
    dbrequest = window.indexedDB.open("TokenDB", 1);  // open db 
    dbrequest.onerror = function (event){
        logStatus("Info", "Can not delete AT: " + event.value, "console");
    }
    dbrequest.onsuccess = function(){
        var db = dbrequest.result;// gets db
        var deleteRequest = db.transaction("ATStorage", "readwrite").objectStore("ATStorage").delete(id);
        deleteRequest.onsuccess = function (event){
            logStatus("Info", "Access Token with ID: " + id + " deleted successfully", "console");
        }
        deleteRequest.onerror = function (event){
            logStatus("Info", "Could not delete Access Token with ID: " + id + ": " + event.result);
        }
    }
}

// **************************               PURPOSELIST RELATED             **************************


// Purpose List to obtain
var purposeList;
initPurposeList();
// Initializes the Purpose List
function initPurposeList(){
    logStatus("Debug", "Obtaining purpose list", "console");
    let xhr = new XMLHttpRequest(); // Creates request
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) { // Successful ended request
            let toJson = JSON.parse(xhr.responseText);
            purposeList = toJson.purposes;
            logStatus("Debug", "Purpose List obtained", "console");
        } else if (xhr.readyState == 4) { // Unsuccessful ended request
            logStatus = ("Debug", "Could not get Purpose List, xhr status: " + xhr.status, "console");
        }
    }
    xhr.open('GET', 'specs/purposelist.json');
    xhr.send();
}

// Checks if a signal is included in the purposelist
// If included, an array including all the purposes including that signal is returned
// If not included, an empty array is returned
function getPurposesContainingSignal(signal){
    var purposes = [];
    for (var purpose in purposeList){   // Iterates all the purposes in the purpose list
        if (purpose.signal_access.length == undefined){ // If the purpose contains a single signal
            if (purpose.signal_access.path == signal){
                purposes.push(purpose);
            }
        } else {
            for (var signalSet in purpose.signal_access){ // If the purpose contains a set of signals
                if (signalSet.path == signal){
                    purposes.push(purpose);
                    break;
                }
            }
        }
    }
    return purposes;
}

// Check if a token containing the purpose is avaliable
function getTokenForPurpose(){

}