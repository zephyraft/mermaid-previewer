import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import del from "rollup-plugin-delete";
import postcss from "rollup-plugin-postcss";
import strip from "@rollup/plugin-strip";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindConfig from "./tailwind.config";

const outputDir = "dist";
const format = "esm";
const disableDebug = !(process.env.DEBUG === "true");

let configs = [
  // 内容
  {
    input: "src/content/content.js",
    output: {
      dir: `${outputDir}/src/content`,
      format: format,
      banner: "{",
      footer: "}",
    },
    plugins: [
      // clean dist
      del({
        targets: `${outputDir}/*`,
        verbose: true,
        runOnce: true,
      }),
      // resolve dependencies
      nodeResolve(),
      commonjs(),
      // bundle css import
      postcss(),
      // 复制静态资源
      copy({
        targets: [
          { src: "src/manifest.json", dest: outputDir },
          { src: "public/icon", dest: `${outputDir}/public` },
          { src: "public/html", dest: `${outputDir}/public` },
        ],
      }),
    ],
  },
  // 设置
  {
    input: "src/option/options.js",
    output: {
      dir: `${outputDir}/src/option`,
      format: format,
    },
    plugins: [
      // resolve dependencies
      nodeResolve(),
      commonjs(),
    ],
  },
  // 后台
  {
    input: "src/worker/background.js",
    output: {
      dir: `${outputDir}/src/worker`,
      format: format,
    },
    plugins: [
      // resolve dependencies
      nodeResolve(),
      commonjs(),
    ],
  },
  // tailwindcss
  {
    input: "public/css/options.css",
    output: {
      file: `${outputDir}/public/css/options.css`,
      format: format,
    },
    plugins: [
      postcss({
        plugins: [
          tailwindcss(tailwindConfig),
          autoprefixer(),
        ],
        extensions: [".css"],
        extract: true,
        minimize: disableDebug,
      })
    ],
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
