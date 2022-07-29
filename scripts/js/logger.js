function timeConv(tim){
    if (tim < 10){
        return "0"+tim;
    } else {
        return tim;
    }
}

function logStatus(typ, data, logplace) {
    let current = new Date();
    var date = timeConv(current.getDate())+"/"+timeConv((1 + current.getMonth()))+"/"+current.getFullYear()
    +", "+timeConv(current.getHours())+":"+timeConv(current.getMinutes())+":"+timeConv(current.getSeconds());
    let logdata = date + " " + typ + ": " + data
    switch (logplace){
        case "console":
            console.log(logdata);
            break;
        case "duo":
            console.log(logdata)
            document.getElementById("log_data").insertAdjacentHTML("afterbegin", logdata + "<br>\n");
            //document.getElementById("log_data").innerHTML += logdata + "<br>";
            break;
        default:
            //document.getElementById("log_data").innerHTML += logdata + "<br>";
            document.getElementById("log_data").insertAdjacentHTML("afterbegin", logdata + "<br>\n");
            console.log 
            break; 
    }
}

function logReset() {
    document.getElementById("log_data").innerHTML = "";
}
document.getElementById("log_switch").addEventListener("input", showLogs);
function showLogs() {
    if (document.getElementById("log_switch").checked){
        document.getElementById("logs").style.display = "block";
    } else {
        document.getElementById("logs").style.display = "none";
    }
}