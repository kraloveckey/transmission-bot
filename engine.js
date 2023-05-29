'use strict'
const Transmission = require('transmission');
const formatter = require('./formatter.js');
const config = require('./config.json');

console.log('Configuring transmission session');
const transmission = new Transmission({
    port: config.transmission.port,
    host: config.transmission.address,
    username: config.transmission.credentials.username,
    password: config.transmission.credentials.password
});
console.log(`-------- Session configured --------
IP address and port --> ${config.transmission.address}:${config.transmission.port}
Username: ${config.transmission.credentials.username|| 'none'}
Password: ${config.transmission.credentials.password || 'none'}
`);

var exports = module.exports = {};
var oldList = exports.torrents = [];

exports.updateTorrentList = () => {
    transmission.get(function (err, arg) {
        if (err)
            console.error(err);
        else {
            oldList = exports.torrents;
            exports.torrents = arg.torrents;
            console.log('Downloaded the new list of torrents');

            exports.checkCompletedTorrents();
        }
    });
}

exports.checkCompletedTorrents = () => {
    oldList.forEach(torrent => {
        // Search the torrent in the new list
        for (var i = 0; i < exports.torrents.length; i++) {
            if (torrent.name === exports.torrents[i].name && torrent.status != exports.torrents[i].status && exports.torrents[i].status === 6)
                exports.torrentCompleted(formatter.formatComplete(torrent));
        }
    });
}

// Create a keyboard with all torrent
exports.getKeyboard = () => {
    var keyboard = [['Cancel']];
    exports.torrents.forEach(torrent => {
        keyboard.push([`${torrent.id}) ${torrent.name}`]);
    });
    return keyboard;
}

exports.getKeyboardActive = () => {
    var keyboard = [['Cancel']];
    exports.torrents.forEach(torrent => {
        if (torrent.status > 3)
            keyboard.push([`${torrent.id}) ${torrent.name}`]);
    });
    return keyboard;
}

exports.getKeyboardPaused = () => {
    var keyboard = [['Cancel']];
    exports.torrents.forEach(torrent => {
        if (torrent.status == 0)
            keyboard.push([`${torrent.id}) ${torrent.name}`]);
    });
    return keyboard;
}

exports.getTorrentsList = (success, error) => {
    transmission.get(function (err, arg) {
        if (err)
            error(formatter.errorMessage(err));
        else {
            exports.torrents = arg.torrents;
            success(formatter.torrentsList(arg.torrents));
        }
    });
}

exports.getTorrentDetails = (id, success, error) => {
    transmission.get(parseInt(id), function (err, result) {
        if (err) {
            error(formatter.errorMessage(err));
            return;
        }
        if (result.torrents.length > 0)
            success(formatter.torrentDetails(result.torrents[0]));
    });
}

// Add a torrent from url
exports.addTorrent = (url, success, error) => {
    transmission.addUrl(url, function (err, result) {
        if (err) {
            error(formatter.errorMessage(err));
            return;
        }

        // Update torrent list
        exports.updateTorrentList();
        success(formatter.newTorrent(result));
    });
}

exports.pauseTorrent = (id, success, error) => {
    transmission.stop(parseInt(id), function (err, result) {
        if (err)
            error(formatter.errorMessage(err));
        else {
            // Update torrent list
            exports.updateTorrentList();
            success(result);
        }
    });
}

exports.startTorrent = (id, success, error) => {
    transmission.start(parseInt(id), function (err, result) {
        if (err)
            error(formatter.errorMessage(err));
        else {
            // Update torrent list
            exports.updateTorrentList();
            success(result);
        }
    });
}

exports.removeTorrent = (id, success, error) => {
    transmission.remove(parseInt(id), function (err, result) {
        if (err)
            error(formatter.errorMessage(err));
        else {
            // Update torrent list
            exports.updateTorrentList();
            success(result);
        }
    });
}

// Hide keyboard for bot
exports.listOfCommandsKeyboard = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['📋 List of all torrents'],
            ['📈 Status', '➕ Add torrent'],
            ['▶️ Start', '⏸ Pause', '❌ Remove'],
            ['⚙ Settings', '❔ Help']
        ]
    }),
    parse_mode: 'html',
    disable_web_page_preview: true
}

exports.hideKeyboard = {
    reply_markup: JSON.stringify({
        keyboard: [['Cancel']]
    })
}

// Settings
exports.settingsKeyboard = {
    reply_markup: JSON.stringify({
        keyboard: [['🔙 menu'], ['🖥 Transmission info'], ['🔔 User notification'], ['📂 Set download folder']]
    }),
    parse_mode: 'html'
}

exports.getSessionDetails = (callback) => {
    transmission.session(function(err, arg) {
        if(err)
            callback(formatter.errorMessage(err));
        else
            callback(formatter.sessionDetails(arg));
    });
}
exports.setSettings = (command, success, error) => {
    transmission.session(command, function(err, arg) {
        if(err)
            error(formatter.errorMessage(err));
        else
            success(); 
    });
}
// End of settings

// String to send when the list of torrents is empty
exports.noTorrentsText = 'Mmh 😕 it seems that there isn\'t any torrent in the list...\nAdd one by using the /addtorrent command 😉';

/*
 *  Help message
 */
exports.helpMsg = `<b>Transmission Telegram Bot</b>
Available commands:
• List of torrents
• Torrent status
• Add torrent
• Start, Pause, Remove torrent
• Settings

If you have a suggestion or discovered a bug please report me 👉 <a href="kraloveckey@gmail.com">here</a>
<b>🤖 Bot version: ${config.bot.version}</b>

Creator: <a href="kraloveckey@gmail.com">kraloveckey</a>`;

// Download the torrent list every minute
exports.updateTorrentList();

setInterval(exports.updateTorrentList, 60000);
