/**
*	VISS-MANAGER: utils
*
*	Copyright (C) 2022  NICS Lab, University of Malaga
*	Author: Jose Jesus Sanchez Gomez, sanchezg@lcc.uma.es
*
*	This program and all files in the repository at https://github.com/josesnchz/viss-manager
*	are distributed following the terms of the LICENSE file in the repository.
*
**/
package utils

import (
	"fmt"
	"runtime"
	"syscall/js"
)

func PrintErr(err interface{}) {
	pc, _, _, ok := runtime.Caller(1)
	details := runtime.FuncForPC(pc)
	if ok && details != nil {
		js.Global().Get("console").Call("log", fmt.Sprintf("Error in: %s: %s", details.Name(), err))
	} else {
		js.Global().Get("console").Call("log", fmt.Sprintf("Error: %s", err))
	}
}

func Print(data string) {
	js.Global().Get("console").Call("log", fmt.Sprint(data))
}

func Log(data string) {
	js.Global().Get("document").Call("log", data)
}
