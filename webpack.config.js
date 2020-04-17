const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = [

    /**
     * Main process
     */

    {
        entry: './src/app.ts',
        target: "electron-main",
        devtool: "inline-source-map",
        node: {
            __filename: true,
            __dirname: true
        },
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
                    test: /\.(png|svg|jpg|gif|ico)$/,
                    use: [
                        'file-loader'
                    ]
                },

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
            // new CleanWebpackPlugin(),
        ],
    },
    /**
     * Notification
     */
    {
        entry: './src/modules/notification/index.ts',
        target: "electron-renderer",
        devtool: "inline-source-map",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
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
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // Creates `style` nodes from JS strings
                        'style-loader',
                        // Translates CSS into CommonJS
                        'css-loader',
                        // Compiles Sass to CSS
                        'sass-loader',
                    ],
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        output: {
            filename: 'notification.js',
            path: path.resolve(__dirname, 'dist'),
        },
        plugins: [
            // new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                filename: 'notification.html',
                title: 'Notification',
                template: './src/modules/notification/index.ejs',
            }),
        ],
    }];