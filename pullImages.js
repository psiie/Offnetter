const async = require("async");
const path = require("path");
const download = require("download");
const fs = require("fs");
const CONCURRENT_CONNECTIONS = 4;
const WIKI_DL = path.join(__dirname, "raw_wiki_articles");

// function downloadWikiImages() {
//   function processImage(image, callback) {
//     /* Check for file access. If the process returns an error, this means
//     the file doesn't exist. So lets download the image! Otherwise, skip */
//     const filePath = path.join(WIKI_DL, image + ".html");
//     fs.access(filePath, fs.constants.R_OK, err => {
//       if (err) console.log("downloading", article);
//       else console.log("skipping", article);
//       err ? getArticle(article, callback) : callback();
//     });
//   }

//   const queue = async.queue(processImage, CONCURRENT_CONNECTIONS);
//   queue.push(articleListArr);
//   queue.drain = () => {
//     console.log("All articles downloaded");
//   };
// }

const dir = fs.readdirSync(WIKI_DL);
console.log(dir);

// let partial = ".fsdf.hack.html".split('.');
// partial.slice(0, -1).join('.');
