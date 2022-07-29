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
	"io/fs"
	"log"
	"net/http"
	"strings"
)

var (
	port = flag.String("port", ":8008", "listen address")
	sec  = flag.String("sec", "no", "use TLS in HTTP or not")
)

// HTTP Server
func runHTTP() {
	log.Printf("HTTP server listening on %s...", *port)
	log.Fatal(http.ListenAndServe(*port, http.FileServer(http.Dir("."))))
}

// HTTPS Server
func runHTTPS() {
	log.Printf("HTTPS server listening on %s...", *port)
	log.Fatal(http.ListenAndServeTLS(*port, "", "", nil))
}

// Checks if file name starts in ".", if it does, nothing is served (protection vs certificate stealing)
func containsDotFile(name string) bool {
	parts := strings.Split(name, "/")
	for _, part := range parts {
		if strings.HasPrefix(part, ".") {
			return true
		}
	}
	return false
}

type dotFileHidingFile struct {
	http.File
}

func (f dotFileHidingFile) Readdir(n int) (fis []fs.FileInfo, err error) {
	files, err := f.File.Readdir(n)
	for _, file := range files { // Filters out the dot files
		if !strings.HasPrefix(file.Name(), ".") {
			fis = append(fis, file)
		}
	}
	return
}

type dotFileHidingFileSystem struct {
	http.FileSystem
}

func (fsys dotFileHidingFileSystem) Open(name string) (http.File, error) {
	if containsDotFile(name) { // If dot file, return 403 response
		return nil, fs.ErrPermission
	}

	file, err := fsys.FileSystem.Open(name)
	if err != nil {
		return nil, err
	}
	return dotFileHidingFile{file}, err
}

// Logs the requests

func main() {
	flag.Parse()
	fsys := dotFileHidingFileSystem{http.Dir(".")}
	http.Handle("/", http.FileServer(fsys))
	if *sec == "no" {
		runHTTP()
	} else if *sec == "yes" {
		runHTTPS()
	} else {
		log.Fatal("Invalid sec claim")
	}
}
