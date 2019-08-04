const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const config = require('./config')
const runBot = require("./telegram/bot")

var app = express();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("App is running.")
})

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
