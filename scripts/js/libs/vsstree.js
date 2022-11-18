// Library to deal with the nodes of the VSSTree


// Obtains VSS tree in node structure 

/*export */class VssNode {     
    constructor(parent){
        this.parent = parent;
    };
    Name;   //string
    NodeType; // Sensor, Actuator, Attribute, Branch
    Uuid; //string
    Description; //string
    DataType; // Nodetypes
    Min; //string
    Max; //string
    Unit; //string
    Allowed; //uint8
    AllowedDef; //[]string
    DefaultAllowed; //string
    Validate = null; // number ()
    Children; // number of children
    Parent = null; // Node_t
    Child = []; 

    // Getters
    getUrl(){
        if (this.parent == null){
            return this.Name;
        } else {
            return this.parent.getUrl() + "/" + this.Name;
        }
    }
}

//var VssTree;


// ***************      IMPORT USING HTTP STATIC METADATA GET REQUEST       ***************

    // Initializes VSS Tree using HTTP STATIC-METADATA get request
    /*export */function httpTreeInit(firstNode){
        httpRequestNode(firstNode);
    }

    // Request the node with the given name from the VISS server
    function httpRequestNode(node){
        let getUrl = getVissHttpUrl() + "/" + node.getUrl() + '?filter={"type":"static-metadata", "value":""}';
        $.ajax({
            dataType: "json",
            url: getUrl,
            method: 'GET',
            async: false
        }).done(function (data) {
            if (data.hasOwnProperty("metadata")) {
                data = data.metadata;
                metadataToNode(data, node);
                for (let child in node.Child) {
                    httpRequestNode(node.Child[child]);
                }
            } else if (data.hasOwnProperty("error")) {
                console.log("Error: " + data.error.message + " " + data.error.reason);
            } else {
                console.log("Error: " + data);
                console.log(data);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Error: " + textStatus + " " + errorThrown + " " + getUrl);
        }); 
    }

    // Receives metadata from VISS server in json format,
    // and fills the given node with the metadata
    function metadataToNode(data, node) {
        if (data.hasOwnProperty(node.Name)) {
            data = data[node.Name];
            node.NodeType = data.type;
            node.DataType = data.datatype;
            node.Description = data.description;

            let i = 0;
            for (let child in data.children) {
                let childNode = new VssNode(node);
                childNode.Name = child;
                childNode.Parent = node;
                node.Child.push(childNode);
                metadataToNode(data.children[child], node.Child[i]);
                i++;
            }

            node.Children = node.Child.length != undefined ? node.Child.length : 0;
        }
    }

// ***************      END OF IMPORT USING HTTP STATIC METADATA REQUEST    ***************

// ***************      IMPORT USING WS STATIC METADATA  REQUEST            ***************

    // Initializes VSS Tree using HTTP STATIC-METADATA get request
    /*export */function wsTreeInit(firstNode){
        let requestNodeMap = new Map; // Map of request ids to nodes
        logStatus("Info", "Opening WebSocket Connection to "+ wsURL);
        let treeSocket = new WebSocket(wsURL, "VISSv2");
        treeSocket.onmessage = function(event){ 
            //console.log("WS Data Received from: " + event.origin + " Data: " + event.data);
            wsResponseFillNode(JSON.parse(event.data), requestNodeMap, treeSocket);
        }
        treeSocket.onopen = function() {
            console.log("Opened WebSocket Connection to " + wsURL);
            wsRequestNode(firstNode, requestNodeMap, treeSocket);
        }
        treeSocket.onclose = function(event) {
            console.log("WebSocket Connection closed");
        }
        treeSocket.onerror = function(event){
            logStatus("Error", "WebSocket Connection error");
            console.log("WS Error: ");
            console.log(event);
        }
    }

    // Request the node with the given name from the VISS server
    function wsRequestNode(node, requestNodeMap, treeSocket){
        // Random number from 0 to 1000000 for the request id
        let requestId = Math.floor(Math.random() * 1000000);
        // Adds the request id to the map with the node
        requestNodeMap.set(requestId, node);
        // Generate and send the request
        let request = {
            "action": "get",
            "path": node.getUrl(),
            "requestId": requestId,
            "filter": { "type": "static-metadata", "value": "" }
        };
        treeSocket.send(JSON.stringify(request));
    }

    // The node is filled with the metadata received
    // The node to fill is identified using the received request id, which is associated
    // to the node in the requestNodeMap
    function wsResponseFillNode(response, requestNodeMap, treeSocket){
        if (response.hasOwnProperty("requestId")){
            let reqNode = requestNodeMap.get(response.requestId);
            // If the response does not correspond to any awaited request, it is ignored
            if (reqNode != undefined){
                if (response.hasOwnProperty("error")){
                    console.log("Received error");
                } else {
                    if (response.hasOwnProperty("metadata")){
                        let metadata = response.metadata;
                        metadataToNode(metadata, reqNode);
                        for (let child in reqNode.Child) {
                            wsRequestNode(reqNode.Child[child], requestNodeMap, treeSocket);
                        }
                    }
                }
            }
        }
    }

// ***************      END OF IMPORT USING WS STATIC METADATA REQUEST      *************** 

//  **************      METADATA CONVERSION TOOL FOR HTTP AND WS            ***************

    // Receives metadata from VISS server in json format,
    // and fills the given node with the metadata
    function metadataToNode(data, node) {
        if (data.hasOwnProperty(node.Name)) {
            data = data[node.Name];
            node.NodeType = data.type;
            node.DataType = data.datatype;
            node.Description = data.description;

            let i = 0;
            for (let child in data.children) {
                let childNode = new VssNode(node);
                childNode.Name = child;
                childNode.Parent = node;
                node.Child.push(childNode);
                metadataToNode(data.children[child], node.Child[i]);
                i++;
            }

            node.Children = node.Child.length != undefined ? node.Child.length : 0;
        }
    }
//  **************      END OF METADATA CONVERSION TOOL                     ***************

//  **************      IMPORT FROM VSSPATHLIST JSON FILE                   ***************
    // Initializes VSS Tree using vsspathlist.json file
    // generated by the VISSv2 server
    /*export */function fileTreeInit(firstNode){
        $.ajax({
            dataType: "json",
            url: "specs/vsspathlist.json",
            method: 'GET',
            async: false
        }).done(function (data) {
            if (data.hasOwnProperty("LeafPaths")) {
                let jsonNodes = pathListJSON(data.LeafPaths);
                let firstJsonNode = Object.entries(jsonNodes)[0];
                jsonToNode(firstJsonNode, firstNode);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Error: " + textStatus + " " + errorThrown);
        });     
    }

    // Convert from JSON to VSS Node
    /*export */function jsonToNode(jsonNode, node){
        node.Name = jsonNode[0];
        if (jsonNode[1] != undefined){
            let nodeChilds = Object.entries(jsonNode[1]);
            node.Children = nodeChilds.length;
            for (let i = 0; i < node.Children; i++){
                let childNode = new VssNode(node);
                jsonToNode(nodeChilds[i], childNode);
                node.Child.push(childNode);
            }
        }
    }

    // Converts from URL list format to json object 
    function pathListJSON(urlList){
        let pathlist = {};
        let helper = {};
        for (let i = 0; i < urlList.length; i++){
            let slices = urlList[i].split(".");
            let ant = undefined;
            for (let n = slices.length; n >= 1 ; n--){
                helper = {};
                helper[slices[n - 1]] = ant;
                ant = helper;
            }
            pathlist = deepmerge(pathlist, helper);
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


//  **************      END IMPORT FROM VSSPATHLIST JSON FILE               ***************

// Returns the validate string of the node
/*export */function intToValidate(val){
    switch (val) {
        case 1:
            return "write-only";
        case 2:
            return "read-write";
        default:
            return undefined;
    }
}

// Returns the validate int of the node
/*export */function validateToInt(val){
    switch (val) {
        case "write-only":
            return 1;
        case "read-write":
            return 2;
        default:
            return 0;
    }
}