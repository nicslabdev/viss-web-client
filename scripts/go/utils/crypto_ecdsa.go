/**
*	VISS-MANAGER: crypto_ecdsa: methods related to ecdsa signature and ecdsa key encoding
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
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
)

// Returns base 64 RS256 signature of given string using the key
func EcdsaSign(toSign string, privKey *ecdsa.PrivateKey) string {
	var bytSignature []byte
	hashed := sha256.Sum256([]byte(toSign))
	if privKey == nil {
		PrintErr("No key given to EcdsaSign")
		return ""
	}
	r, s, err := ecdsa.Sign(rand.Reader, privKey, hashed[:])
	if err != nil {
		PrintErr("Internal error: ecdsa signature failed")
		return ""
	}
	bytSignature = r.Bytes()
	bytSignature = append(bytSignature, s.Bytes()...)
	return base64.RawURLEncoding.EncodeToString(bytSignature)
}

// Gets ecdsa key in pem format and decodes it into ecdsa.privatekey
func EcdsaPemDecode(pemKey string) *ecdsa.PrivateKey {
	pemBlock, _ := pem.Decode([]byte(pemKey)) // Gets pem_block from raw key
	// Checking key type and correct decodification
	if pemBlock == nil {
		PrintErr("Invalid Pem Block")
		return nil
	}
	if pemBlock.Type != "EC PRIVATE KEY" {
		PrintErr("Not a ECDSA Key")
		return nil
	}
	// Parses obtained pem block
	var parsedKey interface{} //Still dont know what key type we need to parse
	parsedKey, err := x509.ParseECPrivateKey(pemBlock.Bytes)
	if err != nil {
		parsedKey, err = x509.ParsePKCS8PrivateKey(pemBlock.Bytes)
		if err != nil {
			PrintErr(err)
			return nil
		}
	}
	// Gets private key from parsed key
	privKey, ok := parsedKey.(*ecdsa.PrivateKey)
	if !ok {
		PrintErr("Not a ECDSA Key")
		return nil
	}
	return privKey
}

// Returns given ECDSA private key in PEM format
func EcdsaPemPrivEncode(privKey *ecdsa.PrivateKey) string {
	keyBytes, err := x509.MarshalECPrivateKey(privKey)
	if err != nil {
		PrintErr(err)
		return ""
	}
	// Creates pem block from given key
	privBlock := pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: keyBytes,
	}

	// Encodes pem block to byte buffer, then gets the string from it
	privBuf := new(bytes.Buffer)
	err = pem.Encode(privBuf, &privBlock)
	if err != nil {
		PrintErr(err)
		return ""
	}
	return privBuf.String()
}

// Returns given ECDSA public key in PEM format
func EcdsaPemPubEncode(privKey *ecdsa.PrivateKey) string {
	byteKey, err := x509.MarshalPKIXPublicKey(privKey.PublicKey)
	if err != nil {
		PrintErr(err)
		return ""
	}
	// Creates pem block from given key
	pubBlock := pem.Block{
		Type:  "ECDSA PUBLIC KEY",
		Bytes: byteKey,
	}
	// Encodes pem block to byte buffer, then gets the string from it
	pubBuf := new(bytes.Buffer)
	err = pem.Encode(pubBuf, &pubBlock)
	if err != nil {
		PrintErr(err)
		return ""
	}
	return pubBuf.String()
}

// Generates P256 EC Key
func EcdsaGenP256() *ecdsa.PrivateKey {
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		PrintErr(err)
		return nil
	}
	return privKey
}
