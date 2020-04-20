const fs = require('fs-extra');
const dirs = ["./dist", "./build"];
clean().then(() => {
    console.log("... done ✓");
});
function clean() {

    return new Promise((resolve, reject) => {
        console.log("Cleaning directories...");
        dirs.forEach(dir => {
            try {
                fs.removeSync(dir);
                console.log(dir + " cleaned ✔️");
            } catch (error) {
                console.error(error.message);
                process.exit(1);
            }
        });

        return resolve();
    });
}