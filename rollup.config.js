import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import postcss from 'rollup-plugin-postcss'
import strip from '@rollup/plugin-strip';

const outputDir = "dist";
const format = "esm";

// noinspection JSUnusedGlobalSymbols
export default [
    {
        input: "src/content/mermaid-render.js",
        output: {
            dir: `${outputDir}/src/content`,
            format: format,
        },
        plugins: [
            del({targets: `${outputDir}/*`, verbose: true}),
            nodeResolve(),
            commonjs(),
            postcss(),
            //
            strip(),
            copy({
                targets: [
                    {src: "src/manifest.json", dest: outputDir},
                    {src: "public", dest: outputDir}
                ]
            }),
        ],
    },
    {
        input: "src/option/options.js",
        output: {
            dir: `${outputDir}/src/option`,
            format: format
        },
        plugins: [
            strip(),
        ],
    },
    {
        input: "src/worker/background.js",
        output: {
            dir: `${outputDir}/src/worker`,
            format: format
        },
        plugins: [
            strip(),
        ],
    },
];
