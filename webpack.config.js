const path = require('path');
const fs = require('fs-extra');
const CopyPlugin = require('copy-webpack-plugin');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = (env, argv) => {

    generatePackageJson();

    if (argv.mode === 'production') {
        console.log("[Building for production]");

    }



    return [

        /**
         * Main process
         */
        {
            entry: './src/app.ts',
            target: "electron-main",
            devtool: "inline-source-map",
            externals: {
                "extract-file-icon": 'require("./native/extract-file-icon")'
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: 'ts-loader',
                        exclude: /node_modules/,
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
            resolveLoader: {
                modules: ["node_modules"]
            },
            output: {
                filename: 'scanner.js',
                path: path.resolve(__dirname, 'dist'),
            },
            plugins: [
                // new CleanWebpackPlugin(),
                new CopyPlugin([{
                    from: 'node_modules/extract-file-icon',
                    to: 'native/extract-file-icon'
                },
                {
                    from: 'src/external',
                    to: 'native'
                }]),
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
                        test: /\.(woff|woff2|eot|ttf|otf)$/,
                        use: [
                            'file-loader',
                        ],
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

                new HtmlWebpackPlugin({
                    filename: 'notification.html',
                    title: 'Notification',
                    template: './src/modules/notification/index.ejs',
                }),
            ],
        },
        /**
         * Grid
         */
        {
            entry: './src/modules/grid/index.tsx',
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
                        test: /\.(png|svg|jpg|gif|ico)$/,
                        use: [
                            'file-loader'
                        ]
                    },
                    {
                        test: /\.(woff|woff2|eot|ttf|otf)$/,
                        use: [
                            'file-loader',
                        ],
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
                filename: 'grid.js',
                path: path.resolve(__dirname, 'dist'),
            },
            plugins: [
                new HtmlWebpackPlugin({
                    filename: 'grid.html',
                    title: 'Grid',
                    template: './src/modules/grid/index.ejs',
                }),
            ],
        }];
}

/**
 * Generate a clean package JSOn for the build process
 */
function generatePackageJson() {
    console.log("Generating product package json...");
    try {
        const data = fs.readJsonSync("./package.json");
        const pjson = {
            name: data.name,
            productName: data.productName,
            version: data.version,
            author: data.author,
            repository: data.repository,
            description: data.description,
            main: data.main,
            engine: data.engine,
            dependencies: data.dependencies,
            homepage: data.homepage,
            bugs: data.bugs,
            keywords: data.keywords
        }
        fs.ensureDirSync("dist");
        fs.writeJsonSync("dist/package.json", pjson);
        console.log("...done");
    } catch (error) {
        console.error(error.message);
        process.exit();
    }

}
