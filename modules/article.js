const fs = require('graceful-fs');
const path = require('path');
const urlPath = require('url');
const Config = require('./config');
const Terminal = require('./terminal');
const Download = require('./download');

const config = new Config();
const terminal = new Terminal(-1);
const download = new Download();

class Article {
  static downloadIfMissing(url, fullSavePath, queuePushFn, callback, item) {
    fs.access(fullSavePath,  fs.constants.R_OK, err => {
      if (err) {
        download.get(url, fullSavePath, queuePushFn, callback, item);
        return;
      }

      terminal.print(`Exists. Skipping ${item.slice(0, 40)}`);
      callback();
    });
  }

  constructor() {
    this.savePath = path.join(__dirname, '../', 'raw_wiki_articles/');
  }

  getHTML(article, queuePushFn, callback) {
    const fileName = `${article}.html`;
    const fullSavePath = path.join(__dirname, '../', 'raw_wiki_articles/', fileName);
    const url = config.MEDIA_WIKI + article;
    this.constructor.downloadIfMissing(url, fullSavePath, queuePushFn, callback, article);
  }

  getAsset(url, folder = '', queuePushFn, callback) {
    const parsed = urlPath.parse(url);
    const filename = parsed ? path.basename(parsed.pathname || '') : null;
    if (!filename) { callback(); return; }
    const fullSavePath = path.join(this.savePath, folder, filename);
    this.constructor.downloadIfMissing(url, fullSavePath, queuePushFn, callback, url);
  }

  findAssets(article, getVideos = false) {
    /* This entire func must remain sync as the async.queue function I use to
    process queues is only intended for side-effects and not pure functions */
    const fileName = `${article}.html`;
    const fullSavePath = path.join(__dirname, '../', 'raw_wiki_articles/', fileName);
    
    try {
      fs.accessSync(fullSavePath, fs.constants.R_OK);
    } catch (e) {
      return null;
    }
    
    const html = fs.readFileSync(fullSavePath, "utf8");
    if (!html) return null;

    const imageSources = {};
    const videoSources = {};

    html.replace(/img.+?src="(.+?)"/g, (m, a) => imageSources[a] = 1);
    if (getVideos) html.replace(/href="(.{1,128}?\.(?=ogv|ogg|webm|mp4|mp3|wav|aac).{3,4})"/g, (m, a) => videoSources[a] = 1);

    return { imageSources, videoSources };
  }
}

module.exports = Article;
