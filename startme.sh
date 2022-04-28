usage () {
    echo "usage: $"
}

GOO=js GOARCH=wasm go build -o lib.wasm gofuncs.go