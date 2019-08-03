const { localMongo } = require('../config');
const mongoose = require('mongoose');

var connect = () => {
    mongoose.Promise = global.Promise;
    mongoose.connect(process.env.MONGODB_URI || localMongo, { useNewUrlParser: true });
}

module.exports = {connect}