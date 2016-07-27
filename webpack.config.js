var webpack = require("webpack");
var extract = require("extract-text-webpack-plugin");
var path = require("path");

/* For node 0.10.x we need this defined */
if (typeof(global.Promise) == "undefined")
    global.Promise = require('promise');

/* These can be overridden, typically from the Makefile.am */
var srcdir = __dirname + path.sep;
var distdir = __dirname + path.sep + "dist" + path.sep;

module.exports = {
    entry: {
        "images": [
            srcdir + "images.js",
            srcdir + "client.js",
            srcdir + "date.js",
            srcdir + "layers.js",
            srcdir + "images.less",
            srcdir + "layers.less",
            srcdir + "views/image-body.html",
            srcdir + "views/image-config.html",
            srcdir + "views/image-meta.html",
            srcdir + "views/image-layers.html",
        ]
    },
    externals: {
        "angular": "angular",
    },
    jshint: {
        emitErrors: false,
        failOnHint: true,
        sub: true,
        multistr: true,
        undef: true,
        predef: [ "window", "document", "console", "angular" ],
        reporter: function (errors) {
            var loader = this;
            errors.forEach(function(err) {
                console.log(loader.resource + ":" + err.line + ":" + err.character + ": " + err.reason);
            });
        }
    },

    output: {
        path: distdir,
        filename: "[name].js",
        sourceMapFilename: "[file].map",
    },
    resolve: {
        modulesDirectories: [ srcdir + path.sep + "bower_components" ]
    },
    resolveLoader: {
        root: path.resolve(srcdir, 'node_modules')
    },
    plugins: [
        new extract("[name].css")
    ],
    devtool: "source-map",
    module: {
        preLoaders: [
            {
                test: /\.js$/, // include .js files
                exclude: /node_modules\//, // exclude external dependencies
                loader: "jshint-loader"
            }
        ],
        loaders: [
            {
                test: /\.css$/,
                loader: extract.extract("style-loader", "css-loader")
            },
            {
                test: /\.less$/,
                loader: extract.extract('css?sourceMap!' + 'less?sourceMap')
            },
            {
                test: /\.html$/,
                loader: "ng-cache?prefix=kubernetes-image-widgets/[dir]"
            }
        ]
    },
};
