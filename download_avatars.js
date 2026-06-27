const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, 'assets', 'avatars');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

function download(url, filepath, callback) {
    const file = fs.createWriteStream(filepath);
    https.get(url, function(response) {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', function() {
                file.close(callback);
            });
        } else {
            file.close();
            fs.unlink(filepath, () => {});
            if (callback) callback(new Error(`Failed with status: ${response.statusCode}`));
        }
    }).on('error', function(err) {
        fs.unlink(filepath, () => {});
        if (callback) callback(err);
    });
}

console.log('Starting download of 100 real avatars...');

let completed = 0;
let errors = 0;

for (let i = 1; i <= 50; i++) {
    // 50 Male Portraits
    const menUrl = `https://randomuser.me/api/portraits/men/${i}.jpg`;
    const menPath = path.join(dir, `avatar_${i}.jpg`);
    download(menUrl, menPath, (err) => {
        if (err) {
            errors++;
            console.error(`Error downloading male ${i}:`, err.message);
        } else {
            completed++;
        }
        checkFinished();
    });

    // 50 Female Portraits
    const womenUrl = `https://randomuser.me/api/portraits/women/${i}.jpg`;
    const womenPath = path.join(dir, `avatar_${i + 50}.jpg`);
    download(womenUrl, womenPath, (err) => {
        if (err) {
            errors++;
            console.error(`Error downloading female ${i}:`, err.message);
        } else {
            completed++;
        }
        checkFinished();
    });
}

function checkFinished() {
    if (completed + errors === 100) {
        console.log(`Finished! Successfully downloaded: ${completed}/100 profiles. Errors: ${errors}`);
        process.exit(0);
    }
}
