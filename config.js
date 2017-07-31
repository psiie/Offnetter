const path = require("path");

const WIKI_LIST = "wiki_list10g1.lst";
const WIKI_DL = path.join(__dirname, "raw_wiki_articles");
const PROCESSED_WIKI_DL = path.join(__dirname, "processed_wiki_articles");
const SAVE_PATH = path.join(WIKI_DL, "images");
const RELATIVE_SAVE_PATH = "images/";
const IMAGE_EXTENSIONS = ["svg", "png", "jpg", "ico"];
let CONCURRENT_CONNECTIONS = 4;
let MEDIA_WIKI = "https://en.wikipedia.org/wiki/";

module.exports = {
  WIKI_DL,
  MEDIA_WIKI,
  WIKI_LIST,
  SAVE_PATH,
  RELATIVE_SAVE_PATH,
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS
};
