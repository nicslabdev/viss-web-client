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
	port = flag.String("port", ":8080", "listen address")
	sec  = flag.String("sec", "no", "use TLS in HTTP or not")
)

func runHTTP() {
	log.Printf("HTTP server listening on %s...", *port)
	log.Fatal(http.ListenAndServe(*port, http.FileServer(http.Dir("."))))
}

func runHTTPS() {
	log.Printf("HTTP server listening on %s...", *port)
	log.Fatal(http.ListenAndServeTLS(*port, "server.crt", "server.key", http.FileServer(http.Dir("."))))
}

func main() {
	flag.Parse()
	if *sec == "no" {
		runHTTP()
	} else if *sec == "yes" {
		runHTTPS()
	} else {
		log.Fatal("Invalid sec claim")
	}
}
