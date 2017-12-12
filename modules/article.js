const downloadGet = require('download');
const fs = require('graceful-fs');
const path = require('path');
const Config = require('./config');
const Terminal = require('./terminal');

const config = new Config();
const terminal = new Terminal(0);

class Article {
  constructor() {
    this.delay429 = 0;

    setInterval(() => {
      if (this.delay429 > 0) this.delay429 -= 1;
      else if (this.delay429 < 0) this.delay429 = 0;
    }, 5 * 60 * 1000);
  }

  download(articleName, url, queuePushFn, callback) {
    const throttleFn = () => setTimeout(callback, 100 * this.delay429);
    downloadGet(url) //
      .then(html => fs.writeFile(path.join(config.WIKI_DL, `${articleName}.html`), html, throttleFn)) //
      .catch(err => {
        // Push article back on the queue if it is a 429 (too many requests)
        if (err.statusCode === 429) {
          terminal.print(`429 pushing ${articleName} back on the queue. Delaying myself...`);
          if (this.delay429 < 10) this.delay429 += 1;
          queuePushFn(articleName);
        } else if (config.LOG_MISSING) {
          // Write error out to file
          fs.appendFile(path.join(__dirname, 'missing_articles.txt'), `${err.statusCode} ${articleName}\n`, err => {
            if (err) terminal.print(`problems appending to error file ${err}`);
            setTimeout(callback, 1000 * this.delay429);
          });
          return;
        }
        setTimeout(callback, 1000 * this.delay429);
      });
  }
}

module.exports = Article;
