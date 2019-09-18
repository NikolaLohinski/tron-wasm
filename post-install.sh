# Fix buggy library that prevents loading correctly through webpack
sed -i 's/global.require = require//g' ./node_modules/golang-wasm-async-loader/lib/wasm_exec.js
