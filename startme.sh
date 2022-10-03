#!/bin/bash
#
# VISS-MANAGER launcher
# Copyright (C) 2022  NICS Lab, University of Malaga
# Author: Jose Jesus Sanchez Gomez, sanchezg@lcc.uma.es
#

SCREEN_NAME="VISSWebClient"

function usage {
    echo "usage: $0 -run:  Initializes and run the webserver"
    echo "                    -runHTTPS: Starts webserver using HTTPS"
    echo "                    -stop: Stops the webserver"
    echo "Logs in screenlog.0 file"
    echo "Flag -p for port choosing"
    exit 1
}

case $1 in

  "-run")
    cd $(dirname "${BASH_SOURCE[0]}")
    echo "$0: Building web server"
    go build -o server server.go
    if [ $? != 0 ]
    then
        echo "$0: Can not compile web server, try manually"
        exit
    fi
    echo "$0: Web Server compiled"
    echo "$0: Launching web Server"
    # Screen for webserver
    screen -X -S $SCREEN_NAME quit
    screen -wipe
    screen -dmSL $SCREEN_NAME bash -c "./server" 
    screen -list
    ;;

    "-runHTTPS")
    cd $(dirname "${BASH_SOURCE[0]}")
    echo "$0: Building web server"
    go build -o server server.go
    if [ $? != 0 ]
    then
        echo "$0: Can not compile web server, try manually"
        exit
    fi
    echo "$0: Web Server compiled"
    echo "$0: Make sure cert.pem and serv_key.key files are present in .tls folderls"
    echo "$0: Launching web Server"
    # Screen for webserver
    screen -X -S $SCREEN_NAME quit
    screen -wipe
    screen -dmSL $SCREEN_NAME bash -c "./server -sec=yes" 
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