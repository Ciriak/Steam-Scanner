var gulp = require("gulp");
var del = require("del");
var builder = require("electron-builder");
var gulpsync = require("gulp-sync")(gulp);

gulp.task("copy-assets", function() {
  gulp.src("./src/assets/**/*").pipe(gulp.dest("./dist/assets"));
});

gulp.task("copy-pjson", function() {
  gulp.src("./src/package.json").pipe(gulp.dest("./dist/"));
});

gulp.task(
  "prepare-dev-env",
  gulpsync.sync([
    // sync
    ["copy-assets", "copy-pjson"]
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
