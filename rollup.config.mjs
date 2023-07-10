import typescript from "@rollup/plugin-typescript"
import dts from "rollup-plugin-dts"
import buble from "@rollup/plugin-buble"
import terser from "@rollup/plugin-terser"

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.js",
                format: "cjs",
                sourcemap: true,
            },
            {
                file: "dist/module.js",
                format: "es",
                sourcemap: true,
            },
        ],
        plugins: [
            typescript(),
            buble(),
        ],
    },
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.min.js",
                format: "cjs",
                sourcemap: true,
            },
        ],
        plugins: [
            typescript(),
            buble(),
            terser(),
        ],
    },
    {
        input: './dist/dts/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [dts()],
    },
    {
        input: "src/index.ts",
        output: [
            {
                file: "browser/diffDOM.js",
                format: "iife",
                name: "diffDOM",
                sourcemap: true,
            },
        ],
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: false,
                    declarationDir: undefined
                }
            }),
            buble(),
            terser()
        ],
    },
]
