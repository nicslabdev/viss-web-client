function timeConv(tim){
    if (tim < 10){
        return "0"+tim;
    } else {
        return tim;
    }
}

function logStatus(typ, data, logplace) {
    //if (typ == debug){return};
    let current = new Date();
    var date = timeConv(current.getDate())+"/"+timeConv((1 + current.getMonth()))+"/"+current.getFullYear()
    +", "+timeConv(current.getHours())+":"+timeConv(current.getMinutes())+":"+timeConv(current.getSeconds());
    let consoledata = typ + ": " + date + ", " + data
    let logdata = "<i>" + date + "</i><b>" + " " + typ + "</b>: " + data
    switch (logplace){
        case "console":
            console.log(consoledata);
            break;
        case "duo":
            console.log(consoledata)
            document.getElementById("log_data").insertAdjacentHTML("afterbegin", logdata + "<br>\n");
            //document.getElementById("log_data").innerHTML += logdata + "<br>";
            break;
        default:
            //document.getElementById("log_data").innerHTML += logdata + "<br>";
            if (document.getElementById("log_data") != null){
                document.getElementById("log_data").insertAdjacentHTML("afterbegin", logdata + "<br>\n");
            }
            break; 
    }
}

function logReset() {
    document.getElementById("log_data").innerHTML = "";
}
if (document.getElementById("log_switch") != null){
    document.getElementById("log_switch").addEventListener("input", showLogs);
}
function showLogs() {
    if (document.getElementById("log_switch").checked){
        document.getElementById("logs").style.display = "block";
    } else {
        document.getElementById("logs").style.display = "none";
    }
}