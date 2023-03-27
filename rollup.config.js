import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import del from "rollup-plugin-delete";
import postcss from "rollup-plugin-postcss";
import strip from "@rollup/plugin-strip";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindConfig from "./tailwind.config.cjs";

const outputDir = "dist";
const publicOutputDir = `${outputDir}/public`;
const cssOutputDir = `${publicOutputDir}/css`;
const format = "esm";
const disableDebug = !(process.env.DEBUG === "true");

const copyOption = {
  targets: [
    { src: "src/manifest.json", dest: outputDir },
    { src: "public/css/all.min.css", dest: cssOutputDir },
    { src: "public/webfonts", dest: publicOutputDir },
    { src: "public/icon", dest: publicOutputDir },
    { src: "public/html", dest: publicOutputDir },
  ],
  verbose: true,
}

let configs = [
  // 内容
  {
    input: "src/content/content.js",
    output: {
      inlineDynamicImports: true,
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
    ],
  },
  // 设置
  {
    input: "src/option/options.js",
    output: {
      inlineDynamicImports: true,
      dir: `${outputDir}/src/option`,
      format: format,
    },
    plugins: [
      // resolve dependencies
      nodeResolve(),
      commonjs(),
      // 复制静态资源
      copy(copyOption),
    ],
  },
  // 后台
  {
    input: "src/worker/background.js",
    output: {
      inlineDynamicImports: true,
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
        plugins: [tailwindcss(tailwindConfig), autoprefixer()],
        extensions: [".css"],
        extract: true,
        minimize: disableDebug,
      }),
      // 复制静态资源
      copy(copyOption),
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
