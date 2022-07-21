function jsonRecursiveEncoding(claim, value, encoded){
    let data
    if ((claim == "") || (value == "")){
        return encoded
    }
    if (encoded.slice(0,1)!= "{"){
        data = '{"' + claim + '":"' + value + '"}'
    } else{
        data = encoded.slice(0, encoded.length - 1)
        data += ',"' + claim + '":"' + value + '"}'
    }
    return data
}

function jsonPrettify(jsonraw, indexation){
    let jsonObj = JSON.parse(jsonraw)
    if (indexation == undefined){
        indexation = "\t"
    }
    return JSON.stringify(jsonObj, null, indexation)
}

function jwtPretty(jwtraw, indexation){
    let jwtsplit
    jwtsplit = jwtraw.split(".",2)
    if (jwtsplit[0] == jwtraw){
        return jsonPrettify(jwtraw, indexation)
    }
    header = atob(jwtsplit[0])
    payload = atob(jwtsplit[1])
    return [jsonPrettify(header, indexation), jsonPrettify(payload, indexation)]
}

function pathListJson(data){
    let jsData = JSON.parse(data);
    let pathlist = {};
    let help = {};
    for (let i = 0; i < jsData.length; i++){
        let slices = jsData[i].split(".");
        let ant = undefined;
        for (let n = slices.length; n >= 1 ; n--){
            help = {};
            help[slices[n - 1]] = ant;
            ant = help;
        }
        pathlist = deepmerge(pathlist, help);
    }
    return pathlist;
}

function deepmerge(foo, bar) {
    var merged = {};
    for (var each in bar) {
      if (foo.hasOwnProperty(each) && bar.hasOwnProperty(each)) {
        if (typeof(foo[each]) == "object" && typeof(bar[each]) == "object") {
          merged[each] = deepmerge(foo[each], bar[each]);
        } else {
          merged[each] = [foo[each], bar[each]];
        }
      } else if(bar.hasOwnProperty(each)) {
        merged[each] = bar[each];
      }
    }
    for (var each in foo) {
      if (!(each in bar) && foo.hasOwnProperty(each)) {
        merged[each] = foo[each];
      }
    }
    return merged;
}


//Convert an ArrayBuffer into a string
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
// Convert string into Array Buffer
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Prompts the user to open file, then returns its content
function pickReadFileAsync() {
  return new Promise(function(resolve){
      var elem = document.createElement('input');
      elem.style.display = 'none';
      elem.setAttribute('type', 'file');
      document.body.appendChild(elem);
      elem.onchange = function (){
          const reader = new FileReader();
          reader.onload = function () {
              resolve(reader.result);
              document.body.removeChild(elem);
          };
          reader.readAsBinaryString(elem.files[0]);
      }
      elem.click();
  })
}