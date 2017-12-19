const Pull = require('./modules/pull');
const Article = require('./modules/article');

const article = new Article();

class GetAssetList extends Pull {
  constructor() {
    super();

    this.allImageSources = {};
    this.allVideoSources = {};

    this.onFinish = this.onFinish.bind(this);
  }

  onFinish() {
    console.log('Ready to pull Images of', Object.keys(this.allImageSources).length);
  }

  articleFn(listItem, callback) {
    const getVideos = false;
    const assets = article.findAssets(listItem, getVideos);
    const { imageSources, videoSources } = assets || [{}, {}];

    this.allImageSources = Object.assign({}, this.allImageSources, imageSources);
    this.allVideoSources = Object.assign({}, this.allVideoSources, videoSources);
    callback();
  }
}

const getAssetList = new GetAssetList();

// const Config = require('./modules/config');
// const Commons = require('./modules/commons');
// const Queue = require('./modules/queue');
// const Terminal = require('./modules/terminal');
// const config = new Config();

// const onFinish = () => {
//   console.log('\nAll Assets downloaded');
//   process.exit();
// };

// Commons.loadListFile(config.WIKI_LIST, list => {
//   const processEachFn = (listItem, callback) => {
//     terminal.incLogCounter();
//     terminal.print(`Downloading Asset ${listItem.slice(0, 40)}`);
//     const getVideos = false;
//     const { imageSources, videoSources } = article.getAssetList(listItem, getVideos);

    // allImageSources = Object.assign(allImageSources, imageSources);
    // allVideoSources = Object.assign(allVideoSources, videoSources);

//     callback();
//   };

//   const terminal = new Terminal(list.length);
//   const processQueue = new Queue(config.CONCURRENT_CONNECTIONS, processEachFn);
//   processQueue.setDrain(onFinish);
//   processQueue.push(list);
// });
