var externHostIp = document.getElementById("host-ip");
var hostIP = "localhost";
var postPath = document.getElementById("post-path");
var postValue = document.getElementById("post-value");
var postOutput = document.getElementById("post-output");

try {
    function sendPost() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                postOutput.innerHTML += "Server: " + this.responseText + "\n";
            }
        };
        var params = postValue.value;
        xhttp.open("POST", "http://" + hostIP + ":7500/" + postPath.value, true);
        xhttp.send(params);
        postPath.value = "";
        postValue.value = "";
    }
} catch(err) {
    postOutput.innerHTML += "Error. " + err.message + "\n";
}

try {
    function setHostIP() {
        hostIP = externHostIp.value;
    }
} catch(err) {
    getOutput.innerHTML += "Host IP error. " + err.message + "\n";
}


