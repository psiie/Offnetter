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
    this.queueItem = '';
    this.fullSavePath = null;
    this.queuePushFn = () => {};

    setInterval(() => {
      this.delay429 > 0 ? this.delay429-- : this.delay429 = 0;
    }, 5 * 60 * 1000);
  }

  throttleFn(callback) {
    setTimeout(callback, 200 * this.delay429);
  }

  onSuccess(data, callback) {
    fs.writeFile(this.fullSavePath, data, () => this.throttleFn(callback));
  }

  onError(err, callback) {
    // Push article back on the queue if it is a 429 (too many requests)
    if (err.statusCode === 429) {
      terminal.print(`429 pushing ${this.queueItem} back on the queue. Delaying myself...`);
      if (this.delay429 < 10) this.delay429 += 1;
      if (this.queuePushFn) this.queuePushFn(this.queueItem);
      this.throttleFn(callback);
    } else if (config.LOG_MISSING) {
      fs.appendFile(path.join(__dirname, 'missing_articles.txt'), `${err.statusCode} ${this.queueItem}\n`, err => {
        if (err) terminal.print(`problems appending to error file ${err}`);
        this.throttleFn(callback);
      });
    }
  }

  get(url, fullSavePath, queuePushFn, callback, queueItem) {
    this.queueItem = queueItem
    this.fullSavePath = fullSavePath;
    this.queuePushFn = queuePushFn;
    this.callback = callback;

    request(url) //
    .then(data => this.onSuccess(data, callback)) //
    .catch(err => this.onError(err, callback)); //
  }
}

module.exports = Download;
