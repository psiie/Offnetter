const async = require('async');
const path = require('path');
const download = require('download');
const fs = require('graceful-fs');
const Config = require('./modules/config');
const Commons = require('./modules/commons');
const Queue = require('./modules/queue');
const Terminal = require('./modules/terminal');
const Article = require('./modules/article');

const config = new Config();
const article = new Article();

Commons.loadListFile(config.WIKI_LIST, list => {
  const terminal = new Terminal(list.length);
  const pullQueue = new Queue(config.CONCURRENT_CONNECTIONS, (article, callback) => {
    terminal.incLogCounter();
    fs.access(path.join(config.WIKI_DL, `${article}.html`), fs.constants.R_OK, pathNotFound => {
      if (pathNotFound) {
        terminal.print(`Downloading ${article.slice(0, 40)}`);
        article.download(article, config.MEDIA_WIKI + article, pullQueue.push, callback);
        return;
      }
      callback();
    });
  });
  pullQueue.setDrain(() => {
    console.log('\nAll articles downloaded');
    process.exit();
  });
  pullQueue.push(list);
});
