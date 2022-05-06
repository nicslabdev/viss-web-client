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