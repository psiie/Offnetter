// function getJSON() {
//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve('42');
//     }, 1000);
//   });
// }

// const makeRequest = async () => {
//   console.log('1');
//   const json = await getJSON();
//   console.log('2');
//   return json;
// }

// const req = makeRequest();
// console.log('3');
// console.log('Done!', req);
// console.log('4');

const path = require('path');
const Commons = require('./modules/commons');
const Config = require('./modules/config');

const config = new Config();
const wikilistFile = path.join(__dirname, 'selections', config.WIKI_LIST)

async function getList() {
  const list = await Commons.loadListFile(wikilistFile, null);
  console.log('Done. List:', list.length);
}

getList();
console.log('script done');