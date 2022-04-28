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
	listen = flag.String("listen", ":8080", "listen address")
	dir    = flag.String("dir", ".", "directory to serve")
)

func main() {
	flag.Parse()
	log.Printf("listening on %q...", *listen)
	log.Fatal(http.ListenAndServe(*listen, http.FileServer(http.Dir(*dir))))
}

// func main() {
// 	fs := http.FileServer(http.Dir(dir))
// 	log.Print("Serving " + dir + " on http://localhost:8080")
// 	http.ListenAndServe(":8080", http.HandlerFunc(func(resp http.ResponseWriter, req *http.Request) {
// 		resp.Header().Add("Cache-Control", "no-cache")
// 		if strings.HasSuffix(req.URL.Path, ".wasm") {
// 			resp.Header().Set("content-type", "application/wasm")
// 		}
// 		fs.ServeHTTP(resp, req)
// 	}))
// }
