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
        protocol: location.protocol == "https:"
    }
    var JsonUrls = JSON.stringify(urlMap);
    window.localStorage.setItem("server_urls", JsonUrls);
    window.alert("Server Addresses has been setted")
}
// Initializes the stored addresses of the servers
function initAddress() {
    urlString = window.localStorage.getItem("server_urls");
    if (urlString != null){
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
    } else {
        setAddress();
    } 
}