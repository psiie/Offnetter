const Config = require('./config');
const Commons = require('./commons');
const Queue = require('./queue');
const Terminal = require('./terminal');

const config = new Config();

class Pull {
  constructor() {
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

  init() {
    Commons.loadListFile(config.WIKI_LIST, list => {
      this.terminal.setListLength(list.length);
      this.queue.setDrain(this.onFinish);
      this.queue.push(list);
    });
  }
}

module.exports = Pull;
