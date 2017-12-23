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
  }

  onFinish() {
    console.log('Finished parsing keys. Writing to file.', Object.keys(this.allImageSources).length);
    const outputFilename = path.join(__dirname, 'assetList.txt');

    const allAssets = Object.assign(
      {},
      Object.keys(this.allImageSources),
      Object.keys(this.allVideoSources),
    );

    fs.writeFileSync(outputFilename, '', 'utf8');
    Object.keys(allAssets).forEach(key => {
      fs.appendFileSync(outputFilename, `${allAssets[key]}\n`, 'utf8');
    });

    console.log('Done');
    process.exit();
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
