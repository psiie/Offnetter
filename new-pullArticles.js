const Config = require('./modules/config');
const Commons = require('./modules/commons');
const Queue = require('./modules/queue');
const Terminal = require('./modules/terminal');
const Article = require('./modules/article');

const config = new Config();
const article = new Article();
const savePath = 'raw_wiki_articles/';
const onFinish = () => {
  console.log('\nAll articles downloaded');
  process.exit();
};

Commons.loadListFile(config.WIKI_LIST, list => {
  const pullEachFn = (listItem, callback) => {
    terminal.incLogCounter();
    terminal.print(`Downloading ${listItem.slice(0, 40)}`);
    article.getHTML(listItem, pullQueue.push, callback);
  };

  const terminal = new Terminal(list.length);
  const pullQueue = new Queue(config.CONCURRENT_CONNECTIONS, pullEachFn);
  pullQueue.setDrain(onFinish);
  pullQueue.push(list);
});
