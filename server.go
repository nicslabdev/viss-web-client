// GO BASIC FILE SERVER. SCRIPTS IN MAIN.
// Copyright (C) 2022  Jose Jesus Sanchez Gomez - NICS Lab, University of Malaga: sanchezg@lcc.uma.es

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package main

import (
	"flag"
	"log"
	"net/http"
)

var (
	port = flag.String("port", ":8008", "listen address")
	sec  = flag.String("sec", "no", "use TLS in HTTP or not")
)

// ServeMux for the HTTP Server
var servMux = http.NewServeMux()

// HTTP Server
func runHTTP() {
	//fsystem := noDotFileSystem{http.Dir(".")}
	//http.Handle("/", http.FileServer(fsystem))
	log.Printf("HTTP server listening on %s...", *port)
	log.Fatal(http.ListenAndServe(*port, servMux))
}

// HTTPS Server
func runHTTPS() {
	log.Printf("HTTPS server listening on %s...", *port)
	log.Fatal(http.ListenAndServeTLS(*port, ".tls/cert.pem", ".tls/serv_key.key", nil))
}

// Logs the requests

func main() {
	servMux.Handle("/", http.FileServer(http.Dir(".")))
	servMux.Handle("/.git/", http.NotFoundHandler())
	servMux.Handle("/.tls/", http.NotFoundHandler())
	flag.Parse()
	if *sec == "no" {
		runHTTP()
	} else if *sec == "yes" {
		runHTTPS()
	} else {
		log.Fatal("Invalid sec claim")
	}
}
