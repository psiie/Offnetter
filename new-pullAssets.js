const Pull = require('./modules/pull');
const Queue = require('./queue');
const Config = require('./config');

const config = new Config();

class PullAssets extends Pull {
  constructor() {
    super();
    this.eachFn = this.eachFn.bind(this);
    this.queue = new Queue(config.CONCURRENT_CONNECTIONS, this.eachFn);
    this.queue.setDrain(this.onFinish);
  }

  push(list) {
    this.queue.push(list);
  }

  assetFn(listItem, callback) {
    console.log('dummy', listItem);
    callback();
    // article.getHTML(listItem, this.queue.push, callback);
  }

  eachFn(listItem, callback) {
    this.terminal.incLogCounter();
    this.terminal.print(`Downloading ${listItem.slice(0, 40)}`);
    this.assetFn(listItem, callback);
  }

  init() {
    return null;
  }
}

const pullAssets = new PullAssets();