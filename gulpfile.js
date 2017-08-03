const gulp = require("gulp");
const gs = require("gulp-selectors");
const cleanCSS = require("gulp-clean-css");
const htmlmin = require("gulp-html-minifier");
const htmltidy = require("gulp-htmltidy");

const tidyOpts = {
  doctype: "html5",
  hideComments: true,
  indent: false
};

const cleanCssOpts = {
  compatibility: "ie7",
  rebase: true,
  rebaseTo: "/",
  level: 2
};

const htmlMinOpts = {
  collapseWhitespace: true,
  collapseInlineTagWhitespace: true,
  collapseBooleanAttributes: true,
  decodeEntities: true,
  html5: false,
  keepClosingSlash: false,
  minifyCSS: false, // uses cleanCSS which we have already done
  minifyURLs: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeEmptyElements: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeTagWhitespace: false, // will result in "invalid hmtl". But renders fine
  sortAttributes: true,
  useShortDoctype: true
};

gulp.task("minify-css", () => {
  return gulp
    .src("./index.css") //
    .pipe(cleanCSS(cleanCssOpts)) //
    .pipe(gulp.dest("preprocessed_wiki_articles/index_clean")); //
});

gulp.task("htmlmin", () => {
  console.log(
    "Warning. You will get no status on this task. It will take a long time"
  );
  return gulp
    .src([
      "preprocessed_wiki_articles/index_clean/index.css",
      "preprocessed_wiki_articles/**/*.html"
    ]) //
    .pipe(htmltidy(tidyOpts)) //
    .pipe(htmlmin(htmlMinOpts)) //
    .pipe(gs.run()) //
    .pipe(gulp.dest("postprocessed_wiki_articles")); //
});

// ----------------------------------------------------------------- //

gulp.task("default", ["minify-css", "htmlmin"]);
