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
    fs.access(fullSavePath, fs.constants.R_OK, err => {
      if (err) {
        download.get(url, fullSavePath, queuePushFn, callback, item);
        return;
      }

      terminal.print(`Exists. Skipping ${item.slice(0, 40)}`);
      callback();
    });
  }

  static formatToLocalHTML(html, fullList) {
    let newHtml = html;

    /* Remove tags (script, link, meta ) */
    newHtml = newHtml.replace(/<script.*?\/>/g, "");
    newHtml = newHtml.replace(/<link.*?\/>/g, "");
    newHtml = newHtml.replace(/<meta.*?\/>/g, "");
    newHtml = newHtml.replace(/<script(.|[\n\t])*?>(.|[\n\t])*?<\/\s?script>/g, "");

    // inject index.css
    newHtml = newHtml.replace(
      /<\/\s?head>/, m => `<link rel="stylesheet" href="index.css" /> ${m}`
    );

    // BUG: when a video, we end up replacing <a> tag with <span>. Ends up killing the reference
    newHtml = newHtml.replace(/<a\s+?href="([^\s]*?)".*?>(.*?)<\/\s?a>/g, (m, a, b) => {
      if (a[0] === "#") return m; // dont touch anything if an anchor
      // Shorten to a relative path and add .html
      const href = a.split("/").slice(-1)[0];
      if (fullList[href]) return `<a href="${href}.html">${b}</a>`;
      else if (/(?:ogv|ogg|webm|mp4|mp3|wav|aac)/.test(href))
        return `<a href="images/${href}">${b}</a>`;
      return `<span>${b}</span>`;
    });

    // Fix images so they show up
    newHtml = newHtml.replace(/img.+src="(.+?)"/g, (m, a) => {
      let newLink = a.split("/").slice(-1)[0];
      if (newLink.length > 32 && newLink.split(".").length === 1) newLink += ".svg";
      newLink = decodeURIComponent(newLink);
      return `img src="images/${newLink}" onerror="this.style.display='none'"`;
    });

    // Fix videos so that will hide on error
    newHtml = newHtml.replace(
      /<video(.+?)>/g, (m, a) => `<video ${a} onerror="this.style.display='none'">`
    );

    /* Remove sidebar - Goes from #mw-navigation to #footer. Litterally
    deletes everything in between. #mw-navigation typically is at the end */
    newHtml = newHtml.replace(
      /<div.+id="mw-navigation"(?:.|[\r\n])+?<div.+id="footer"/, '<div id="footer"'
    );

    // Set charset
    newHtml = newHtml.replace(/<head>/, '<head><meta charset="UTF-8">');

    return newHtml;
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

  processHTML(article, fullList, queuePushFn, callback) {
    const fileName = `${article}.html`;
    const rawFullSavePath = path.join(__dirname, '../', 'raw_wiki_articles/', fileName);
    const processedFullSavePath = path.join(__dirname, '../', 'processed_wiki_articles/', fileName);
    
    fs.readFile(rawFullSavePath, 'utf8', (err, data) => {
      if (err) { console.log('err'); callback(); return; }
      const html = this.constructor.formatToLocalHTML(data, fullList);
      fs.writeFile(processedFullSavePath, html, err => {
        callback();
      });
    });
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
