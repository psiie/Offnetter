const path = require("path");

const WIKI_LIST = "wiki_list1k.lst";
// const REPLACE_CSS_CLASSES_IDS = false; // Slow. replaces id/classes with 2 letter codes
const WIKI_DL = path.join(__dirname, "raw_wiki_articles");
const PRE_PROCESSED_WIKI_DL = path.join(
  __dirname,
  "preprocessed_wiki_articles"
);
const POST_PROCESSED_WIKI_DL = path.join(
  __dirname,
  "postprocessed_wiki_articles"
);
const SAVE_PATH = path.join(WIKI_DL, "images");
const RELATIVE_SAVE_PATH = "images/";
const IMAGE_EXTENSIONS = {
  svg: 1,
  png: 1,
  jpg: 1,
  ico: 1
};
const DATABASE_LINKS = path.join(__dirname, "database_links.db");
let CONCURRENT_CONNECTIONS = 4;
let MEDIA_WIKI = "https://en.wikipedia.org/wiki/";

module.exports = {
  WIKI_DL,
  MEDIA_WIKI,
  WIKI_LIST,
  SAVE_PATH,
  RELATIVE_SAVE_PATH,
  PRE_PROCESSED_WIKI_DL,
  POST_PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS,
  DATABASE_LINKS
  // REPLACE_CSS_CLASSES_IDS
};
