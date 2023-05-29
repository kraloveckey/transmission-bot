'use strict'
const DateTime = require('date-and-time');
const Handlebars = require('handlebars');
const pretty = require('prettysize');

const torrentStatus = [
    'Stopped',
    'Check wait',
    'Check',
    'Download wait',
    'Download',
    'Seed wait',
    'Seed',
    'Isolated'
];

var exports = module.exports = {};

// Handlebars helper
Handlebars.registerHelper('getStatusType', (type) => {
    return torrentStatus[type] || 'Unknown';
});
Handlebars.registerHelper('torrentPercentage', (percent) => {
    return (percent * 100).toFixed(2) + '%';
})
Handlebars.registerHelper('getRemainingTime', (seconds) => {
    if (seconds < 0 || seconds >= (999 * 60 * 60))
        return 'remaining time unknown';

    var days = Math.floor(seconds / 86400),
        hours = Math.floor((seconds % 86400) / 3600),
        minutes = Math.floor((seconds % 3600) / 60),
        seconds = Math.floor(seconds % 60),
        d = days + ' ' + (days > 1 ? 'days' : 'day'),
        h = hours + ' ' + (hours > 1 ? 'hours' : 'hour'),
        m = minutes + ' ' + (minutes > 1 ? 'minutes' : 'minute'),
        s = seconds + ' ' + (seconds > 1 ? 'seconds' : 'second');

    if (days) {
        if (days >= 4 || !hours)
            return d + ' remaining';
        return d + ', ' + h + ' remaining';
    }
    if (hours) {
        if (hours >= 4 || !minutes)
            return h + ' remaining';
        return h + ', ' + m + ' remaining';
    }
    if (minutes) {
        if (minutes >= 4 || !seconds)
            return m + ' remaining';
        return m + ', ' + s + ' remaining';
    }

    return s + ' remaining';
})
Handlebars.registerHelper('speed', (value) => {
    return pretty(value);
})
Handlebars.registerHelper('parseDate', (date) => {
    // See #10
    if(date == 0) return new Date();
    
    var mEpoch = parseInt(date);
    mEpoch *= 1000;
    return new Date(mEpoch);
})
Handlebars.registerHelper('formatDate', (date, format) => {
    return DateTime.format(date, format);
})
Handlebars.registerHelper('differenceBeetwenDates', (firstDate, secondDate) => {
    let seconds = DateTime.subtract(secondDate, firstDate).toSeconds();
    let string = '';
    let sec_num = parseInt(seconds, 10);
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours > 0)
        string += hours + ' hours, ';
    if (minutes > 0)
        string += minutes + ' minutes, ';
    if (seconds > 0)
        string += seconds + ' seconds';
    if (string.length == 0)
        string = 'Time not available';
    return string;
})
Handlebars.registerHelper('enableOrNot', (enable) => {return enable ? 'enabled' : 'not enabled'})
/* Torrents list template */
let torrentsListTemplate = `<strong>List of current torrents and their status:</strong>
{{#each this}}
{{id}}) {{name}} (<strong>{{getStatusType status}}</strong>)
➗ {{torrentPercentage percentDone}}
⌛️ {{getRemainingTime eta}}
⬇️ {{speed rateDownload}}/s - ⬆️ {{speed rateUpload}}/s


{{/each}}`;

exports.torrentsList = Handlebars.compile(torrentsListTemplate, {noEscape: true});

/* Torrent details template */
let torrentDetailsTemplate = `{{name}}

Status = <strong>{{getStatusType status}}</strong>
⌛️ {{getRemainingTime eta}}
➗ <strong>{{torrentPercentage percentDone}}</strong>
⬇️ {{speed rateDownload}}/s - ⬆️ {{speed rateUpload}}/s

Size: {{speed sizeWhenDone}}
📅 Added: {{formatDate (parseDate addedDate) 'dddd, DD MMMM HH:mm'}}
📂 {{downloadDir}}
👥 Peers connected: {{peersConnected}}
`;

exports.torrentDetails = Handlebars.compile(torrentDetailsTemplate, {noEscape: true});

/* New torrent added template */
let newTorrentTemplate = `The torrent was added succesfully 👌, here are some information about it:
• <strong>ID torrent:</strong> {{id}};
• <strong>Name:</strong> {{name}}
`;
exports.newTorrent = Handlebars.compile(newTorrentTemplate, {noEscape: true});

exports.errorMessage = (err) => {
    return 'Ops there was an error 😰, here are some details:\n' + err;
}

/* Complete torrent template */
let completeTorrentTemplate = `Oh, a torrent has been downloaded completely 🙌\nHere are some details 👇:
<strong>{{name}}</strong>

📅 {{formatDate (parseDate addedDate) 'DD/MM HH:mm'}} - {{formatDate (parseDate doneDate) 'DD/MM HH:mm'}}
🕔 {{differenceBeetwenDates (parseDate addedDate) (parseDate doneDate)}}
Size: {{speed sizeWhenDone}}

📂 {{downloadDir}}
`;
exports.formatComplete = Handlebars.compile(completeTorrentTemplate, {noEscape: true});

/* Session details */
let sessionDetailsTemplate = `<strong>Transmission version: {{version}}</strong>
Config dir: <pre>{{config-dir}}</pre>

<strong>Free space: {{speed download-dir-free-space}}</strong>
Download directory: <pre>{{download-dir}}</pre>
Incomplete directory{{#if incomplete-dir-enabled}}: <pre>{{incomplete-dir}}</pre>{{else}} <strong>not enabled</strong>{{/if}}

⬇️ Speed limit{{#if speed-limit-down-enabled}}: {{speed-limit-down}}kB/s{{else}} not enabled{{/if}}
⬆️ Speed limit{{#if speed-limit-up-enabled}}: {{speed-limit-up}}kB/s{{else}} not enabled{{/if}}

👥 Peers limit:
• Global = {{peer-limit-global}}
• Per torrent = {{peer-limit-per-torrent}}

Download queue {{enableOrNot download-queue-enabled}}
`;
exports.sessionDetails = Handlebars.compile(sessionDetailsTemplate, {noEscape: true});
