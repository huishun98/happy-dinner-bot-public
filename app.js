const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const config = require('./config')
const botResponse = require("./telegram/bot")

var app = express();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("App is running.")
})
app.listen(port, () => {
    console.log(`Our app is running on port ${port}.`);
})


const options = {
    webHook: {
        // Port to which you should bind is assigned to $PORT variable
        // See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
        port: port
        // you do NOT need to set up certificates since Heroku provides
        // the SSL certs already (https://<app-name>.herokuapp.com)
        // Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
    }
    // { polling: true }
}
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.token, options);

bot.setWebHook(`${config.appUrl}/bot${config.token}`);
bot.on('message', (msg) => {
    botResponse(msg, bot)
});

//keep heroku awake
setInterval(function () {
    http.get(config.appUrl);
}, 300000); // every 5 minutes (300000)
