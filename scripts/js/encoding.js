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

