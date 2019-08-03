const mongoose = require('mongoose');

var groups = mongoose.model('groups', {
    password: {
        type: String,
        trim: true
    },
    members: {
        type: Array
    },
    data: {
        type: Array,
        default: []
    }
});

var users = mongoose.model('users', {
    username: {
        type: String,
    },
    chatId: {
        type: String
    },
    group: {
        type: String,
        default: null,
    }
})

module.exports = {groups, users}