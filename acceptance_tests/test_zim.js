const async = require("async");
const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const { loadListFile } = require("../_helper");

const ignoreExt = ['js', 'html', 'css'];
const kiwixServer = 'http://localhost:8009/2017-10-25_0218';

let status200 = 0;
let status404 = 0;
const images200 = [];
const images404 = [];

function testPage(page, callback) {
  const url = `${kiwixServer}/A/${page}.html`;
  request(url, (err, data) => {
    if (err || (data && !data.body)) {
      console.log('err:', err);
      callback();
      return;
    }

    // Find all images on page and check if they are in the zim
    // will need to rewrite so that these nested requests get added to a queue
    const $ = cheerio.load(data.body);
    $('[src]').each((idx, item) => {
      if (!item || (item && item.attribs && !item.attribs.src)) return;
      let filePath = item.attribs.src;
      const ext = filePath && filePath.split('.').reverse()[0];
      if (ignoreExt.indexOf(ext.toLowerCase()) !== -1) return;
      filePath = filePath.replace("../", "/"); // remove leading ..
      filePath = kiwixServer + filePath;
      request(filePath, (err, data) => {
        if (err) console.log('1err', err);
        else if (data && data.statusCode >= 400) {
          status404++;
          images404.push(filePath);
          console.log('no image found', filePath);
        } else if (data && data.statusCode < 400) {
          status200++;
          images200.push(filePath);
        }
      });

    });
    
    callback();
  });
}

loadListFile('frwiki-test-long.txt').then(list => {
  const queue = async.queue(testPage, 1);
  queue.push(list);
  queue.drain = () => {
    console.log("\nAll html files parsed for images");
    console.log(`${status200} Found images in zim`);
    console.log(`${status404} Missing images in zim`);
    fs.writeFileSync(path.join(__dirname, 'results/200.txt'), images200, 'utf8');
    fs.writeFileSync(path.join(__dirname, 'results/404.txt'), images404, 'utf8');
  };
});
