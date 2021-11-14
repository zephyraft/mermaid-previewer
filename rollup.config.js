const outputDir = "dist";
const format = "umd";

export default [
    {
        input: "src/content/mermaid-render.js",
        output: {
            file: `${outputDir}/content.js`,
            format: format,
            compact: true
        }
    },
    {
        input: "src/option/options.js",
        output: {
            file: `${outputDir}/options.js`,
            format: format
        }
    },
    {
        input: "src/worker/background.js",
        output: {
            file: `${outputDir}/background.js`,
            format: format
        }
    },
];
