// eslint-disable-next-line import/order
const pkg = require('./package.json');

const clientRef = pkg.name; // Required to map to client theme dir and used for browserSync;

// -- Project URLs
const wpURL = `${clientRef}.local`;

// -- Project variables
const srcSass = './src/sass'; // location of our authored SCSS files
const srcJS = './src/js'; // location of our authored JS files
const srcImg = './src/img'; // location of our authored Image files
const distPath = './dist'; // Destination folder where author files are compiled to

// -- Loading Gulp plug-ins
const { src, dest, series, watch } = require('gulp');
const { exec } = require('child_process');
const browsersync = require('browser-sync').create();
const scss = require('gulp-sass');
scss.compiler = require('node-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const del = require('del');
const minify = require('gulp-minify');

// Webpack + Gulp
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');

// -- CSS Gulp Tasks
// Compile Sass
function _scss() {
  return src(`${srcSass}/main.scss`, { nodir: true })
    .pipe(scss())
    .pipe(
      dest(`${distPath}/css/`, {
        overwrite: true,
      })
    );
}

// Run postcss rules + plugins on compiled Sass (includes minification)
function _postcss() {
  const plugins = [autoprefixer(), cssnano()];

  return src(`${distPath}/css/styles.css`, {
    nodir: true,
  })
    .pipe(postcss(plugins))
    .pipe(
      rename({
        extname: '.min.css',
      })
    )
    .pipe(dest(`${distPath}/css/`));
}

// Concat any vendor CSS into -> dest/css/style.css
function _concatcss() {
  return src([`${distPath}/css/styles.css`], { allowEmpty: true })
    .pipe(concat('styles.css'))
    .pipe(
      rename({
        basename: 'styles',
      })
    )
    .pipe(dest(`${distPath}/css/`));
}

// -- JS Gulp Tasks
function _vendorsJs() {
  return src([`${srcJS}/lib/*.js`, `${srcJS}/lib/**/*.js`], {
    allowEmpty: true,
  })
    .pipe(concat('vendors.js'))
    .pipe(dest(`${distPath}/js/`));
}

function _customJs() {
  return src(`${srcJS}/scripts.js`, {
    allowEmpty: true,
  })
    .pipe(webpackStream(webpackConfig))
    .pipe(dest(`${distPath}/js/`));
}

function _bundleJs() {
  return src([`${distPath}/js/vendors.js`, `${distPath}/js/bundle.js`], {
    allowEmpty: true,
  })
    .pipe(concat('scripts.js'))
    .pipe(minify({ ext: '.min.js', preserveComments: '#' }))
    .pipe(dest(`${distPath}/js/`));
}

function _cleanJs() {
  return del([`${distPath}/js/vendors.js`, `${distPath}/js/bundle.js`]);
}

// -- Image Tasks
// Optimize images
function _imagemin() {
  return src(`${srcImg}/*`).pipe(
    imagemin([
      imagemin.gifsicle({ interlaced: true, optimizationLevel: 2 }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.svgo({
        plugins: [
          {
            removeViewBox: true,
            cleanupIDs: true,
            inlineStyles: true,
            removeComments: true,
            removeMetadata: true,
            removeTitle: true,
            removeDesc: true,
            sortAtrs: true,
          },
        ],
      }),
    ]).pipe(dest(`${distPath}/img`))
  );
}

// -- Copy Tasks

// -- BrowserSync
function _bsReload(cb) {
  browsersync.reload();
  cb();
}

// Runs all gulp tasks with the exception of BrowserSync
exports.default = series(
  _scss,
  _concatcss,
  _postcss,
  _vendorsJs,
  _customJs,
  _bundleJs,
  _cleanJs,
  _imagemin
);

exports.wp = function() {
  browsersync.init({
    proxy: wpURL,
    host: wpURL,
    open: true,
    injectChanges: true,
  });

  watch(
    [`./src/**/*.js`],
    { ignoreInitial: false },
    series(_vendorsJs, _customJs, _bundleJs, _cleanJs, _bsReload)
  );

  watch(
    [`./src/**/*.scss`],
    { ignoreInitial: false },
    series(_scss, _concatcss, _postcss, _bsReload)
  );

  watch(
    [`${srcImg}/**/*`],
    { ignoreInitial: false },
    series(_imagemin, _bsReload)
  );

  watch([`./templates/**/*.twig`], { ignoreInitial: false }, series(_bsReload));
};
