// This file contains scripts used to obtain data from the servers using the VISS Protocol.

// Obtains the list of avaliable signals form the server as a JSON object
// A promise is returned, so the function can be used with async/await
function getSignalList() {
  return new Promise((resolve, reject) => {
    // The first request is made to the signal /Vehicle
    // This request is made to the server to obtain the list of avaliable signals on the first branch
    // The server will respond with a metadata response containing the Vehicle Signal data and its childrens
    let signalList;
    let xhr = new XMLHttpRequest();
    let reqURL = getVissHttpUrl() + '/Vehicle?filter={"type":"static-metadata", "value":""}';
    xhr.open('GET', reqURL, true);
    xhr.onload = function () {
        if (this.status == 200) {
            // The response is parsed into a JSON object
            signalList = jsonParse(this.response);
            // If the server says there is an error
            if (signalList.error != null){
                reject(signalList.error);
            } else { // If there is no error
                signalList.path = '/Vehicle'; // path is added to the parent node
                // Children nodes are filled
                fillBranch(signalList);
                // The promise is resolved with the signal list that is pendant to be filled
                resolve(signalList);
            }
        } else {
            // If the request fails, the promise is rejected
            reject({"message":"Error filling SignalList", "reason":"First Request failed"});
        }
    };
    xhr.onerror = function () {
        reject({"message":"Error filling SignalList", "reason":"First Request failed"});
    };
    xhr.send();
  });
}

function fillBranch(branch){
    for (let child in branch.children){
        if(child.type == 'branch'){
            let xhr = new XMLHttpRequest();
            xhr.open('GET', getVissHttpUrl() + branch.path +'/' + child + '?filter={"type":"static-metadata", "value":""}');
            xhr.onload = () => {
                if (xhr.status == 200) {
                    let jsonResp = jsonParse(xhr.responseText);
                    if (jsonResp.error != null){
                        // Request failed
                    } else {
                        branch.children[child] = jsonResp; 
                        branch.children[child].path = branch.path + '/' + child;
                        fillBranch(branch.children[child]);
                    }
                } else {
                    // Request failed
                }
            }
            xhr.onerror = () => {
                // Request failed
            }
            xhr.send();
            // A bad response is ignored, since we got the first node of the path
        } else {
            branch.children.child.path = branch.path + '/' + child;
        }
    }
}