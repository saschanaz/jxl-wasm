# jxl-wasm
WebAssembly-compiled JPEG XL command line tool for Node.js.

## How to use

1. `npm i -g jxl-wasm`
2. Run `cjxl-wasm` for encoding and `djxl-wasm` for decoding.

## Build environment

Below are my current environment, which doesn't exactly mean they are the required versions.

* Emscripten future buid, 2.0.12+ ([for giflib](https://github.com/emscripten-core/emscripten/pull/13139))
* Node.js 15.4.0
* CMake 3.17.1
