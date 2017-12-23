const Pull = require('./modules/pull');
const Article = require('./modules/article');

const article = new Article();

class PullArticles extends Pull {
  articleFn(listItem, callback) {
    article.getHTML(listItem, this.queue.push, callback);
  }
}

const pullArticles = new PullArticles();
