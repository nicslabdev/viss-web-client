// Server urls
var urlMap;
// Used to set the addresses of the different servers
initAddress();
function setAddress(){
    urlMap = {
        AgtPort: document.getElementById("agt_port").value,
        AgtIp: document.getElementById("agt_ip").value,
        AtIp: document.getElementById("at_ip").value,
        AtPort: document.getElementById("at_port").value,
        VissIp: document.getElementById("viss_ip").value,
        VissHttpPort: document.getElementById("viss_http_port").value,
        VissWsPort: document.getElementById("viss_ws_port").value,
        tls: location.protocol == "https:"
    }
    var JsonUrls = JSON.stringify(urlMap);
    window.localStorage.setItem("server_urls", JsonUrls);
    window.alert("Server Addresses has been setted")
}
// Initializes the stored addresses of the servers
function initAddress() {
    urlString = window.localStorage.getItem("server_urls");
    if (urlString != null){ // If the urls has been initialized already
        urlMap = JSON.parse(window.localStorage.getItem("server_urls"));
        if (document.getElementById("agt_port") != null){ // Shows the urls, only in index
            document.getElementById("agt_port").value = urlMap.AgtPort;
            document.getElementById("agt_ip").value = urlMap.AgtIp;
            document.getElementById("at_ip").value = urlMap.AtIp;
            document.getElementById("at_port").value = urlMap.AtPort;
            document.getElementById("viss_ip").value = urlMap.VissIp;
            document.getElementById("viss_http_port").value = urlMap.VissHttpPort;
            document.getElementById("viss_ws_port").value = urlMap.VissWsPort; 
        }
        urlMap = JSON.parse(urlString);
    } else {
        setAddress();
    } 
}
// Used to show the different sections of the page
function getVissHttpUrl(){
    return (urlMap.tls ? "https://" : "http://") + urlMap.VissIp + ":" + urlMap.VissHttpPort;
}

// Useful scripts for HTML elements
function showId(id){
    document.getElementById(id).style.display = "block";
}
function hideId(id){
    document.getElementById(id).style.display = "none";
}
function checkId(id, checked){  // Checks an input, triggering the onchange event
    document.getElementById(id).checked = checked;
    let evnt = document.createEvent("HTMLEvents");
    evnt.initEvent("change", false, true);
    document.getElementById(id).dispatchEvent(evnt);
}
function triggerOnChange(id){
    let evnt = document.createEvent("HTMLEvents");
    evnt.initEvent("change", false, true)
    document.getElementById(id).dispatchEvent(evnt);
}