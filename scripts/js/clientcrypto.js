// Creates or initalizes the Database
var clientDbRequest = window.indexedDB.open("ClientDB", 1);
// Error management
clientDbRequest.onerror = function (event) {
    console.error("Error with Client Indexed DB");
    console.error(event);
    window.alert("Error using Client indexedDB");
}
// Used when creating a DB or changing its version number
clientDbRequest.onupgradeneeded = function (event) {
    var keyStore = clientDbRequest.result.createObjectStore("KeyStorage", { keyPath: "id" }); // Creates object store, key id is used as keyPath
}
clientDbRequest.onsuccess = function (event) {
}

// Uses IndexedDB + SubtleCrypto to generate a Keypair. RSA and ECDSA algorithms supported.
function generateClientKey(algorithm) {
    request = window.indexedDB.open("ClientDB", 1);
    request.onerror = function (event) {
        logStatus("Error", "Error with client Indexed DB", "console");
        console.error(event);
        window.alert("Error using client indexedDB");
    }
    request.onsuccess = function (event) {
        var db = event.target.result;
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
                    db.transaction("KeyStorage", "readwrite").objectStore("KeyStorage").put({ id: algorithm, keyPair: keyPair });
                    window.alert("RSA Key Pair Generated");
                    logStatus("Info", "RSA Key Pair generated", "console");
                    document.getElementById("rsaData").textContent = "RSA Avaliable";
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
                    db.transaction("KeyStorage", "readwrite").objectStore("KeyStorage").put({ id: algorithm, keyPair: keyPair })
                    window.alert("ECDSA Key Pair Generated");
                    logStatus("Info", "ECDSA Key Pair generated", "console");
                    document.getElementById("ecdsaData").textContent = "ECDSA Avaliable";
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
        request = window.indexedDB.open("ClientDB", 1);
        request.onerror = function (event) {
            logStatus("Error", "Error with client Indexed DB", "console");
            console.error(event);
            window.alert("Error using client indexedDB");
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

// Imports the key
function importPrivateKey(stringKey, algorithm){
    request = window.indexedDB.open("ClientDB", 1); // Open IndexedDatabase to store the key
    request.onerror = function (event) {
        logStatus("Error", "Error with client Indexed DB", "console");
        console.error(event);
        window.alert("Error using client indexedDB");
    }
    request.onsuccess = function (event) {  
        var db = event.target.result;
        var privateKey; // Stores the private key
        var arrBuffKey; // Stores the key as array buffer
        // Formats the key for import (substract header, footer and convert to arrayBuffer)
        const pemHeader = ["-----BEGIN PRIVATE KEY-----"];
        const pemFooter = ["-----END PRIVATE KEY-----"];
        if (stringKey.includes(pemHeader) && stringKey.includes(pemFooter)){    
            stringKey = stringKey.replace(pemHeader, "");
            stringKey = stringKey.replace(pemFooter, "");
            arrBuffKey = str2ab(window.atob(stringKey));    // base64 to binary, then to arraybuffer
        } else {    // In case the string key does not contain the head+foot
            logStatus("Error", "Private Key not imported: Invalid format", "console");
            window.alert("Could not import Key, invalid format");
            return;
        }
        // Imports depending on the algorithm used
        switch (algorithm) {
            case "RSA":
                // Obtains private key from the key as arraybuffer
                privateKey = window.crypto.subtle.importKey("pkcs8", arrBuffKey, {name:"RSASSA-PKCS1-v1_5", hash:"SHA-256"}, false, ["sign"]).then(
                    function(privateKey) {  // On success, generates the private key 
                        // Re-imports the private key with extractable claim fixed as "true", to use with generate Public Key, no need to check, the first worked
                        let privtoExport = window.crypto.subtle.importKey("pkcs8", arrBuffKey, {name:"RSASSA-PKCS1-v1_5", hash:"SHA-256"}, true, ["sign"]).then(
                            function(privtoExport){
                                publicKey = generatePublicKey(privtoExport).then( // Obtains the public key associated with the private key
                                function (publicKey){                            
                                    var keyPair = {
                                        privateKey: privateKey,
                                        publicKey: publicKey
                                    }
                                    db.transaction("KeyStorage", "readwrite").objectStore("KeyStorage").put({ id: algorithm, keyPair: keyPair });
                                    window.alert("RSA Key Imported");
                                    logStatus("Info", "RSA Key Pair imported correctly", "console");
                                    document.getElementById("rsaData").textContent = "RSA Avaliable";
                                }, function (publicKey){    // In case of failure obtaining public key
                                    window.alert("Could not import RSA Key");
                                    logStatus("Error", "RSA Key not imported: Error obtaining public key: " + publicKey, "console");
                                })
                            })
                }, function(privateKey) {
                        window.alert("Could not import RSA key");
                        logStatus("Error", "RSA Key Pair not imported: " + privateKey, "console");
                });
                break;
            case "ECDSA":
                privateKey = window.crypto.subtle.importKey("pkcs8", arrBuffKey, {name:"ECDSA", namedCurve:"P-256"}, false, ["sign"]).then(
                    function(privateKey) {
                        let privtoExport = window.crypto.subtle.importKey("pkcs8", arrBuffKey, {name:"ECDSA", namedCurve:"P-256"}, true, ["sign"]).then(
                            function(privtoExport){
                                publicKey = generatePublicKey(privtoExport).then( // Obtains the public key associated with the private key
                                function (publicKey){                            
                                    var keyPair = {
                                        privateKey: privateKey,
                                        publicKey: publicKey
                                    }
                                    db.transaction("KeyStorage", "readwrite").objectStore("KeyStorage").put({ id: algorithm, keyPair: keyPair });
                                    window.alert("ECDSA Key Imported");
                                    logStatus("Info", "ECDSA Key Pair imported correctly", "console");
                                    document.getElementById("ecdsaData").textContent = "ECDSA Avaliable";
                                }, function (publicKey){    // In case of failure obtaining public key
                                    window.alert("Could not import ECDSA Key");
                                    logStatus("Error", "ECDSA Key not imported: Error obtaining public key: " + publicKey, "console");
                                })
                            })                     
                }, function(privateKey) {
                        window.alert("Could not import ECDSA key");
                        logStatus("Error", "ECDSA Private Key not imported: " + privateKey, "console");
                });
                break;
            default:
                logStatus("Info","importKey: Invalid key type: " + algorithm, "console");
                break;
        }
    }
}

// Obtains a PublicKey Object from CryptoKey Private Object
function generatePublicKey(privateKey) {
    logStatus("Info", "Getting public key from private key", "console");
    return new Promise (function (resolve, reject){
        let pubKey;
        jwKey = window.crypto.subtle.exportKey("jwk", privateKey).then( // Exports to JWK, then delete private claims    
            function(jwKey){    // On success, delete private claims and return public key
                delete (jwKey.ext);
                delete (jwKey.key_ops);
                delete (jwKey.d);
                switch (privateKey.algorithm.name){
                    case "RSASSA-PKCS1-v1_5":   
                        delete (jwKey.dp);
                        delete (jwKey.dq);
                        delete (jwKey.p);
                        delete (jwKey.q);
                        delete (jwKey.qi);
                        resolve(window.crypto.subtle.importKey("jwk", jwKey, {name:"RSASSA-PKCS1-v1_5", hash: "SHA-256"}, true, [])); // Imports public key in jwk obtained
                        break;
                    case "ECDSA":
                        delete (jwKey.alg);
                        resolve(window.crypto.subtle.importKey("jwk", jwKey, {name:"ECDSA", namedCurve: "P-256"}, true, [])); // Imports public key in jwk obtained
                        break;
                }
            }, function(jwKey){ // Returns failed promise if it does not success
                    reject (jwKey);   
            });
    });
}

// Exports the saved key as a file
async function downloadPublicKey(algorithm) {
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
    pom.setAttribute('download', algorithm+"_client_key.pub");
    pom.click();
    logStatus("Info", "Public Key File Generated and Exported", "console")
}

// Returns the public key in jwk format
async function getPublicJwk(algorithm){
    let keyPair = await getKeyAsync(algorithm);
    if (keyPair == null){
        logStatus("Error", "No key avaliable", "console");
        return null;
    }
    let publicJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);   
    delete(publicJwk.alg);
    delete(publicJwk.ext);
    delete(publicJwk.key_ops);
    publicJwk.use = "sign";
    return publicJwk;
}

// Generates the thumprint of the public key
async function getPublicThumbprint(algorithm){
    let jwk;
    let thumbprint = "";
    switch (algorithm){
        case "RS256":
        case "RSA":
            jwk = await getPublicJwk("RSA");
            thumbprint = jsonRecursiveEncoding("e", jwk.e, thumbprint);
            thumbprint = jsonRecursiveEncoding("kty", jwk.kty, thumbprint);
            thumbprint = jsonRecursiveEncoding("n", jwk.n, thumbprint);
            break;
        case "ES256":
        case "ECDSA":
            jwk = await getPublicJwk("ECDSA");
            thumbprint = jsonRecursiveEncoding("crv", jwk.crv, thumbprint);
            thumbprint = jsonRecursiveEncoding("kty", jwk.kty, thumbprint);
            thumbprint = jsonRecursiveEncoding("x", jwk.x, thumbprint);
            thumbprint = jsonRecursiveEncoding("y", jwk.y, thumbprint);
            break;
        default:
            return;
    }
    const hashed = await crypto.subtle.digest("SHA-256", str2ab(thumbprint));
	return strEncodeBase64URLSafe(ab2str(hashed));
}


// Checks the existance of a key using the given algorithm
function checkKeyAsync(algorithm){
    return new Promise(function(resolve){
        // Opens the database
        request = window.indexedDB.open("ClientDB", 1);
        request.onerror = function (event) {
            logStatus("Error", "Error with client Indexed DB", "console");
            console.error(event);
            window.alert("Error using client indexedDB");
            resolve(false);
            return;
        }
        // If no error opening the database, makes the request to the database
        request.onsuccess = function (event) {
            let getRequest = request.result.transaction("KeyStorage", "readonly").objectStore("KeyStorage").get(algorithm)
            getRequest.onerror = function(event){
                logStatus("Info", "checkKey: error reading key "+ algorithm+ " : " + event, "console");
                resolve(false);
                return;
            }
            getRequest.onsuccess = function(event){
                if (getRequest.result == undefined){
                    resolve(false);
                    return;
                }
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

// Generates pop from data obtained from HTML code or uses defaults
async function generatePop(algorithm){    
    const alg = (algorithm == undefined)? document.getElementById("sign_type").value : algorithm;
	var header =  {
		typ : "dpop+jwt",
		alg : alg,
		jwk : ""
	}
	var payload = {
		aud : "",
		iat : "",
		jti : crypto.randomUUID()
	}

    // If there is an item with id "pop_jti", it allows the user to customize the jti for debugging
    if (document.getElementById("pop_jti") != null && document.getElementById("pop_jti").value != "auto"){
        payload.jti = document.getElementById("pop_jti").value;
    }

	// There should an HTML element with id "pop_aud" to allow to set the audience of the token
    if (document.getElementById("pop_aud")!= null){
        payload.aud = document.getElementById("pop_aud").value;
    } 

    payload.iat = Number.parseInt(Date.now() / 1000) // From unix ms to seconds
	// If there is an item with id "pop_iat", it allows the user to customize the iat for debugging
    if (document.getElementById("pop_iat") != null && document.getElementById("pop_iat").value != "auto"){
        let iatModifier = document.getElementById("pop_iat").value;
        if (iatModifier.charAt() == "+"){
            iatModifier = iatModifier.replace("+", "");
            payload.iat = payload.iat + parseInt(iatModifier);
        } else if (iatModifier.charAt() == "-"){
            iatModifier = iatModifier.replace("-", "");
            payload.iat = payload.iat - parseInt(iatModifier);
        } 
    } 
    payload.iat = payload.iat.toString();

    // Signing depends on the algorithm
    let signature;
    let headpluspayload;
    switch (header.alg){
        case "RS256":
            header.jwk = await getPublicJwk("RSA");
            let rsakey = await getKeyAsync("RSA");
            headpluspayload = strEncodeBase64URLSafe(JSON.stringify(header)) + "." + strEncodeBase64URLSafe(JSON.stringify(payload));
            signature = await window.crypto.subtle.sign(
                "RSASSA-PKCS1-v1_5", 
                rsakey.privateKey,
                str2ab(headpluspayload)
            );
        break;
        case "ES256":
            header.jwk = await getPublicJwk("ECDSA");
            let eckey = await getKeyAsync("ECDSA");
            headpluspayload = strEncodeBase64URLSafe(JSON.stringify(header)) + "." + strEncodeBase64URLSafe(JSON.stringify(payload));
            signature = await window.crypto.subtle.sign(
                {
                name: "ECDSA",
                hash: {name: "SHA-256"}
                },
                eckey.privateKey,
                str2ab(headpluspayload)
            );
        break;
        default:
            window.alert("Call to generatePop with unvalid alg: " + header.alg);
            return;
    }
    signature = strEncodeBase64URLSafe(ab2str(signature));  //From array buffer to string and then base64
    return headpluspayload + "." + signature;
} 