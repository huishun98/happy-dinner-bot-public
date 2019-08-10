const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const hbs = require('express-handlebars')
const path = require('path')

const config = require('./common/config')
const runBot = require("./telegram/bot")
const options = require("./common/options")
const info = require("./common/info")

var app = express();
const router = express.Router();

app.engine('hbs', hbs({ extname: '.hbs', layoutsDir: path.join(__dirname + '/views') }))
app.set('view engine', 'hbs')
app.use(express.static(path.join(__dirname, '/public')))


router.get('/', function (req, res) {
    res.render('homepage', {
        title: info.title,
        description: info.description,
        options: options
    })
});
app.use('/', router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Our app is running on port ${port}.`);
})

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.token, { polling: true });
runBot.startDefaultCron(bot)
runBot.startReminderCron(bot)
bot.on('message', (msg) => {
    runBot.botResponse(msg, bot)
});
bot.on('callback_query', (callbackQuery) => {
    console.log(callbackQuery, callbackQuery.data, callbackQuery.message)
    runBot.replyReceived(
        callbackQuery.data,
        callbackQuery.message.chat.id,
        callbackQuery.from.first_name,
        bot)
})


//keep heroku awake
setInterval(function () {
    http.get(config.appUrl);
}, 300000); // every 5 minutes (300000)
