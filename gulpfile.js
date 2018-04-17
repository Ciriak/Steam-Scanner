var gulp = require("gulp");
var del = require("del");
var builder = require("electron-builder");
var yarn = require("gulp-yarn");
var fs = require("fs-extra");
var gulpsync = require("gulp-sync")(gulp);

gulp.task("copy-assets", function() {
  gulp.src("./src/assets/**/*").pipe(gulp.dest("./dist/assets"));
});

gulp.task("generate-json", function() {
  gulp.src("./src/package.json").pipe(gulp.dest("./dist/"));
});

gulp.task("update-json", function() {
  var pJson = require("./package.json");
  var wJson = require("./dist/package.json");
  wJson.author = pJson.author;
  wJson.version = pJson.version;
  wJson.name = pJson.name;
  wJson.description = pJson.description;
  return fs.writeJsonSync("./dist/package.json", wJson);
});

gulp.task("copy-dependencies", function() {
  return gulp
    .src(["./src/node_modules/**/*"])
    .pipe(gulp.dest("./dist/node_modules"));
});

gulp.task("install-dependencies", function() {
  return gulp.src(["./src/package.json"]).pipe(yarn());
});

gulp.task(
  "prepare-dev-env",
  gulpsync.sync([
    // sync
    ["copy-assets", "generate-json"],
    ["update-json"],
    ["install-dependencies"]
  ])
);

gulp.task("clean:build", function() {
  return del("./build/**/*");
});

gulp.task(
  "build",
  gulpsync.sync([
    ["clean:build"],
    ["prepare-dev-env"],
    ["copy-dependencies"],
    ["package-app"]
  ])
);

gulp.task("default", gulpsync.sync([["prepare-dev-env"]]));

gulp.task("package-app", function(callback) {
  builder
    .build()
    .then(function() {
      callback();
    })
    .catch(function(err) {
      callback(err);
    });
});
