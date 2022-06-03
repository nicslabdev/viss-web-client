/**
*	VISS-MANAGER: crypto_rsa: methods related to rsa signature and rsa key encoding
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
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
)

// Returns base 64 RS256 signature of given string using the key
func RsaSign(toSign string, privKey *rsa.PrivateKey) string {
	var bytSignature []byte
	hashed := sha256.Sum256([]byte(toSign))
	if privKey == nil {
		PrintErr("No key given to RsaSign")
		return ""
	}
	bytSignature, err := rsa.SignPKCS1v15(rand.Reader, privKey, crypto.SHA256, hashed[:])
	if err != nil {
		PrintErr(err)
		return ""
	}
	return base64.RawURLEncoding.EncodeToString(bytSignature)
}

// Gets rsa key in pem format and decodes it into rsa.privatekey
func RsaPemDecode(pemKey string) *rsa.PrivateKey {
	pemBlock, _ := pem.Decode([]byte(pemKey)) // Gets pem_block from raw key
	// Checking key type and correct decodification
	if pemBlock == nil {
		PrintErr("Invalid Pem Block")
		return nil
	}
	if pemBlock.Type != "RSA PRIVATE KEY" {
		PrintErr("Not a RSA Key")
		return nil
	}
	// Parses obtained pem block
	var parsedKey interface{} //Still dont know what key type we need to parse
	parsedKey, err := x509.ParsePKCS1PrivateKey(pemBlock.Bytes)
	if err != nil {
		parsedKey, err = x509.ParsePKCS8PrivateKey(pemBlock.Bytes)
		if err != nil {
			PrintErr("Unable to Parse PEM Block")
			return nil
		}
	}
	// Gets private key from parsed key
	privKey := parsedKey.(*rsa.PrivateKey)
	return privKey
}

// Returns given RSA private key in PEM format
func RsaPemPrivEncode(privKey *rsa.PrivateKey) string {
	// Creates pem block from given key
	privBlock := pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privKey),
	}
	// Encodes pem block to byte buffer, then gets the string from it
	privBuf := new(bytes.Buffer)
	err := pem.Encode(privBuf, &privBlock)
	if err != nil {
		PrintErr(err)
		return ""
	}
	return privBuf.String()
}

// Returns given RSA public key in PEM format
func RsaPemPubEncode(privKey *rsa.PrivateKey) string {
	// Creates pem block from given key
	pubBlock := pem.Block{
		Type:  "RSA PUBLIC KEY",
		Bytes: x509.MarshalPKCS1PublicKey(&privKey.PublicKey),
	}
	// Encodes pem block to byte buffer, then gets the string from it
	pubBuf := new(bytes.Buffer)
	err := pem.Encode(pubBuf, &pubBlock)
	if err != nil {
		PrintErr(err)
		return ""
	}
	return pubBuf.String()
}

// Generates 2048 RSA Key
func RsaGen2048() *rsa.PrivateKey {
	privKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		PrintErr(err)
		return nil
	}
	return privKey
}
