const fs = require('graceful-fs');
const path = require('path');
const Config = require('./config');
const request = require('download');
const Terminal = require('./terminal');

const config = new Config();
const terminal = new Terminal(-1);

class Download {
  constructor() {
    this.delay429 = 0;
    this.fileName = '';
    this.fullSavePath = path.join(__dirname, 'raw_wiki_articles');
    this.queuePushFn = () => {};

    setInterval(() => {
      this.delay429 > 0 ? this.delay429-- : this.delay429 = 0;
    }, 5 * 60 * 1000);
  }

  throttleFn(callback) {
    setTimeout(callback, 200 * this.delay429);
  }

  onSuccess(html, callback) {
    fs.writeFile(path.join(__dirname, this.fullSavePath), html, () => this.throttleFn(callback));
  }

  onError(err, callback) {
    if (err.statusCode === 429) {
      // Push article back on the queue if it is a 429 (too many requests)
      terminal.print(`429 pushing ${this.fileName} back on the queue. Delaying myself...`);
      if (this.delay429 < 10) this.delay429 += 1;
      this.queuePushFn(this.fileName);
      this.throttleFn(callback);
    } else if (config.LOG_MISSING) {
      // Write error out to file
      fs.appendFile(path.join(__dirname, 'missing_articles.txt'), `${err.statusCode} ${this.fileName}\n`, err => {
        if (err) terminal.print(`problems appending to error file ${err}`);
        this.throttleFn(callback);
      });
    }
  }

  get(fileName, fullSavePath, url, queuePushFn, callback) {
    this.fileName = fileName;
    this.fullSavePath = fullSavePath;
    this.queuePushFn = queuePushFn;
    this.callback = callback;

    request(url) //
    .then(data => this.onSuccess(data, callback)) //
    .catch(err => this.onError(err, callback)); //
  }
}

module.exports = Download;
