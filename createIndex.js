const async = require('async');
const path = require('path');
const download = require('download');
const cheerio = require('cheerio');
const fs = require('fs');
// const fse = require('fs-extra'); // going to use this to copy files
const { loadListFile } = require('./_helper');
const { WIKI_LIST, PROCESSED_WIKI_DL } = require('./config');

function generateIndex(indexList) {
  const $ = cheerio.load('');
  $('body').append($('<ul>'));
  indexList.forEach(item => {
    let $listItem = $('<li>');
    let $anchor = $('<a>');
    $anchor.text(item);
    $anchor.attr('href', `${item}.html`);
    $listItem.append($anchor);
    $('ul').append($listItem);
  });

  const indexPagePath = path.join(PROCESSED_WIKI_DL, 'index.html');
  fs.writeFile(indexPagePath, $.html(), 'utf8', err => {
    if (err) console.log('error writing index.html page');
    console.log('Index page generated and saved');
  });
}

function filterList(listFileArr) {
  let processedFiles = fs.readdirSync(PROCESSED_WIKI_DL);
  processedFiles = processedFiles.map(file => file.split('.').slice(0, -1)[0]);
  let indexList = listFileArr;
  indexList = indexList.filter(file => {
    const inList = processedFiles.indexOf(file) !== -1;
    console.log(inList ? `keeping ${file}` : `not in dl-folder ${file}`);
    return inList;
  });
  indexList = indexList.sort();
  generateIndex(indexList);
}

loadListFile(WIKI_LIST).then(filterList);
