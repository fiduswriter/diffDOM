import typescript from 'rollup-plugin-typescript2'
import dts from 'rollup-plugin-dts'
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
                file: "browser/diffDOM.js",
                format: "iife",
                name: "diffDOM",
                sourcemap: true,
            },
        ],
        plugins: [
            typescript({
                useTsconfigDeclarationDir: true,
                tsconfigDefaults: {
                    compilerOptions: {
                        allowSyntheticDefaultImports: true,
                        declaration: true,
                        //emitDeclarationOnly: true,
                        declarationDir: "dist/dts"
                    }
                }
            }),
            buble(),
            terser()
        ],
    },
    {
        input: './dist/dts/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [dts()],
    },
]
