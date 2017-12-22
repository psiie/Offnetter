const Pull = require('./modules/pull');
const Article = require('./modules/article');
const Queue = require('./modules/queue');
const Config = require('./modules/config');

const article = new Article();
const config = new Config();

class PullAssets extends Pull {
  constructor() {
    const assetFilename = 'assetList.txt';
    super(assetFilename);

    this.eachFn = this.eachFn.bind(this);
    this.queue = new Queue(config.CONCURRENT_CONNECTIONS, this.eachFn);
    this.queue.setDrain(this.onFinish);
  }

  push(list) {
    this.queue.push(list);
  }

  assetFn(listItem, callback) {
    article.getAsset(listItem, 'images', this.queue.push, callback);
  }

  eachFn(listItem, callback) {
    this.terminal.incLogCounter();
    this.terminal.print(`GET ${listItem}`);
    this.assetFn(listItem, callback);
  }
}

const pullAssets = new PullAssets();
