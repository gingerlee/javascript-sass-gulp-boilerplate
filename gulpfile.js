const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const utilities = require('gulp-util');
const del = require('del');
const jshint = require('gulp-jshint');
const buildProduction = utilities.env.production;
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const babelify = require('babelify');
const lib = require('bower-files')({
  "overrides":{
    "materialize" : {
      "main": [
        "sass/materialize.scss",
        "dist/css/materialize.css",
        "dist/js/materialize.js"
      ]
    },
  }
});

gulp.task('jshint', function(){
  return gulp.src(['src/js/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('concatInterface', function() {
  return gulp.src(['./src/js/*-interface.js'])
  .pipe(concat('allConcat.js'))
  .pipe(gulp.dest('./tmp'));
});

gulp.task('jsBrowserify', ['concatInterface'], function() {
  return browserify({ entries: ['./tmp/allConcat.js'] })
    .transform(babelify.configure({
      presets: ["es2015"]
    }))
    .bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('minifyScripts', ['jsBrowserify'], function(){
  return gulp.src('./dist/js/app.js')
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('bowerJS', function () {
  return gulp.src(lib.ext('js').files)
    .pipe(concat('vendor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('bowerCSS', function () {
  return gulp.src(lib.ext('css').files)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('bower', ['bowerJS', 'bowerCSS']);


gulp.task("clean", function(){
  return del(['dist', 'tmp']);
});

gulp.task('build', ['clean'], function(){
  if (buildProduction) {
    gulp.start('minifyScripts');
  } else {
    gulp.start('jsBrowserify');
  }
  gulp.start('bower');
  gulp.start('cssBuild');
});

gulp.task('serve', ['build'], function() {
  browserSync.init({
    server: {
      baseDir: "./",
      index: "index.html"
    }
  });

  gulp.watch(['src/js/*.js'], ['jsBuild']);
  gulp.watch(['bower.json'], ['bowerBuild']);
  gulp.watch(['*.html'], ['htmlBuild']);
  gulp.watch('src/scss/*.scss', ['cssBuild']);
});

gulp.task('jsBuild', ['jsBrowserify', 'jshint'], function(){
  browserSync.reload();
});

gulp.task('bowerBuild', ['bower'], function(){
  browserSync.reload();
});

gulp.task('htmlBuild', ['bower'], function(){
  browserSync.reload();
});

gulp.task('cssBuild', ['bower'], function(){
  return gulp.src('src/scss/*.scss')
  .pipe(sourcemaps.init())
  .pipe(sass())
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./dist/css'))
  .pipe(browserSync.stream());
});
