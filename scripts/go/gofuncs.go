/**
*	VISS-MANAGER: main: File to be compiled to make use of the methods in js.
*
*	Copyright (C) 2022  NICS Lab, University of Malaga
*	Author: Jose Jesus Sanchez Gomez, sanchezg@lcc.uma.es
*
*	This program and all files in the repository at https://github.com/nicslabdev/viss-web-client
*	are distributed following the terms of the LICENSE file in the repository.
*
**/

// GOARCH=wasm GOOS=js go build -o golib.wasm main.go

package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"syscall/js"
	"time"

	"github.com/google/uuid"
	"github.com/nicslabdev/viss-web-client/scripts/go/utils"
)

var document js.Value

func getElementById(elem string) js.Value {
	return document.Call("getElementById", elem)
}

func getElementValue(elem string, value string) js.Value {
	return getElementById(elem).Get(value)
}

func Hide(elem string) {
	getElementValue(elem, "style").Call("setProperty", "display", "none")
}

func Show(elem string) {
	getElementValue(elem, "style").Call("setProperty", "display", "block")
}

func generateRsa(this js.Value, args []js.Value) interface{} {
	status := js.Global().Get("document").Call("getElementById", "rsaData")
	status.Set("textContent", "Generating RSA Key")
	privKey := utils.RsaGen2048()
	if privKey == nil {
		status.Set("textContent", "Internal error, key could not be generated")
		return nil
	}
	js.Global().Get("localStorage").Call("setItem", "rsaKey", utils.RsaPemPrivEncode(privKey))
	status.Set("textContent", "Key generated Correctly")
	return nil
}

func generateEcdsa(this js.Value, args []js.Value) interface{} {
	status := js.Global().Get("document").Call("getElementById", "ecdsaData")
	status.Set("textContent", "Generating ECDSA Key")
	privKey := utils.EcdsaGenP256()
	if privKey == nil {
		status.Set("textContent", "Internal error, key could not be generated")
		return nil
	}
	js.Global().Get("localStorage").Call("setItem", "ecdsaKey", utils.EcdsaPemPrivEncode(privKey))
	status.Set("textContent", "Key generated Correctly")
	return nil
}

