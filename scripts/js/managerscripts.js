// Server URLs
var urlMap;

// Creates or initalizes the Database
var mgmDbRequest = window.indexedDB.open("ManagementDB", 1);
// Error management
mgmDbRequest.onerror = function (event) {
    console.error("Error with manager Indexed DB");
    console.error(event);
    window.alert("Error using manager indexedDB");
}
// Used when creating a DB or changing its version number
mgmDbRequest.onupgradeneeded = function (event) {
    var store = mgmDbRequest.result.createObjectStore("KeyStorage", { keyPath: "id" }); // Creates object store, used to store the keys
    store.createIndex("DBKey", ["keyPair"], { unique: true });
}

mgmDbRequest.onsuccess = function (event) {
    /*var db = mgmDbRequest.result;
    var transaction = db.transaction("KeyStorage", "readwrite");

    var store = transaction.objectStore("KeyStorage");
    var rsaIndex = store.index("DBKey");

    store.put({ id: "key1", keyPair: "k1cont" });*/
}

// Uses IndexedDB + SubtleCrypto to generate a Keypair. RSA and ECDSA algorithms supported.
function generateKey(algorithm) {
    request = window.indexedDB.open("ManagementDB", 1);
    request.onerror = function (event) {
        logStatus("Error", "Error with manager Indexed DB", "console");
        console.error(event);
        window.alert("Error using manager indexedDB");
    }
    request.onsuccess = function (event) {
        logStatus("Info", "Indexed DB ok, generating " + algorithm + " key", "console");
        var keyPair;
        switch (algorithm) {
            case "RSA":
                keyPair = window.crypto.subtle.generateKey(
                    {
                        name: "RSASSA-PKCS1-v1_5",
                        modulusLength: 2048,
                        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                        hash: "SHA-256",
                    },
                    false,
                    ["sign"]
                ).then(function (keyPair) {
                    request.result.transaction("KeyStorage", "readwrite").objectStore("KeyStorage").put({ id: algorithm, keyPair: keyPair });
                    window.alert("RSA Key Pair Generated");
                    logStatus("Info", "RSA Key Pair generated", "console");
                });
                break;
            case "ECDSA":
                keyPair = window.crypto.subtle.generateKey( 
                    {
                        name: "ECDSA",
                        namedCurve: "P-256"
                    },
                    false,
                    ["sign"]
                ).then(function (keyPair) {
                    request.result.transaction("KeyStorage", "readwrite").objectStore("KeyStorage").put({ id: algorithm, keyPair: keyPair });
                    window.alert("ECDSA Key Pair Generated");
                    logStatus("Info", "ECDSA Key Pair generated", "console");
                });
                break;
            default:
                logStatus("Info","generateKey: Invalid key type: " + algorithm, "console");
                break;
        }
    }
}


// Returns the key with that algorithm
function getKeyAsync(algorithm){
    return new Promise(function(resolve){
        request = window.indexedDB.open("ManagementDB", 1);
        request.onerror = function (event) {
            logStatus("Error", "Error with manager Indexed DB", "console");
            console.error(event);
            window.alert("Error using manager indexedDB");
            resolve(null);
        }
        request.onsuccess = function (event) {
            let dbrequest = request.result.transaction("KeyStorage", "readonly").objectStore("KeyStorage").get(algorithm)
            dbrequest.onerror = function(event){
                logStatus("Info", "getKey: error reading key "+ algorithm+ " : " + event, "console");
                resolve(null);
            }
            dbrequest.onsuccess = function(event){
                let KeyPair = dbrequest.result.keyPair;
                resolve(KeyPair)
            }
        }
    })
}

// Exports the saved key
async function exportPublicKey(algorithm) {
    const KeyPair = await getKeyAsync(algorithm); // Gets the KeyPair object
    if (KeyPair == null){
        logStatus("Error", "Cannot export key, no key avaliable", "console");
        return null;
    }
    const exportedKey = await window.crypto.subtle.exportKey("spki", KeyPair.publicKey);    // Generates array buffer from keypair.publickey 
    const stringKey = ab2str(exportedKey);
    const Base64Key = window.btoa(stringKey)
    const pemKey = `-----BEGIN PUBLIC KEY-----\n${Base64Key}\n-----END PUBLIC KEY-----`;   // Exports to PEM
    console.log(pemKey)

    // Blob allows to create a "downloader" for the key
    var blob = new Blob([pemKey], { type: "application/x-pem-file" });
    var url = URL.createObjectURL(blob);
    var pom = document.createElement('a');
    pom.href = url;
    pom.setAttribute('download', algorithm+"_mgr_key.pub");
    //pom.click();
    logStatus("Info", "Public Key File Generated and Exported", "console")
}

// Checks the existance of a key using the given algorithm
function checkKeyAsync(algorithm){
    return new Promise(function(resolve){
        // Opens the database
        request = window.indexedDB.open("ManagementDB", 1);
        request.onerror = function (event) {
            logStatus("Error", "Error with manager Indexed DB", "console");
            console.error(event);
            window.alert("Error using manager indexedDB");
            resolve(false);
        }
        // If no error opening the database, makes the request to the database
        request.onsuccess = function (event) {
            let getRequest = request.result.transaction("KeyStorage", "readonly").objectStore("KeyStorage").get(algorithm)
            getRequest.onerror = function(event){
                logStatus("Info", "checkKey: error reading key "+ algorithm+ " : " + event, "console");
                resolve(false);
            }
            getRequest.onsuccess = function(event){
                console.log("Type: " + typeof(getRequest.result.keyPair));
                console.log("Result: " + getRequest.result.keyPair)
                if (Object.hasOwn(getRequest.result, 'keyPair')&&   // Checks if its KeyPair type
                Object.hasOwn(getRequest.result.keyPair, 'privateKey')
                && Object.hasOwn(getRequest.result.keyPair, 'publicKey')){
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        }
    })
}

function setAddress(){
    urlMap = {
        AgtPort: document.getElementById("agt_port").value,
        AgtUrl: document.getElementById("agt_url").value,
        AtUrl: document.getElementById("at_url").value,
        AtPort: document.getElementById("at_port").value,
        VissUrl: document.getElementById("viss_url").value,
        VissPort: document.getElementById("viss_port").value
    }
    var JsonUrls = JSON.stringify(urlMap);
    window.localStorage.setItem("mgm_urls", JsonUrls);
    window.alert("Server Addresses has been setted")
}

function initAddress() {
    urlMap = JSON.parse(window.localStorage.getItem("mgm_urls"));
}


/* NOT FUNCTIONAL
// Uses IndexedDB + SubtleCrypto to generate a Keypair. RSA and ECDSA algorithms supported.
async function importKey(algorithm) {
    var pemKey = await pickReadFileAsync(); // Reads content of file 
    var keyPair = await importPEMKey(pemKey, algorithm);  // Gets keypair object
    console.log(keyPair);
    request = window.indexedDB.open("ManagementDB", 1);
    request.onerror = function (event) {
        logStatus("Error", "Error with manager Indexed DB", "console");
        console.error(event);
        window.alert("Error using manager indexedDB");
    }
    request.onsuccess = function (event) {
        logStatus("Info", "Indexed DB ok, importing " + algorithm + " key", "console");
        
    }



    // Opens the database to store the key
    switch (algorithm){
        case "RSA":
        case "ECDSA":
        default:
    
    }
}*/
