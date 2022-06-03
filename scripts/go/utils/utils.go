/**
*	VISS-MANAGER: utils
*
*	Copyright (C) 2022  NICS Lab, University of Malaga
*	Author: Jose Jesus Sanchez Gomez, sanchezg@lcc.uma.es
*
*	This program and all files in the repository at https://github.com/nicslabdev/viss-web-client
*	are distributed following the terms of the LICENSE file in the repository.
*
**/
package utils

import (
	"fmt"
	"runtime"
	"strconv"
	"syscall/js"
	"time"
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

func timeConv(tim int) string {
	if tim < 10 {
		return "0" + strconv.Itoa(tim)
	} else {
		return strconv.Itoa(tim)
	}
}

func Log(typ string, data string) {
	act_val := js.Global().Get("document").Call("getElementById", "log_data").Get("innerHTML")
	current := time.Now()
	datestr := timeConv(current.Day()) + "/" + timeConv(int(current.Month())) + "/" +
		timeConv(current.Year()) + ", " + timeConv(current.Hour()) + ":" + timeConv(current.Minute()) + ":" + timeConv(current.Second())
	dat := fmt.Sprint(act_val) + string(datestr) + " " + typ + ": " + data + "<br>"
	js.Global().Get("document").Call("getElementById", "log_data").Set("innerHTML", dat)
}
