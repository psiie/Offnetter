const path = require('path');

class Config {
  constructor() {
    this.WIKI_LIST = 'wiki_list_10g.lst';
    this.MEDIA_WIKI = 'https://en.wikipedia.org/wiki/';

    this.path = path;
    this.CONCURRENT_CONNECTIONS = 8;
    this.LOG_MISSING = true;

    this.WIKI_DL = path.join(__dirname, 'raw_wiki_articles');
    this.SAVE_PATH = path.join(this.WIKI_DL, 'images');
    this.RELATIVE_SAVE_PATH = 'images/';
    this.DATABASE_LINKS = path.join(__dirname, 'database_links.db');
    this.PROCESSED_WIKI_DL = path.join(__dirname, 'processed_wiki_articles');
    this.IMAGE_EXTENSIONS = {
      svg: 1,
      png: 1,
      gif: 1,
      jpg: 1,
      ico: 1,
    };
  }
}

module.exports = Config;
