const path = require('path');
const Pull = require('./modules/pull');
const Article = require('./modules/article');
const Commons = require('./modules/commons');
const Config = require('./modules/config');

const config = new Config();
const article = new Article();
const articleList = {};

class ProcessArticles extends Pull {
  constructor() {
    const assetListFile = 'assetList.txt';
    super(assetListFile);
    this.wikiList = {};
  }

  articleFn(listItem, callback) {
    // check if file exists first
    article.processHTML(listItem, this.wikiList, this.queue.push, callback);
  }

  async beforeStart(list) {
    console.log('beforelist', list.length);
    // Sanitize Asset links as they are dirty
    // const assetListArr = list.map(item => Commons.sanitizeURL(item));
    // assetListArr.forEach(item => this.assetList[item] = true);
    
    // load list of wiki articles & turn into object
    const wikiListFile = path.join(__dirname, 'selections', config.WIKI_LIST)
    const wikiList = await Commons.loadListFile(wikiListFile, null);
    // TODO: reduce wikiList to only include successfully downloaded files
    wikiList.forEach(item => this.wikiList[item] = true);

    this.queue.push(wikiList);
  }
}

const processArticles = new ProcessArticles();
