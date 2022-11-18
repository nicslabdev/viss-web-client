const acceptedHttpStatus = [200, 304, 400, 401, 403, 404, 406, 429]; //502, 503, 504

// Makes a request to the HTTP server to check if it responds
// Returns a promise with the time it took to receive the response 
// Or a rejected promise if there was an error
const checkHttpConnection = (url, port, sec) => {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.open("GET", "http" + (sec?"s":"") + "://" + url + ":" + port + "/ping", false);
        req.onreadystatechange = () => {
            if (req.readyState === 4) {
                // Dont care if the request was successful or not
                // If a response was received, the connection is working
                // Only accept responses with error status included in the specification
                if (acceptedHttpStatus.includes(req.status)) {
                    let responseTime = Date.now() - req.start;
                    console.log("Received response from " + url + ":" + port + " in " + responseTime + "ms");
                    resolve(responseTime);
                } else {
                    console.log("Error with HTTP connection");
                    reject("Connection error");
                }
            }
        };
        req.start = Date.now();
        console.log("Sending request to " + url + ":" + port +  " at " + req.start);
        req.send();
    });
}

// Establishes a WebSocket connection with the server 
// Returns a promise with the time it took to establish the connection 
// Or a rejected promise if there was an error
const checkWsConnection = (url, port, sec) => {
    // Checks connection using VISSv2 as sub-protocol
    const checkVissV2 = (url, port, sec) => {
        return new Promise((resolve, reject) => {
            let start = Date.now();
            console.log("Estabilishing VISSv2 WS connection to " + url + ":" + port +  " at " + start);
            let v2socket = new WebSocket("ws" + (sec?"s":"") + "://" + url + ":" + port, "VISSv2");
            v2socket.onopen = () => {
                let responseTime = Date.now() - start;
                console.log("Opened websocket using VISSv2 protocol to " + url + ":" + port + " in " + responseTime + "ms");
                v2socket.close();
                resolve(responseTime);
            };
            v2socket.onerror = () => {
                let responseTime = Date.now() - start;
                console.log("WebSocket connection using VISSv2 protocol with " + url + ":" + port +  " could not be stablished");
                reject("Connection error");
            };
        });
    };

    const checkVissV1 = (url, port, sec) => {
        // Check if the server is using VISSv1 as sub-protocol
        return new Promise((resolve, reject) => {
            let start = Date.now();
            console.log("Estabilishing VISSv1 WS connection to " + url + ":" + port +  " at " + start);
            let v2socket = new WebSocket("ws" + (sec?"s":"") + "://" + url + ":" + port, "wvss1.0");
            v2socket.onopen = () => {
                let responseTime = Date.now() - start;
                console.log("Opened websocket using VISSv1 protocol to " + url + ":" + port + " in " + responseTime + "ms");
                v2socket.close();
                resolve(responseTime);
            };
            v2socket.onerror = () => {
                let responseTime = Date.now() - start;
                console.log("WebSocket connection using VISSv1 protocol with " + url + ":" + port +  " could not be stablished");
                reject("Connection error");
            };
        });
    };
    
    return new Promise((resolve, reject) => {
       (checkVissV2(url, port, sec))
         .then((responseTime) => {
                resolve({
                            protocol: "VISSv2", 
                            responseTime: responseTime
                });
            })
         .catch(() => {
                (checkVissV1(url, port, sec))
                .then((responseTime) => {
                    resolve({
                            protocol: "VISSv1",
                            responseTime: responseTime
                    });
                })
                .catch(() => {
                    reject("Connection error");
                });
            });
    });
}