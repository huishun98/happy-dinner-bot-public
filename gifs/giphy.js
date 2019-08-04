const config = require("../common/config")
const options = require("../common/options")
const getRandomInt = require('../database/random-int')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const api_key = config.giphyApiKey
const limit = options.limit
const array_queries = options.query

var getGif = () => {
    return new Promise((resolve, reject) => {
        const len_queries = array_queries.length
        const query = array_queries[getRandomInt(0, len_queries - 1)]

        const url = `http://api.giphy.com/v1/gifs/search?q=${query}&api_key=${api_key}&limit=${limit}`
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                // console.log(xmlHttp.responseText)
                resolve([xmlHttp.responseText, limit]);
        }
        xmlHttp.open("GET", url, true); // true for asynchronous 
        xmlHttp.send(null);
    })
}

module.exports = getGif