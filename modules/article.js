// const downloadGET = require('download');
const fs = require('graceful-fs');
const path = require('path');
const Config = require('./config');
const Terminal = require('./terminal');
const Download = require('./download');

const config = new Config();
const terminal = new Terminal(-1);
const download = new Download();

class Article {
  getHTML(article, queuePushFn, callback) {
    const fileName = `${article}.html`;
    const fullSavePath = path.join(__dirname, '../', 'raw_wiki_articles/', fileName);
    const url = config.MEDIA_WIKI + article;

    fs.access(fullSavePath, fs.constants.R_OK, err => {
      if (err) {
        download.get(fileName, fullSavePath, url, queuePushFn, callback);
        return;
      }

      terminal.print(`Exists. Skipping ${article.slice(0, 40)}`);
      callback();
    });
  }

  getImages() {}
}

module.exports = Article;
