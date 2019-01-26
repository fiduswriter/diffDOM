import buble from 'rollup-plugin-buble'
import { terser } from 'rollup-plugin-terser'

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
        buble(),
        terser()
    ]
}
