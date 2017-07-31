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

module.exports = {
  loadListFile
};
