const path = require('path');
const Config = require('./config');
const Commons = require('./commons');
const Queue = require('./queue');
const Terminal = require('./terminal');

const config = new Config();

class Pull {
  constructor(listFile) {
    const wikilistPath = path.join(__dirname, '..', 'selections', config.WIKI_LIST);
    const listFilePath = path.join(__dirname, '..', listFile || '');
    this.listFile = listFile ? listFilePath : wikilistPath;
    this.terminal = new Terminal();
    this.eachFn = this.eachFn.bind(this);
    this.queue = new Queue(config.CONCURRENT_CONNECTIONS, this.eachFn);
    this.init();
  }

  onFinish() {
    console.log('\nEverything downloaded');
    process.exit();
  }

  articleFn() {}

  eachFn(listItem, callback) {
    this.terminal.incLogCounter();
    this.terminal.print(`Downloading ${listItem.slice(0, 40)}`);
    this.articleFn(listItem, callback);
  }

  beforeStart(list) {
    this.queue.push(list);
  }

  init() {
    Commons.loadListFile(this.listFile, list => {
      this.terminal.setListLength(list.length);
      this.queue.setDrain(this.onFinish);
      this.beforeStart(list);
    });
  }
}

module.exports = Pull;
