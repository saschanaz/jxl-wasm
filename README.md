# jxl-wasm
WebAssembly-compiled JPEG XL command line tool for Node.js. It requires [Node.js >=16.4.0](https://github.com/nodejs/node/releases/tag/v16.6.0) ([V8 >=9.1](https://github.com/WebAssembly/simd/blob/main/proposals/simd/ImplementationStatus.md)) for wasm SIMD support.

## How to use

1. `npm i -g jxl-wasm`
2. Run `cjxl-wasm` for encoding and `djxl-wasm` for decoding.

## Build environment

Below are my current environment, which doesn't exactly mean they are the required versions.

* Emscripten 2.0.26
* Node.js 16.6.0
* CMake 3.17.1
