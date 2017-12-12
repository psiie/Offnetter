const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const gm = require("gm");
const fs = require("graceful-fs");
const fse = require("fs-extra");
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const { execFile } = require('child_process');
const gifsicle = require('gifsicle');
const { tidy } = require("htmltidy");

