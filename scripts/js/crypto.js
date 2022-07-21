const clientKeyDB = window.indexedDB.open("")

/*
function generateRsa(index){
    keyPair = window.crypto.subtle.generateKey(
        {
            name: "RSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: "SHA-256",
        },
        false,
        ["sign"]
    ).then(function(key) {
        window.indexedDB.
    });





    window.crypto.subtle.generateKey()
}*/

/* NOT FUNCTIONAL
function importPEMKey(pemKey, algorithm){
    const pemHeader = "-----BEGIN RSA PRIVATE KEY-----";   // Exports to PEM
    const pemFooter = "-----END RSA PRIVATE KEY-----";
    //content = content.replaceAll("\n", "");
    content = pemKey.substring(pemHeader.length, pemKey.length - pemFooter.length);
    const decodedKey = window.atob(content);
    const binaryKey = str2ab(decodedKey);
    switch (algorithm) {
        case "RSA":
            return window.crypto.subtle.importKey(
                "pkcs8", 
                binaryKey, 
                {
                    name: "RSASSA-PKCS1-v1_5",
                    hash: "SHA-256"
                },
                false,
                ["sign"]
            )
            break; 
        case "ECDSA":
            return window.crypto.subtle.importKey( 
                "pkcs8",
                binaryKey,
                {
                    name: "ECDSA",
                    namedCurve: "P-256"
                },
                false,
                ["sign"]
            )
            break;
        default:
            logStatus("Info","generateKey: Invalid key type: " + algorithm, "console");
            return null;
            break;
    }
}*/

function exportRsa(){
    console.log("Not already implemented");
}
