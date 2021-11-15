import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import del from "rollup-plugin-delete";
import postcss from "rollup-plugin-postcss";
import strip from "@rollup/plugin-strip";

const outputDir = "dist";
const format = "esm";
const disableDebug = !(process.env.DEBUG === "true");

let configs = [
  {
    input: "src/content/mermaid-render.js",
    output: {
      dir: `${outputDir}/src/content`,
      format: format,
    },
    plugins: [
      // clean dist
      del({ targets: `${outputDir}/*`, verbose: true }),
      // resolve dependencies
      nodeResolve(),
      commonjs(),
      // bundle css import
      postcss(),
      // copy file
      copy({
        targets: [
          { src: "src/manifest.json", dest: outputDir },
          { src: "public", dest: outputDir },
        ],
      }),
    ],
  },
  {
    input: "src/option/options.js",
    output: {
      dir: `${outputDir}/src/option`,
      format: format,
    },
    plugins: [],
  },
  {
    input: "src/worker/background.js",
    output: {
      dir: `${outputDir}/src/worker`,
      format: format,
    },
    plugins: [],
  },
];

if (disableDebug) {
  console.log(`disableDebug=${disableDebug}, add strip plugin.`);
  configs = configs.map((config) => {
    config.plugins.push(strip());
    return config;
  });
}

// noinspection JSUnusedGlobalSymbols
export default configs;
