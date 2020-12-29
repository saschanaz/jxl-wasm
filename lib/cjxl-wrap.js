#!/usr/bin/env node
"use strict";

if (!process.argv.includes("--num_threads")) {
  const threadCount = require("os").cpus().length;
  process.argv.push(`--num_threads`, threadCount);
}

require("./cjxl.js");
