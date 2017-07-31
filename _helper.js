const path = require("path");

function loadListFile(filename) {
  /* We must load in the list to be processed before downloading */
  return new Promise(resolve => {
    const wikiList = [];
    const lineReader = require("readline").createInterface({
      input: require("fs").createReadStream(
        path.join(__dirname, "selections", filename)
      )
    });

    lineReader.on("line", line => wikiList.push(line));
    lineReader.on("close", () => resolve(wikiList));
  });
}

const cleanUrl = url => (url[0] === "/" ? url.slice(2) : url);
const getFilename = url => url.split("/").slice(-1)[0].replace(/%/g, "");

module.exports = {
  loadListFile,
  cleanUrl,
  getFilename
};
