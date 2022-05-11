usage () {
    echo "usage: $"
}

GOO=js GOARCH=wasm go build -o golib.wasm gofuncs.go