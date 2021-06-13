const child_process = require("child_process");
const path = require("path");
const fs = require("fs/promises");
const { lookpath } = require("lookpath");

const BUILD_DIR = process.env.BUILD_DIR || "build";
const MYDIR = path.resolve(__dirname, "submodules/libjxl/");
const CMAKE_BUILD_TYPE="Release";

async function getEmsdkPath() {
  const emccPath = await lookpath("emcc");
  if (!emccPath) {
    throw new Error("Cannot detect emcc");
  }
  return path.dirname(emccPath);
}

async function configure() {
  const EMSCRIPTEN_CACHE_SYSROOT_DIR = path.resolve(await getEmsdkPath(), "cache/sysroot/");
  const EMSCRIPTEN_CACHE_WASM_DIR = path.resolve(EMSCRIPTEN_CACHE_SYSROOT_DIR, "lib/wasm32-emscripten/");
  const LIBGIF_DIR = path.resolve(EMSCRIPTEN_CACHE_WASM_DIR, "libgif.a");
  const LIBJPEG_DIR = path.resolve(EMSCRIPTEN_CACHE_WASM_DIR, "libjpeg.a");
  const LIBPNG_DIR = path.resolve(EMSCRIPTEN_CACHE_WASM_DIR, "libpng.a");
  const ZLIB_DIR = path.resolve(EMSCRIPTEN_CACHE_WASM_DIR, "libz.a");
  const LIB_INCLUDE = path.resolve(EMSCRIPTEN_CACHE_SYSROOT_DIR, "include") + "/";

  const args = [
    `-B"${BUILD_DIR}"`,
    `-H"${MYDIR}"`,
    `-DCMAKE_BUILD_TYPE="${CMAKE_BUILD_TYPE}"`,
    `-G Ninja`,
    '-DJPEGXL_STATIC=ON',

    `-DGIF_LIBRARY="${LIBGIF_DIR}"`,
    `-DGIF_INCLUDE_DIR="${LIB_INCLUDE}"`,
    `-DJPEG_LIBRARY="${LIBJPEG_DIR}"`,
    `-DJPEG_INCLUDE_DIR="${LIB_INCLUDE}"`,
    `-DPNG_LIBRARY="${LIBPNG_DIR}"`,
    `-DPNG_PNG_INCLUDE_DIR="${LIB_INCLUDE}"`,
    `-DZLIB_LIBRARY="${ZLIB_DIR}"`,
    `-DZLIB_INCLUDE_DIR="${LIB_INCLUDE}"`,

    `-DBUILD_TESTING=OFF`,
    `-DJPEGXL_ENABLE_EXAMPLES=OFF`,
    // Enable NODE_CODE_CACHING when it becomes available again.
    // https://github.com/nodejs/node/issues/18265#issuecomment-622990783
    `-DCMAKE_EXE_LINKER_FLAGS="-s ALLOW_MEMORY_GROWTH=1 -s NODERAWFS=1`,
  ]
  return args.join(" ");
}

desc("Clone submodules");
task("submodules", () => {
  child_process.execSync("git submodule update --init --recursive");
});

desc("Build emscripten-ports");
task("emscripten-ports", () => {
  child_process.execSync("embuilder build giflib libjpeg libpng zlib");
});

desc("Configure JPEG XL command line interface");
task("configure", ["submodules", "emscripten-ports"], async () => {
  const command = `emcmake cmake ${await configure()}`;
  console.log(command);
  child_process.execSync(command, {
    env: {
      "SKIP_TEST": 1,
      "PACK_TEST": 1,
    },
    stdio: "inherit"
  })
});

desc("Build JPEG XL command line interface");
task("build", () => {
  const command = `cmake --build build`;
  console.log(command);
  child_process.execSync(command, {
    env: {
      "CC": "emcc",
      "CXX": "em++",
    },
    stdio: "inherit"
  })
});

task("copy", async () => {
  const targets = ["cjxl.js", "cjxl.wasm", "djxl.js", "djxl.wasm"];
  for (const target of targets) {
    await fs.copyFile(`build/tools/${target}`, `lib/${target}`);
  }
});

task("default", ["configure", "build", "copy"])

desc("clean");
task("clean", () => {
  jake.rmRf("build");
})
