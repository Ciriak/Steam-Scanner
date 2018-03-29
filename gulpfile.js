var gulp = require("gulp");
var clean = require("gulp-clean");
var concat = require("gulp-concat");

gulp.task("compile-js", function() {
  return gulp.src(["./src/**/*.js"]).pipe(gulp.dest("./dist/"));
});

gulp.task("clean", function() {
  return gulp
    .src("./dist", {
      allowEmpty: true
    })
    .pipe(clean());
});

gulp.task("watchers", function() {
  gulp.watch("./src/**/*.js", gulp.series("compile-js"));
});

gulp.task("default", gulp.series("clean", gulp.parallel("compile-js")));

gulp.task("dev", gulp.series("default", "watchers"));
