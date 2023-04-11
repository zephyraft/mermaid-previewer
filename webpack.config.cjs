const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const debug = process.env.DEBUG === "true";

module.exports = {
    cache: {
        type: 'filesystem',
    },
    entry: {
        background: './src/worker/background.ts',
        popup: './src/popup/popup.ts',
        content: './src/content/content.ts',
    },
    output: {
        publicPath: '',
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true,
        asyncChunks: false,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/popup/popup.html",
            filename: "popup.html",
            chunks: ['popup'],
            hash: true,
            inject: true,
        }),
        new CopyPlugin({
            patterns: [
                "src/manifest.json",
                {from: "public/icons", to: "public/icons"},
                {from: "public/css", to: "public/css"},
                {from: "public/webfonts", to: "public/webfonts"},
            ],
        }),
    ],
    optimization: {
        splitChunks: false,
        minimize: !debug,
        minimizer: [new TerserPlugin({
            terserOptions: {
                compress: {
                    drop_console: true
                }
            }
        })]
    }
};
