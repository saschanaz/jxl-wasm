const child_process = require("child_process");
const path = require("path");

const BUILD_DIR = process.env.BUILD_DIR || "build";
const MYDIR = path.resolve(__dirname, "submodules/jpeg-xl/");
const CMAKE_BUILD_TYPE="Release";
const JPEGXL_VERSION = require("./package.json").version;

function configure() {
  const args = [
    `-B"${BUILD_DIR}"`,
    `-H"${MYDIR}"`,
    `-DCMAKE_BUILD_TYPE="${CMAKE_BUILD_TYPE}"`,
    `-G Ninja`,
    `-DJPEGXL_VERSION="${JPEGXL_VERSION}"`,
    // emcmake sets a quoted string which then can't be used in cmake COMMAND
    // See https://github.com/emscripten-core/emscripten/issues/13126
    `-DCMAKE_CROSSCOMPILING_EMULATOR="${process.execPath}"`,
    '-DJPEGXL_STATIC=ON',
    `-DBUILD_TESTING=OFF`,
  ]
  return args.join(" ");
}

desc("Prepare embuilder-supported dependencies");
task("embuilder", () => {
  const command = "embuilder build libpng";
  console.log(command);
  child_process.execSync(command);
});

desc("Clone dependencies");
task("deps", [], () => {
  child_process.execSync("git submodule update --init --recursive");
});

desc("Configure JPEG XL command line interface");
task("configure", ["embuilder", "deps"], () => {
  const command = `emcmake cmake ${configure()}`;
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

task("default", ["configure", "build"])

desc("clean");
task("clean", () => {
    jake.rmRf("build");
})
