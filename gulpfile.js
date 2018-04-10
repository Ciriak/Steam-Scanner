var gulp = require("gulp");
var del = require("del");
var builder = require("electron-builder");
var install = require("gulp-install");
var fs = require("fs-extra");
var gulpsync = require("gulp-sync")(gulp);
var pjson = require("./package.json");

gulp.task("copy-assets", function () {
  gulp.src("./src/assets/**/*").pipe(gulp.dest("./dist/assets"));
});

gulp.task("generate-pjson", function () {
  delete pjson.devDependencies;
  delete pjson.build;
  delete pjson.scripts;
  fs.ensureFileSync("./dist/package.json");
  return fs.writeJsonSync("./dist/package.json", pjson);
});

gulp.task("copy-dependencies", function () {
  return gulp
    .src(["./src/node_modules/**/*"])
    .pipe(gulp.dest("./dist/node_modules"));
});

gulp.task("install-dependencies", function () {
  return gulp.src(["./src/package.json"]).pipe(install());
});

gulp.task(
  "prepare-dev-env",
  gulpsync.sync([
    // sync
    ["copy-assets", "generate-pjson"],
    ["install-dependencies"]
  ])
);

gulp.task("clean:build", function () {
  return del("./build/**/*");
});

gulp.task("clean:dist", function () {
  return del("./dist/**/*");
});

gulp.task(
  "build",
  gulpsync.sync([["clean:build"], ["prepare-dev-env"], ["copy-dependencies"], ["package-app"]])
);

gulp.task("default", gulpsync.sync([["prepare-dev-env"]]));

gulp.task("package-app", function (callback) {
  builder
    .build()
    .then(function () {
      callback();
    })
    .catch(function (err) {
      callback(err);
    });
});