// Generates pop from data obtained from HTML code or uses defaults
func generatePop(this js.Value, args []js.Value) interface{} {
	var header struct {
		Typ string    `json:"typ"`
		Alg string    `json:"alg"`
		Jwk utils.JWK `json:"jwk"`
	}
	header.Typ = "dpop+jwt" // Default value
	var payload struct {
		Aud string `json:"aud"`
		Iat string `json:"iat"`
		Jti string `json:"jti"`
	}
	var token string

	// If there is an item with id "pop_jti", it allows the user to customize the jti for debugging
	if chosenJti := js.Global().Get("document").Call("getElementById", "pop_jti"); !chosenJti.IsNull() {
		if value := chosenJti.Get("value").String(); value != "auto" {
			payload.Jti = value
		}
	}
	if payload.Jti == "" {
		if unparsedId, err := uuid.NewRandom(); err != nil {
			utils.PrintErr(err)
			// Can not generate uuid
			return ""
		} else {
			payload.Jti = unparsedId.String()
		}
	}

	// There MUST exist an item with id "pop_aud" by default
	if chosenAud := js.Global().Get("document").Call("getElementById", "pop_aud"); !chosenAud.IsNull() {
		payload.Aud = chosenAud.Get("value").String()
	} else {
		// NO AUD, should not happen
		payload.Aud = ""
	}

	// If there is an item with id "pop_iat", it allows the user to customize the iat for debugging
	if chosenIat := js.Global().Get("document").Call("getElementById", "pop_iat"); !chosenIat.IsNull() {
		if value := chosenIat.Get("value").String(); value != "auto" && value != "" {
			if addition := strings.TrimPrefix(value, "+"); addition != value {
				if add, err := strconv.Atoi(addition); err != nil {
					// Invalid IAT by user, using default
					payload.Iat = strconv.Itoa(int(time.Now().Unix()))
					utils.PrintErr(err)
				} else {
					timenow := int(time.Now().Unix())
					payload.Iat = strconv.Itoa(timenow + add)
				}
			} else if substraction := strings.TrimPrefix(value, "-"); substraction != value {
				if subs, err := strconv.Atoi(substraction); err != nil {
					payload.Iat = strconv.Itoa(int(time.Now().Unix()))
					// Invalid IAT by user, using default
					utils.PrintErr(err)
				} else {
					payload.Iat = strconv.Itoa(int(time.Now().Unix()) - subs)
				}
			} else {
				payload.Iat = value
			}
		}
	}
	if payload.Iat == "" {
		payload.Iat = strconv.Itoa(int(time.Now().Unix()))
	}

	alg := js.Global().Get("document").Call("getElementById", "sign_type").Get("value").String()
	switch alg {
	case "RS256":
		header.Alg = "RS256"
		if rsaPEM := js.Global().Get("localStorage").Call("getItem", "rsaKey"); rsaPEM.IsNull() {
			// There is no RSA key generated
			return ""
		} else {
			privKey := utils.RsaPemDecode(rsaPEM.String())
			if privKey == nil {
				// Error decoding RSA key
				return ""
			}
			header.Jwk.JWKGen(privKey.PublicKey)

			// Need to get the pub claim (pub key thumbprint)
			thumb := utils.JWKThumbprint(privKey.PublicKey)
			js.Global().Get("document").Call("getElementById", "jwk_thumb").Set("textContent", thumb)

			if bytHead, err := json.Marshal(header); err != nil {
				utils.PrintErr(err)
				// error marshalling header
				return ""
			} else {
				token = base64.RawURLEncoding.EncodeToString(bytHead)
			}
			if bytPayl, err := json.Marshal(payload); err != nil {
				utils.PrintErr(err)
				// error marshalling payload
				return ""
			} else {
				token = token + "." + base64.RawURLEncoding.EncodeToString(bytPayl)
			}
			signature := utils.RsaSign(token, privKey)
			if signature == "" {
				// Signature failed, more info in logs
				return ""
			} else {
				return token + "." + signature
			}
		}
	case "ES256":
		header.Alg = "ES256"
		if ecdsaPEM := js.Global().Get("localStorage").Call("getItem", "ecdsaKey"); ecdsaPEM.IsNull() {
			// There is no ECDSA key generated
			utils.PrintErr("No ECDSA key generated")
			return ""
		} else {
			privKey := utils.EcdsaPemDecode(ecdsaPEM.String())
			if privKey == nil {
				// Error decoding RSA key
				return ""
			}
			header.Jwk.JWKGen(privKey.PublicKey)

			// Need to get the pub claim (pub key thumbprint)
			thumb := utils.JWKThumbprint(privKey.PublicKey)
			js.Global().Get("document").Call("getElementById", "jwk_thumb").Set("textContent", thumb)

			if bytHead, err := json.Marshal(header); err != nil {
				utils.PrintErr(err)
				// error marshalling header
				return ""
			} else {
				token = base64.RawURLEncoding.EncodeToString(bytHead)
			}
			if bytPayl, err := json.Marshal(payload); err != nil {
				utils.PrintErr(err)
				// error marshalling payload
				return ""
			} else {
				token = token + "." + base64.RawURLEncoding.EncodeToString(bytPayl)
			}

			signature := utils.EcdsaSign(token, privKey)
			if signature == "" {
				// Signature failed, more info in logs
				return ""
			} else {
				return token + "." + signature
			}
		}
	default:
		utils.PrintErr("Unvalid Algorithm")
		return ""
	}
}

func add(this js.Value, args []js.Value) interface{} {
	js.Global().Set("output", js.ValueOf(args[0].Int()+args[1].Int()))
	println(js.ValueOf(args[0].Int() + args[1].Int()).String())
	return nil
}

func addcomp(this js.Value, args []js.Value) interface{} {
	value1 := js.Global().Get("document").Call("getElementById", args[0].String()).Get("value").String()
	value2 := js.Global().Get("document").Call("getElementById", args[1].String()).Get("value").String()

	int1, _ := strconv.Atoi(value1)
	int2, _ := strconv.Atoi(value2)

	js.Global().Get("document").Call("getElementById", args[2].String()).Set("value", int1+int2)

	return nil
}

func substract(this js.Value, args []js.Value) interface{} {
	js.Global().Set("output", js.ValueOf(args[0].Int()-args[1].Int()))
	println(js.ValueOf(args[0].Int() - args[1].Int()).String())
	return nil
}

func registerCallbacks() {
	js.Global().Set("add", js.FuncOf(add))
	js.Global().Set("substract", js.FuncOf(substract))
	js.Global().Set("addcomp", js.FuncOf(addcomp))
	js.Global().Set("generateRsa", js.FuncOf(generateRsa))
	js.Global().Set("generateEcdsa", js.FuncOf(generateEcdsa))
	js.Global().Set("generatePop", js.FuncOf(generatePop))

	//js.Global().Set("importRsa", js.FuncOf(importRsa))
}

func initialize() {
	document = js.Global().Get("document")
}

func main() {
	c := make(chan struct{})
	initialize()
	registerCallbacks()
	fmt.Println("INIT FINISH")

	<-c
}
