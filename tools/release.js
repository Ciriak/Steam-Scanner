const pjson = require('../package.json');
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const mime = require("mime");
const repoUrl = "https://api.github.com/repos/Ciriak/Steam-Scanner";
/**
 * Release script
 */
var releaseParams = {
    token: "",
    owner: "Ciriak",
    repo: "Steam-Scanner",
    releaseDir: "release",
    tag: "v" + pjson.version,
    name: "Steam-Scanner v" + pjson.version,
    id: null
};

releaseParams.token = getToken();

checkReleaseTags().then(() => {
    githubRelease().then(() => {
        copyBuilds();
        uploadAssets().then(() => {
            console.log("== RELEASE OF VERSION " + pjson.version + " DONE ✓ ==");
        });
    }).catch((err) => {
        console.error(err.message);
    })
});

async function githubRelease() {
    return new Promise(async (resolve, reject) => {

        console.log("Creating a new release...");

        console.log("Retrieving the changelog file...");
        const changelog = fs.readFileSync("./changelog.txt", { encoding: "utf-8" });
        console.log("Changelog retrieved ✓");
        console.log("Sending POST query to " + repoUrl + "/releases?access_token=[HIDDEN] ...");
        axios({
            url: repoUrl + "/releases?access_token=" + releaseParams.token,
            method: "POST",
            data: {
                tag_name: releaseParams.tag,
                name: releaseParams.name,
                draft: false,
                body: changelog,
                prerelease: false
            }
        }).then((response) => {

            if (response.status !== 201) {
                throw ("ERR_STATUSCODE_" + response.status + " => " + data);
            }

            if (!response || !response.data || !response.data.id || !response.data.upload_url) {
                throw ("ERR_MISSING_RELEASE_DATA");
            }

            releaseParams.id = response.data.id;
            releaseParams.uploadUrl = response.data.upload_url;
            console.log("...done ✓");
            return resolve();

        }).catch((err) => {
            console.error(err.message || err);
        })
    });
}

async function deleteRelease(id) {
    return new Promise(async (resolve, reject) => {
        const queries = [];
        // delete the release
        queries.push(new Promise(async (resolve, reject) => {
            console.log("Deleting release " + pjson.version + " (" + id + ") ...");
            axios({
                method: "DELETE",
                url: repoUrl + "/releases/" + id + "?access_token=" + releaseParams.token,
            }).then(() => {
                console.log("...done ✓");
                return resolve();
            }).catch(err => {
                console.error(err.message);
                process.exit(1);
            });
        }));

        //delete the tag
        queries.push(new Promise(async (resolve, reject) => {
            console.log("Deleting tag (v" + pjson.version + ")...");
            axios({
                method: "DELETE",
                url: repoUrl + "/git/refs/tags/v" + pjson.version + "?access_token=" + releaseParams.token,
            }).then(() => {
                console.log("...done ✓");
                return resolve();
            }).catch(err => {
                console.error(err.message);
                process.exit(1);
            });
        }));

        Promise.all(queries).then(() => {
            return resolve();
        });
    });

}

function getToken() {
    console.log("Retrieving Github Token...");
    try {
        return fs.readFileSync(path.resolve(".gh-token"), { encoding: "utf-8" });
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }

}

function copyBuilds() {
    try {
        console.log("Preparing release directory...");

        fs.removeSync(releaseParams.releaseDir);
        fs.ensureDirSync(releaseParams.releaseDir);

        const files = [
            "latest.yml",
            `${pjson.build.productName}-setup-${pjson.version}.exe`,
            `${pjson.build.productName}-setup-${pjson.version}.exe`
        ];

        files.forEach(file => {
            console.log(`Copying ${file}...`);

            fs.copyFileSync(path.join("./build", file), path.join(releaseParams.releaseDir, file));

            console.log("✓");

        });

        console.log(files.length + " copied sucessfully to the release folder");

    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }



}

async function uploadAssets() {
    return new Promise(async (resolve, reject) => {

        const parsedFiles = [];
        const uploadPromises = [];
        let files;

        try {
            files = fs.readdirSync("./release");
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }

        console.log(`Uploading ${files.length} files...`);

        for (var i = 0; i < files.length; i++) {
            var file = {
                name: files[i],
                contentType: mime.getType(path.join("./release/", files[i]))
            };
            parsedFiles.push(file);
        }



        parsedFiles.forEach(async file => {
            uploadPromises.push(new Promise(async (resolve, reject) => {


                try {
                    const fileData = fs.readFileSync("./release/" + file.name);
                    fileBinary = Buffer.from(fileData);
                    var targetUrl = releaseParams.uploadUrl.replace("{?name,label}", "?access_token=" + releaseParams.token + "&name=" + file.name + "&label=" + file.name);
                } catch (error) {
                    console.error("Error while reading a file, deleting the release...");
                    await deleteRelease(releaseParams.id);
                    console.error(error.message);
                    process.exit(1);
                }

                console.log(`Uploading ${file.name} ...`);

                axios({
                    method: "POST",
                    data: fileBinary,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    url: targetUrl,
                    encoding: null,
                    headers: {
                        "Content-Type": file.contentType,
                        "Content-Length": fileBinary.length
                    }
                }).then(() => {
                    console.log(`${file.name} uploaded ✓`);
                    return resolve();
                }).catch(async (err) => {
                    console.error(err.message);
                    await deleteRelease(releaseParams.id);
                    process.exit(1);
                });

            }));

        });

        Promise.all(uploadPromises).then(() => {
            return resolve();
        });
    });
}

async function checkReleaseTags() {
    return new Promise(async (resolve, reject) => {

        console.log("Checking release tags...");

        axios({
            method: "GET",
            url: repoUrl + "/releases/tags/v" + pjson.version,
        }).then(async (response) => {
            data = response.data;
            //remove existing release if id given
            if (response.data.id) {
                console.log("Existing release detected for version " + pjson.version + ", it will be deleted...")
                releaseParams.id = data.id;
                await deleteRelease(data.id);
                return resolve();
            }
            else {
                console.error("Missing data");
                process.exit(1);
            }

        }).catch(err => {
            // no existing release for current version, we can continue
            if (err.response && err.response.status === 404) {
                console.log("No existing release for version " + pjson.version);
                return resolve();
            }
            else {
                console.error(err.message);
                process.exit(1);
            }

        })
    });
}