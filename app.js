const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
var path = require('path');

const config = require('./config')
const runBot = require("./telegram/bot")

var app = express();
const router = express.Router();

router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/client/index.html'));
    //__dirname : It will resolve to your project folder.
});

//add the router
app.use('/', router);

app.get("/", (req, res) => {
    res.sendFile('index.html');
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Our app is running on port ${port}.`);
})

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.token, { polling: true });
runBot.startCronJob(bot)
bot.on('message', (msg) => {
    runBot.botResponse(msg, bot)
});


//keep heroku awake
setInterval(function () {
    http.get(config.appUrl);
}, 300000); // every 5 minutes (300000)
