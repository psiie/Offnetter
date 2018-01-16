const fs = require('fs');
const path = require('path');
const Pull = require('./modules/pull');
const Article = require('./modules/article');

const article = new Article();

class GetAssetList extends Pull {
  constructor() {
    super();

    this.allImageSources = {};
    this.allVideoSources = {};

    this.onFinish = this.onFinish.bind(this);
    this.outputFilename = path.join(__dirname, 'assetList.txt');
    
    // only write if file doesnt exist
    fs.writeFileSync(this.outputFilename, '', 'utf8')
  }

  onFinish() {
    console.log('Finished parsing keys. Writing to file.', Object.keys(this.allImageSources).length);
    const outputFilename = path.join(__dirname, 'assetList.txt');

    console.log('Done');
    process.exit();
  }

  articleFn(listItem, callback) {
    const getVideos = false;
    const assets = article.findAssets(listItem, getVideos);
    const { imageSources, videoSources } = assets || [{}, {}];
    
    const pageAssets = Object.assign({}, imageSources, videoSources);

    Object.keys(pageAssets).forEach(key => {
      fs.appendFileSync(this.outputFilename, `${key}\n`, 'utf8');
    });

    callback();
  }
}

const getAssetList = new GetAssetList();
