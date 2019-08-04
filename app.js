const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const hbs = require('express-handlebars')

const config = require('./config')
const runBot = require("./telegram/bot")

var app = express();
const router = express.Router();

app.engine('handlebars', hbs({extname: 'hbs', layoutsDir:__dirname + '/views'}))
app.set('view engine', 'hbs')

router.get('/',function(req,res){
    res.render('index', {
        title: "Happy Dinner Bot"
    })
});
app.use('/', router);

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
