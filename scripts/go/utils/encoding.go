/**
*	VISS-MANAGER: encoding: methods related to data and objects encoding to be used
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
	"crypto"
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"math/big"
	"strings"
)

// AES-CTR encoding
func AESCTREncoding(key string, data string) (string, error) {
	// Hashes the key so it is 256 bits long
	hashKey := sha256.Sum256([]byte(key))
	// Generates aes cyph block
	aesCyphBlock, err := aes.NewCipher(hashKey[:])
	if err != nil {
		return "", err
	}
	// IV must be unique, not secure. Included at the beginning of ciphertext
	cyphertext := make([]byte, aes.BlockSize+len([]byte(data)))
	iv := cyphertext[:aes.BlockSize]                        //byte array of length aes.Blocksize
	if _, err := io.ReadFull(rand.Reader, iv); err != nil { // fills iv
		return "", errors.New("could not generate input value for aes-ctr")
	}
	cyphertext = append(cyphertext, iv...)                            // Adds the iv to the cyphertext
	cyphStream := cipher.NewCTR(aesCyphBlock, iv)                     //Creates cypher stream using the aes block
	cyphStream.XORKeyStream(cyphertext[aes.BlockSize:], []byte(data)) //Uses the cypher stream to fill ciphertext

	return string(cyphertext), nil
}

// AES-CTR decoding
func AESCTRDecoding(key string, data string) (string, error) {
	// Hashes the key so it is 256 bits long
	hashKey := sha256.Sum256([]byte(key))
	// Generates aes cyph block
	aesCyphBlock, err := aes.NewCipher(hashKey[:])
	if err != nil {
		return "", err
	}
	// IV is included at the beginning of ciphertext
	cyphertext := []byte(data)
	iv := cyphertext[:aes.BlockSize]
	plaintext := make([]byte, len(cyphertext)-aes.BlockSize) // Var to store the uncyph data

	uncyphStream := cipher.NewCTR(aesCyphBlock, iv)                  //Creates cypher stream using the aes block
	uncyphStream.XORKeyStream(plaintext, cyphertext[aes.BlockSize:]) //Uses the cypher stream to uncypher

	return string(plaintext), nil
}

// Gets Json string (or nothing) and adds received key and value, if it doesnt receive a value or key, it does nothing
func JsonRecursiveMarshall(key string, value string, jplain *string) {
	if key == "" || value == "" {
		return
	}
	if !strings.HasPrefix(value, "{") { // If the value of the claim starts with "{", that means the claim has another json inside, wich must not be included between commas
		value = `"` + value + `"`
	}
	if *jplain == "" {
		*jplain = `{"` + key + `":` + value + `}`
	} else {
		*jplain = (*jplain)[:len(*jplain)-1] + `,"` + key + `":` + value + `}`
	}
}

type JWK struct {
	Type   string `json:"kty"`
	Use    string `json:"use,omitempty"`
	PubMod string `json:"n,omitempty"`   // RSA
	PubExp string `json:"e,omitempty"`   // RSA
	Curve  string `json:"crv,omitempty"` //ECDSA
	Xcoord string `json:"x,omitempty"`   //ECDSA
	Ycoord string `json:"y,omitempty"`   //ECDSA
}

func (jwk *JWK) JWKGen(pubKey crypto.PublicKey) {
	jwk.Use = "sign"
	switch typ := pubKey.(type) {
	case rsa.PublicKey:
		jwk.Type = "RSA"
		rsaPubKey := pubKey.(rsa.PublicKey)
		jwk.PubExp = base64.RawURLEncoding.EncodeToString(big.NewInt(int64(rsaPubKey.E)).Bytes())
		jwk.PubMod = base64.RawURLEncoding.EncodeToString(rsaPubKey.N.Bytes())
	case ecdsa.PublicKey:
		jwk.Type = "EC"
		ecdsaPubKey := pubKey.(ecdsa.PublicKey)
		jwk.Curve = fmt.Sprintf("P-%v", ecdsaPubKey.Curve.Params().BitSize)
		jwk.Xcoord = base64.RawURLEncoding.EncodeToString(ecdsaPubKey.X.Bytes())
		jwk.Ycoord = base64.RawURLEncoding.EncodeToString(ecdsaPubKey.Y.Bytes())
	default:
		PrintErr(fmt.Sprintf("Tried to generate JWK, invalid type: %T ", typ))
	}
}

func JWKThumbprint(pubKey crypto.PublicKey) string {
	var thumbprint string
	switch typ := pubKey.(type) {
	case rsa.PublicKey:
		rsaPubKey := pubKey.(rsa.PublicKey)
		keyType := "RSA"
		pubExp := base64.RawURLEncoding.EncodeToString(big.NewInt(int64(rsaPubKey.E)).Bytes())
		pubMod := base64.RawURLEncoding.EncodeToString(rsaPubKey.N.Bytes())
		JsonRecursiveMarshall("e", pubExp, &thumbprint)
		JsonRecursiveMarshall("kty", keyType, &thumbprint)
		JsonRecursiveMarshall("n", pubMod, &thumbprint)
	case ecdsa.PublicKey:
		ecdsaPubKey := pubKey.(ecdsa.PublicKey)
		keyType := "EC"
		curv := fmt.Sprintf("P-%v", ecdsaPubKey.Curve.Params().BitSize)
		xCoord := base64.RawURLEncoding.EncodeToString(ecdsaPubKey.X.Bytes())
		yCoord := base64.RawURLEncoding.EncodeToString(ecdsaPubKey.Y.Bytes())
		JsonRecursiveMarshall("crv", curv, &thumbprint)
		JsonRecursiveMarshall("kty", keyType, &thumbprint)
		JsonRecursiveMarshall("x", xCoord, &thumbprint)
		JsonRecursiveMarshall("y", yCoord, &thumbprint)
	default:
		PrintErr(fmt.Sprintf("Tried to generate JWK Thumbprint , invalid type: %T", typ))
		return ""
	}
	sha256Hash := sha256.Sum256([]byte(thumbprint))
	return base64.RawURLEncoding.EncodeToString(sha256Hash[:])
}
