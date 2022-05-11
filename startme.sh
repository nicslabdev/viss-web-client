#!/bin/bash
#
# VISS-MANAGER launcher
# Copyright (C) 2022  NICS Lab, University of Malaga
# Author: Jose Jesus Sanchez Gomez, sanchezg@lcc.uma.es
#

SCREEN_NAME="VISSWebServer"

function usage {
    echo "usage: $0 -run:  Initializes and run the webserver"
    echo "                    -stop: Stops the webserver"
    exit 1
}

case $1 in

  "-run")
    cd $(dirname "${BASH_SOURCE[0]}")
    echo "$0: Compiling WASM file"
    GOARCH="wasm" GOOS="js" go build -o scripts/go/golib.wasm scripts/go/gofuncs.go
    if [ $? != 0 ]
    then
        echo "$0: Can not compile go WASM file, try manually"
        exit
    fi
    echo "$0: WASM file compiled"
    go build -o server server.go
    echo "$0: Building web server"
    if [ $? != 0 ]
    then
        echo "$0: Can not compile web server, try manually"
        exit
    fi
    echo "$0: Web Server compiled"
    # Screen for webserver
    screen -X -S $SCREEN_NAME quit
    screen -wipe
    screen -dmSL $SCREEN_NAME bash -c "go run server.go" 
    screen -list
    ;;

  "-stop")
    echo "Stopping Web Server"
    screen -X -S $SCREEN_NAME quit
    sleep 1
    screen -wipe
    ;;

  *)
    usage
    ;;
esac