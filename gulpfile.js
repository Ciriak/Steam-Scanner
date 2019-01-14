const gulp = require("gulp");
const del = require("del");
const ts = require("gulp-typescript");
const fs = require("fs-extra");
const colors = require("colors");
const terser = require("gulp-terser");
const packager = require("electron-packager");
const shell = require("gulp-shell");
var tsProject = ts.createProject("tsconfig.json");

const packageOptions = {
  dir: "./dist",
  out: "./build",
  asar: false,
  overwrite: true,
  executableName: "Steam Scanner",
  icon: "./src/assets/scanner.ico"
};

gulp.task("clean:node_modules", function() {
  return del("./node_modules", { force: true });
});

gulp.task("clean:dist", function() {
  return del("./dist", { force: true });
});

gulp.task("clean:build", function() {
  return del("./build", { force: true });
});

gulp.task("clean", gulp.parallel("clean:dist", "clean:build"));

gulp.task("min-es6", function() {
  return gulp
    .src(["./dist/*.js", "./dist/interfaces/**/*.js", "./dist/modules/**/*.js"])
    .pipe(terser({}))
    .pipe(gulp.dest("./dist"));
});

gulp.task("copy-models", function() {
  return gulp.src("./src/**/*.json").pipe(gulp.dest("./dist"));
});

gulp.task("generate-package-file", function(callback) {
  const pJson = fs.readJsonSync("./package.json");
  const package = {
    version: pJson.version,
    name: pJson.name,
    productName: pJson.productName,
    description: pJson.description,
    main: pJson.main,
    dependencies: pJson.dependencies,
    scripts: {
      postinstall: "./node_modules/.bin/electron-rebuild" // rebuild copied dependencies
    }
  };
  fs.ensureFileSync("./dist/package.json");
  fs.writeJsonSync("./dist/package.json", package);
  callback();
});

gulp.task("compile", function() {
  var tsResult = gulp
    .src("./src/**/*.ts") // or tsProject.src()
    .pipe(tsProject());

  return tsResult.js.pipe(gulp.dest("dist"));
});

gulp.task(
  "install-build-dependencies",
  shell.task("npm i --only=production", {
    cwd: "./dist"
  })
);

gulp.task("copy-assets", function() {
  return gulp.src("./src/assets/**/*").pipe(gulp.dest("./dist/assets"));
});

gulp.task("electron-build", function(callback) {
  packager(packageOptions).then((appPaths) => {
    callback();
  });
});

gulp.task("watch", function() {
  console.log(colors.green("Dev environment ready and watching changes !"));
  console.log(
    colors.cyan(
      colors.bgWhite(colors.black(" electron dist/app.js ")) +
        " in another terminal to launch Steam Scanner..."
    )
  );

  // watchers
  gulp.watch("./src/**/*.ts", gulp.series("compile"));
});

gulp.task(
  "default",
  gulp.series(
    "clean",
    gulp.parallel(
      "generate-package-file",
      "copy-models",
      "copy-assets",
      gulp.series("compile", "min-es6")
    )
  )
);

gulp.task(
  "build",
  gulp.series(
    "default",
    "generate-package-file",
    "install-build-dependencies",
    "electron-build"
  )
);

gulp.task("install", gulp.series("clean", "default"));

gulp.task("dev", gulp.series("default", "watch"));
