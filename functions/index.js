const functions = require("firebase-functions");
const gcs = require('@google-cloud/storage')();
const os = require('os');
const path = require('path');
const spawn = require('child-process-promise').spawn;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

// PROBLEMS:
// 1. Load thumbnail to root directory of firestorage!
// 2. Create function which remove thumbnail on remove main image
exports.createImageThumbnail = functions.storage.object().onChange(event => {
    const THUMBNAIL_SIZE = '300x300';
    const IMAGE_PREFIX = 'thumbnail_' + THUMBNAIL_SIZE + '_';

    const object = event.data;
    const bucket = object.bucket;
    const contentType = object.contentType;
    const filePath = object.name;
    console.log('File change detected, function execution started');

    // STOP infinitive loop
    if (object.resourceState === 'not_exists') {
        console.log('We deleted a file, exit...');
        return;
    }
    // STOP infinitive loop
    if (path.basename(filePath).startsWith(IMAGE_PREFIX)) {
        console.log('We already renamed that file!');
        return;
    }

    const destBucket = gcs.bucket(bucket);
    const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const metadata = {contentType: contentType};
    return destBucket.file(filePath).download({
        destination: tmpFilePath
    }).then(() => {
        return spawn('convert', [tmpFilePath, '-resize', THUMBNAIL_SIZE, tmpFilePath]);
    }).then(() => {
        return destBucket.upload(tmpFilePath, {
            destination: IMAGE_PREFIX + path.basename(filePath),
            metadata: metadata
        })
    });
});