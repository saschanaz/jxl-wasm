const child_process = require("child_process");
const path = require("path");
const fs = require("fs/promises");
const { lookpath } = require("lookpath");

const BUILD_DIR = process.env.BUILD_DIR || "build";
const MYDIR = path.resolve(__dirname, "submodules/jpeg-xl/");
const CMAKE_BUILD_TYPE="Release";

async function getEmsdkPath() {
  const emccPath = await lookpath("emcc");
  if (!emccPath) {
    throw new Error("Cannot detect emcc");
  }
  return path.dirname(emccPath);
}

async function configure() {
  const EMSCRIPTEN_WASM_CACHE_DIR = path.resolve(await getEmsdkPath(), "cache/wasm/");
  const LIBJPEG_DIR = path.resolve(EMSCRIPTEN_WASM_CACHE_DIR, "libjpeg.a");
  const LIBPNG_DIR = path.resolve(EMSCRIPTEN_WASM_CACHE_DIR, "libpng.a");
  const ZLIB_DIR = path.resolve(EMSCRIPTEN_WASM_CACHE_DIR, "libz.a");
  const LIB_INCLUDE = path.resolve(EMSCRIPTEN_WASM_CACHE_DIR, "include") + "/";

  const args = [
    `-B"${BUILD_DIR}"`,
    `-H"${MYDIR}"`,
    `-DCMAKE_BUILD_TYPE="${CMAKE_BUILD_TYPE}"`,
    `-G Ninja`,
    // emcmake sets a quoted string which then can't be used in cmake COMMAND
    // See https://github.com/emscripten-core/emscripten/issues/13126
    `-DCMAKE_CROSSCOMPILING_EMULATOR="${process.execPath}"`,
    '-DJPEGXL_STATIC=ON',
    `-DJPEG_LIBRARY="${LIBJPEG_DIR}"`,
    `-DJPEG_INCLUDE_DIR="${LIB_INCLUDE}"`,
    `-DPNG_LIBRARY="${LIBPNG_DIR}"`,
    `-DPNG_PNG_INCLUDE_DIR="${LIB_INCLUDE}"`,
    `-DZLIB_LIBRARY="${ZLIB_DIR}"`,
    `-DZLIB_INCLUDE_DIR="${LIB_INCLUDE}"`,
    `-DBUILD_TESTING=OFF`,
    `-DCMAKE_EXE_LINKER_FLAGS="-s ALLOW_MEMORY_GROWTH=1 -s NODERAWFS=1 -s NODE_CODE_CACHING=1 -s WASM_ASYNC_COMPILATION=0`, // -s EXPORT_NAME='_libjxlem' -s MODULARIZE=1 -s EXTRA_EXPORTED_RUNTIME_METHODS=['callMain']"`
  ]
  return args.join(" ");
}

desc("Clone submodules");
task("submodules", () => {
  child_process.execSync("git submodule update --init --recursive");
});

desc("Build emscripten-ports");
task("emscripten-ports", () => {
  child_process.execSync("embuilder build libjpeg libpng zlib");
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
