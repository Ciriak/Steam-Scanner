var gulp = require("gulp");
var del = require("del");
var builder = require("electron-builder");
var yarn = require("gulp-yarn");
var fs = require("fs-extra");
var typescript = require("gulp-tsc");
var gulpsync = require("gulp-sync")(gulp);

gulp.task("copy-assets", function() {
  console.log("Copying assets...");
  return gulp.src("./src/assets/**/*").pipe(gulp.dest("./dist/assets"));
});

gulp.task("copy-json", function() {
  console.log("Copying package.json...");
  return gulp.src("./src/package.json").pipe(gulp.dest("./dist/"));
});

gulp.task("update-json", function() {
  console.log("Updating package infos...");
  try {
    var pJson = require("./package.json");
    var wJson = require("./dist/package.json");
  } catch (e) {
    console.error(e);
  }
  wJson.author = pJson.author;
  wJson.version = pJson.version;
  wJson.name = pJson.name;
  wJson.description = pJson.description;
  try {
    return fs.writeJsonSync("./dist/package.json", wJson);
  } catch (e) {
    console.error(e);
  }
});

gulp.task("copy-dependencies", function() {
  console.log("Copying dependencies...");
  return gulp
    .src(["./src/node_modules/**/*"])
    .pipe(gulp.dest("./dist/node_modules"));
});

gulp.task("install-dependencies", function() {
  return gulp.src(["./src/package.json"]).pipe(yarn({ force: true }));
});

gulp.task(
  "prepare-dev-env",
  gulpsync.sync([
    // sync
    ["copy-assets", "copy-json"],
    ["update-json"],
    ["install-dependencies"],
    ["copy-dependencies"],
    ["compile"]
  ])
);

gulp.task("compile", function() {
  console.log("Compiling scripts...");
  return gulp
    .src(["src/app.ts"])
    .pipe(typescript())
    .pipe(gulp.dest("./dist/"));
});

gulp.task("clean:build", function() {
  return del("./build/**/*");
});

gulp.task("clean:dist", function() {
  return del("./dist/**/*");
});

gulp.task(
  "build",
  gulpsync.sync([
    ["clean:build", "clean:dist"],
    ["prepare-dev-env"],
    ["package-app"]
  ])
);

gulp.task("default", ["prepare-dev-env"]);

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
