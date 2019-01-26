//import commonjs from 'rollup-plugin-commonjs'
//import globals from 'rollup-plugin-node-globals'
//import builtins from 'rollup-plugin-node-builtins'
//import resolve from 'rollup-plugin-node-resolve'
//import json from 'rollup-plugin-json'
import buble from 'rollup-plugin-buble'
//import { terser } from 'rollup-plugin-terser'

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/index.js',
            format: 'cjs'
        },
        {
            file: 'browser/index.js',
            format: 'iife',
            name: 'diffDOM'
        },
    ],
    plugins: [
//        commonjs(),
//        globals(),
//        builtins(),
//        resolve(),
//        json(),
        buble(),
//        terser()
    ]
}
