const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
module.exports = {
    entry: './src/app.ts',
    target: "electron-main",
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.node$/,
                loader: 'native-ext-loader',
                //use: 'node-addon-loader',
                //use: 'node-loader',
                options: {
                    //rewritePath: path.resolve(__dirname, 'dist')
                },
            },
            {
                test: /\.html/,
                use: [{
                    loader: 'file-loader'
                }]
            },
            {
                test: /\.(png|svg|jpg|gif|ico)$/,
                use: [
                    'file-loader'
                ]
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'scanner.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin([
            // { from: './src/assets/**/*', to: 'assets' },
        ]),
    ],
};