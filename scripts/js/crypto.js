// Creates or initalizes the Database
var clientDbRequest = window.indexedDB.open("ClientDB", 1);
// Error management
clientDbRequest.onerror = function (event) {
    console.error("Error with manager Indexed DB");
    console.error(event);
    window.alert("Error using manager indexedDB");
}
// Used when creating a DB or changing its version number
clientDbRequest.onupgradeneeded = function (event) {
    var keyStore = clientDbRequest.result.createObjectStore("KeyStorage", { keyPath: "id" }); // Creates object store, used to store the keys
    keyStore.createIndex("DBKey", ["keyPair"], { unique: true });
    var agtStore = clientDbRequest.result.createObjectStore("AGTStorage", { keyPath: "id"});
    agtStore.createIndex("tokens", ["tokens"]);
    var atStore = clientDbRequest.result.createObjectStore("ATStorage", {keyPath: "id"});
    atStore.createIndex("tokens", ["tokens"]);
}

clientDbRequest.onsuccess = function (event) {
    /*var db = mgmDbRequest.result;
    var transaction = db.transaction("KeyStorage", "readwrite");

    var store = transaction.objectStore("KeyStorage");
    var rsaIndex = store.index("DBKey");

    store.put({ id: "key1", keyPair: "k1cont" });*/
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

// Stores the Token received in the correct database
function storeToken(tokenTyp, tokenId, token) {
    request = window.indexedDB.open("ClientDB", 1);
    request.onerror = function (event) {
        logStatus("Error", "Error with client Indexed DB", "console");
        console.error(event);
        window.alert("Error using client indexedDB");
    }
    request.onsuccess = function (event) {
        logStatus("Info", "Indexed DB ok, saving " + tokenTyp + " "  + id , "console");
        request.result.transaction(tokenTyp + "Storage", "readwrite").objectStore(tokenTyp + "Storage").put({ id: tokenId, tokens: token });
        logStatus("Info", "Token Stored" , "console");
    };           
}


// Generates pop from data obtained from HTML code or uses defaults
async function generatePop2(){    const alg = document.getElementById("sign_type").value;
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

	// If there is an item with id "pop_iat", it allows the user to customize the iat for debugging
    if (document.getElementById("pop_iat") != null && document.getElementById("pop_iat").value != "auto"){
        let iatModifier = document.getElementById("pop_iat").value;
        if (iatModifier.charAt() == "+"){
            iatModifier = iatModifier.replace("+", "");
            iat = Date.now() + parseInt(iatModifier);
        } else if (iatModifier.charAt() == "-"){
            iatModifier = iatModifier.replace("-", "");
            iat = Date.now() - parseInt(iatModifier);
        } else {
            payload.iat = iatModifier;
        }
    } else {
        payload.iat = Date.now();
    }

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
            window.alert("No algorithm selected");
            return;
    }
    console.log(signature)
    signature = strEncodeBase64URLSafe(ab2str(signature));  //From array buffer to string and then base64
    return headpluspayload + "." + signature;
} 