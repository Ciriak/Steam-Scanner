var gulp = require("gulp");
var del = require("del");
var builder = require("electron-builder");
var fs = require("fs-extra");
var gulpsync = require("gulp-sync")(gulp);
var pjson = require("./package.json");

gulp.task("copy-assets", function() {
  gulp.src("./src/assets/**/*").pipe(gulp.dest("./dist/assets"));
});

gulp.task("generate-pjson", function() {
  delete pjson.devDependencies;
  delete pjson.build;
  return fs.writeJsonSync("./dist/package.json", pjson);
});

gulp.task(
  "prepare-dev-env",
  gulpsync.sync([
    // sync
    ["copy-assets", "generate-pjson"]
  ])
);

gulp.task("clean:build", function() {
  return del("./build/**/*");
});

gulp.task("clean:dist", function() {
  return del("./dist/**/*");
});

gulp.task(
  "build",
  gulpsync.sync([["clean:build"], ["prepare-dev-env"], ["package-app"]])
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
