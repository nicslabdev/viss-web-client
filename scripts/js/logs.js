function timeConv(tim){
    if (tim < 10){
        return "0"+tim;
    } else {
        return tim;
    }
}

function logStatus(typ, data) {
    let current = new Date();
    var date = timeConv(current.getDate())+"/"+timeConv((1 + current.getMonth()))+"/"+current.getFullYear()
    +", "+timeConv(current.getHours())+":"+timeConv(current.getMinutes())+":"+timeConv(current.getSeconds());
    document.getElementById("log_data").innerHTML += date + " " + typ + ": " + data + "<br>";
}

function logReset() {
    document.getElementById("log_data").innerHTML = "";
}
function showLogs() {
    if (document.getElementById("log_switch").checked){
        document.getElementById("logs").style.display = "block";
    } else {
        document.getElementById("logs").style.display = "none";
    }
}