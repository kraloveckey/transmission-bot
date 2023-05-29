'use strict'
const fs = require('fs');

var exports = module.exports = {};

exports.fileExists = () => {
    return fs.existsSync(__dirname + '/user-notification.json');
}

exports.loadFile = () => {
    return JSON.parse(fs.readFileSync(__dirname + '/user-notification.json', 'utf8'));
}

exports.saveFile = (obj) => {
    fs.writeFile(__dirname + '/user-notification.json', JSON.stringify(obj), (err) => {
        if(err) throw err;
    });
}
