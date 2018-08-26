var gulp = require("gulp");
var del = require("del");
var builder = require("electron-builder");
var yarn = require("gulp-yarn");
var fs = require("fs-extra");
var typescript = require("gulp-tsc");
var pjson = require("./package.json");
var request = require("request");
var async = require("async");
var path = require("path");
var mime = require("mime-types");
var gulpsync = require("gulp-sync")(gulp);
var isNpmNotYarn = require("is-npm-not-yarn");
var ghToken;

if (isNpmNotYarn) {
  console.error(
    "STOP ! | Seriously, use Yarn not NPM, you wont be able to build anyway".red
  );
  process.exit(1);
  return false;
}

try {
  ghToken = fs.readFileSync("./.gh-token", "utf8");
} catch (e) {
  console.log("Warning - no gh-token provided, you won't be able to deploy !");
}

gulp.task("copy-assets", function() {
  console.log("Copying assets...");
  return gulp.src("./src/assets/**/*").pipe(gulp.dest("./dist/assets"));
});

gulp.task("copy-json", function() {
  console.log("Copying package.json...");
  return gulp.src("./src/*.json").pipe(gulp.dest("./dist/"));
});

gulp.task("update-json", function() {
  console.log("Updating package infos...");
  try {
    var wJson = require("./dist/package.json");
  } catch (e) {
    console.error(e);
  }
  wJson.author = pjson.author;
  wJson.version = pjson.version;
  wJson.name = pjson.name;
  wJson.description = pjson.description;
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
    .pipe(
      typescript({
        sourceMap: true
      })
    )
    .pipe(gulp.dest("./dist/"));
});

gulp.task("clean:build", function() {
  return del("./build/**/*");
});

gulp.task("clean:dist", function() {
  return del("./dist/**/*");
});

gulp.task("clean:src-modules", function() {
  return del("./src/node_modules/**/*");
});

gulp.task(
  "build",
  gulpsync.sync([
    ["clean:build", "clean:dist", "clean:src-modules"],
    ["prepare-dev-env"],
    ["package-app"]
  ])
);

gulp.task(
  "deploy",
  gulpsync.sync([
    ["check-release-tag"],
    ["build"],
    ["github:release"],
    ["github:assets"]
  ])
);

var releaseParams = {
  token: ghToken,
  owner: "nj-neer",
  repo: "Steam-Scanner",
  tag: "v" + pjson.version,
  name: "Steam Scanner v" + pjson.version,
  id: null
};

gulp.task("github:release", function(callback) {
  console.log("Creating the new release...");

  if (!releaseParams.token) {
    console.error(
      "ERROR, Please set GH_TOKEN env variable with the github release token !"
    );
    return false;
  }

  request(
    {
      url:
        "https://api.github.com/repos/nj-neer/Steam-Scanner/releases?access_token=" +
        releaseParams.token,
      method: "POST",
      body: JSON.stringify({
        tag_name: releaseParams.tag,
        name: releaseParams.name,
        draft: false,
        prerelease: false
      }),
      headers: {
        "User-Agent": "request"
      }
    },
    function(error, response, body) {
      if (error) {
        console.error(error);
      }

      if (response.statusCode !== 201) {
        console.error("ERR_STATUSCODE_" + response.statusCode + " => " + body);
      }

      body = JSON.parse(body);

      if (!body.id || !body.upload_url) {
        console.error("ERR_MISSING_RELEASE_ID");
      }
      // release doesn't exist (201) , can continue
      releaseParams.id = body.id;
      releaseParams.uploadUrl = body.upload_url;
      callback();
    }
  );
});

function deleteRelease(id, callback) {
  console.log("Removing old release...");
  request(
    {
      url:
        "https://api.github.com/repos/nj-neer/Steam-Scanner/releases/" +
        id +
        "?access_token=" +
        releaseParams.token,
      method: "DELETE",
      headers: {
        "User-Agent": "request"
      }
    },
    function(error, response) {
      // release doesn't exist , can continue
      if (error) {
        console.error(error);
      }

      if (response.statusCode !== 204) {
        console.error("ERR_STATUSCODE_" + response.statusCode);
      }

      callback();
    }
  );
}

gulp.task("github:assets", function(callback) {
  console.log("Uploading assets...");
  var parsedFiles = [];

  //list all files and their mime types
  fs.readdir("./build", function(err, files) {
    if (err) {
      console.error(err);
    }

    for (var i = 0; i < files.length; i++) {
      try {
        if (fs.statSync(path.join("./build/", files[i])).isDirectory()) {
          continue;
        }

        //exclude .yaml files
        if (path.extname(files[i]) === ".yaml") {
          continue;
        }

        var file = {
          name: files[i],
          contentType: mime.lookup(path.join("./build/", files[i]))
        };
        parsedFiles.push(file);
      } catch (err) {
        deleteRelease(releaseParams.id, function() {
          console.error(err);
        });
      }
    }

    async.each(
      parsedFiles,
      function(file, callback) {
        var fileBinary;
        fs.readFile("./build/" + file.name, function(err, data) {
          if (err) {
            deleteRelease(releaseParams.id, function() {
              console.error(err);
            });
          } else {
            if (!data) {
              console.error("ERR_FILE_NOT_FOUND");
            }

            fileBinary = new Buffer(data, "binary");

            //console.log(fileBinary);
            var targetUrl = releaseParams.uploadUrl.replace(
              "{?name,label}",
              "?access_token=" +
                releaseParams.token +
                "&name=" +
                file.name +
                "&label=" +
                file.name
            );
            request(
              {
                url: targetUrl,
                method: "POST",
                body: fileBinary,
                encoding: null,
                headers: {
                  "User-Agent": "request",
                  "Content-Type": file.contentType,
                  "Content-Length": fileBinary.length
                }
              },
              function(error, response, body) {
                // release doesn't exist , can continue
                if (error) {
                  deleteRelease(releaseParams.id, function() {
                    return callback(error);
                  });
                }

                if (response.statusCode !== 201) {
                  return callback(
                    "ERR_STATUSCODE_" +
                      response.statusCode +
                      " => " +
                      body +
                      " \n " +
                      targetUrl
                  );
                }

                callback();
              }
            );
          }
        });
      },
      function(err) {
        if (err) {
          deleteRelease(releaseParams.id, function() {
            console.error(err);
          });
        }

        callback();
      }
    );
  });
});

//check if the release already exist for this version
gulp.task("check-release-tag", function(callback) {
  console.log("Checking release tags...");
  request(
    {
      url:
        "https://api.github.com/repos/nj-neer/Steam-Scanner/releases/tags/v" +
        pjson.version,
      headers: {
        "User-Agent": "request"
      }
    },
    function(error, response, body) {
      // release doesn't exist , can continue
      if (response.statusCode == "404") {
        return callback();
      } else {
        body = JSON.parse(body);
        console.log(
          "A release for the version " +
            pjson.version +
            " already exist => removing ..."
        );
        //remove existing release if id given
        if (body.id) {
          releaseParams.id = body.id;
          deleteRelease(body.id, function() {
            return callback();
          });
        } else {
          console.error("Check release error");
        }
      }
    }
  );
});

gulp.task("default", ["prepare-dev-env"]);

gulp.task("package-app", function(callback) {
  builder
    .build()
    .then(function() {
      callback();
    })
    .catch(function(err) {
      console.error(err);
      callback(err);
    });
});
