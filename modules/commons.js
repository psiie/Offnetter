const readline = require('readline');
const fs = require('graceful-fs');

class Commons {
  static loadListFile(filename, callback) {
    /* We must load in the list to be processed before downloading */
    new Promise(resolve => {
      const wikiList = [];
      const lineReader = readline.createInterface({
        input: fs.createReadStream(filename),
      });
      lineReader.on('line', line => wikiList.push(line));
      lineReader.on('close', () => resolve(wikiList));
    }).then(callback);
  }
  static prependUrl(url) {
    if (/static\//.test(url)) return `https://wikipedia.org/${url}`;
    return url;
  }
  static clearUrl(url) {
    let newUrl = url;
    while (newUrl[0] === '/')
      newUrl = newUrl.slice(1);
    return newUrl;
  }
  static cleanListOfLinks(linkArr) {
    let linkList = linkArr;
    linkList = linkList.filter(url => {
      if (!url) return false;
      else if (url[0] === '#') return false;
      else if (/https?:\/\/.+wiki/g.test(url)) return true;
      else if (/https?:\/\//g.test(url)) return false;
      else if (/index.php/g.test(url)) return false;
      else if (/action=edit/g.test(url)) return false;
      else if (/^\/\//.test(url)) return false;
      return true;
    });
    linkList = linkList.map(url => decodeURI(url));
    linkList = linkList.map(url => url.replace(/^\/wiki\//, ''));
    linkList = linkList.map(url => url.split('?')[0]); // get rid of parameters eg: ?action=submit
    return linkList;
  }
  static getFilename(url) {
    return decodeURI(url.split('/').slice(-1)[0]);
  }
  static sanitizeURL(url) {
    let clean = url;
    if (!clean) return '';

    if (clean.slice(0,2) === '//') clean = clean.slice(2);
    if (!/\.org/.test(clean)) clean = `http://wikipedia.org/${clean}`;
    if (!/https?:\/\//.test(clean)) clean = `http://${clean}`;

    return clean;
  }
}

module.exports = Commons;
