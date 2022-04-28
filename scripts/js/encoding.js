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