const gulp = require('gulp');
const gs = require('gulp-selectors');
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');

const cleanCssOpts = {
  compatibility: 'ie7',
  rebase: true,
  rebaseTo: '/',
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

gulp.task('minify-css', () => {
  return gulp
    .src('test_input/index.css') //
    .pipe(cleanCSS(cleanCssOpts)) //
    .pipe(gulp.dest('test_input/index_clean/')); //
});

gulp.task('minify-css-names', function() {
  return gulp
    .src(['test_input/index_clean/index.css', 'test_input/**/*.html']) //
    .pipe(gs.run()) //
    .pipe(htmlmin(htmlMinOpts)) //
    .pipe(gulp.dest('test_output')); //
});

gulp.task('default', ['minify-css', 'minify-css-names']);
