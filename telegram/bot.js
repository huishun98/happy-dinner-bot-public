const { ObjectID } = require('mongodb');
const controller = require('../database/controller');
const options = require("../common/options")
const getGif = require("../gifs/giphy")
const getRandomInt = require('../database/random-int')
const CronJob = require('cron').CronJob;
const date = require('../database/date')

const replyPrompt = {
    parse_mode: "HTML",
    reply_markup: {
        inline_keyboard: [[
            {
                text: 'Yes',
                callback_data: 'yes'
            }, {
                text: 'No',
                callback_data: 'no'
            }
        ]]
    }
}

// everyday at 9am, question will be asked
// var startDefaultCron = (bot) => {
//     new CronJob('0 0 9 * * *', function () {
//         controller.fetchChatIdsOfThoseInGroups().then((arrayOfChatIds) => {
//             for (i = 0; i < arrayOfChatIds.length; i++) {
//                 bot.sendMessage(arrayOfChatIds[i], options.question, replyPrompt)
//             }
//         }).catch(err => {
//             console.log(err)
//         });
//     }, null, true, 'Asia/Singapore');
// }

var startReminderCron = (bot) => {
    new CronJob('0 0 9,12-16 * * *', function () {
        controller.retrieveAllGroups().then((groups) => {
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i]
                var groupMembers = group.members
                if (groupMembers.length == 0) {
                    continue
                }
                var todaysReplies = group.data.filter((data) => data.date == date.date())
                if (todaysReplies.length !== 0) {
                    todaysReplies = todaysReplies[0].replies
                }

                for (var j = 0; j < groupMembers.length; j++) {
                    var memberChatId = groupMembers[j].chatId
                    var findChatId = todaysReplies.filter(reply => reply.chatId == memberChatId)
                    if (findChatId.length == 0) {
                        bot.sendMessage(memberChatId, options.question, replyPrompt)
                    }
                }
            }
        }).catch(err => {
            console.log(err)
        });
    }, null, true, 'Asia/Singapore');
}

var botResponse = (msg, bot) => {
    //variables
    var user = msg.from.first_name;
    var message = msg.text.toLowerCase();
    var chatId = msg.chat.id;

    console.log(`message received from ${user}, message is '${message}'.`);

    controller.getUserData(chatId)
        .then((userDetails) => {
            if (userDetails !== null) {
                return [controller, user, message, chatId]
            } else {
                controller.addUser(user, chatId).then((res) => {
                    bot.sendMessage(chatId, options.startMessage, { parse_mode: "HTML" });
                })
                throw new Error("New user")
            }
        })
        .then(([controller, user, message, chatId]) => {
            controller.inGroup(chatId)
                .then((inGroup) => {
                    if (inGroup && message.substring(0, 1) == '/') {
                        // in group and a command
                        var command = getCommand(message)

                        switch (command) {
                            case '/start':
                                bot.sendMessage(chatId, options.success + options.question, replyPrompt);
                                break;
                            case '/help':
                                bot.sendMessage(chatId, options.help, { parse_mode: "HTML" });
                                break;
                            case '/create':
                                bot.sendMessage(chatId, options.errMultipleGrps, { parse_mode: "HTML" });
                                break;
                            case '/join':
                                bot.sendMessage(chatId, options.errMultipleGrps, { parse_mode: "HTML" });
                                break;
                            case '/group':
                                controller.findGroup(chatId).then((groupId) => {
                                    controller.retrieveGroupData(groupId).then((groupData) => {
                                        bot.sendMessage(chatId, options.checkGrpId, { parse_mode: "HTML" });
                                        bot.sendMessage(chatId, `${groupData._id}`);
                                    }).catch(err => {
                                        console.log(err)
                                    })
                                }).catch(err => {
                                    console.log(err)
                                })
                                break;
                            case '/members':
                                controller.findGroup(chatId).then((groupId) => {
                                    controller.retrieveGroupData(groupId).then((groupData) => {
                                        var arrayOfMemberObjects = groupData.members;
                                        var arrayOfMembers = [];
                                        for (i = 0; i < arrayOfMemberObjects.length; i++) {
                                            arrayOfMembers.push(arrayOfMemberObjects[i].username);
                                        }
                                        arrayOfMembers = arrayOfMembers.join('\n')
                                        bot.sendMessage(chatId, `Group members:\n${arrayOfMembers}`, { parse_mode: "HTML" });
                                    }).catch(err => { console.log(err) })
                                }).catch(err => { console.log(err) })
                                break;
                            case '/responses':
                                sendResponses(bot, chatId, { parse_mode: "HTML" });
                                break;
                            case '/quit':
                                controller.quitGroup(chatId);
                                bot.sendMessage(chatId, options.quit);
                                break;
                            default:
                                bot.sendMessage(chatId, options.promptCmd, { parse_mode: "HTML" });
                        }
                    }
                    else if (inGroup && !(message.substring(0, 1) == '/')) {
                        //in group and a message
                        replyReceived(message, chatId, user, bot)
                    } else if (!(inGroup) && message.substring(0, 1) == '/') {
                        // not in group and a command
                        var command = getCommand(message)
                        switch (command) {
                            case '/help':
                                bot.sendMessage(chatId, options.help, { parse_mode: "HTML" });
                                break;
                            case '/create':
                                var groupId = new ObjectID();
                                controller.addUserGroup(user, chatId, groupId)
                                    .then((groupId) => {
                                        bot.sendMessage(chatId, options.success + options.createdGrp, { parse_mode: "HTML" });
                                        bot.sendMessage(chatId, `${groupId}`);
                                        bot.sendMessage(chatId, options.question, { parse_mode: "HTML" });
                                    }
                                    ).catch(err => {
                                        if (err == 'has a group') {
                                            bot.sendMessage(chatId, options.errMultipleGrps, { parse_mode: "HTML" });
                                        } else {
                                            console.log(err)
                                        }
                                    })
                                break;
                            case '/join':
                                bot.sendMessage(chatId, options.join).then((sended) => {
                                    bot.onReplyToMessage(sended.chat.id, sended.message_id, (message) => {
                                        var groupId = message.text
                                        controller.groupExists(groupId)
                                            .then(() => {
                                                sendResponses(bot, chatId, { parse_mode: "HTML" });
                                                controller.addUserGroup(user, chatId, groupId);
                                                controller.addGroupMember(user, chatId, groupId);
                                            }).catch(err => {
                                                bot.sendMessage(chatId, options.invalidGrpId, { parse_mode: "HTML" });
                                                if (err !== "Invalid Group Id") {
                                                    console.log(err)
                                                }
                                            })
                                    });
                                })
                                break;
                            case '/responses':
                            case '/group':
                            case '/members':
                            case '/quit':
                                bot.sendMessage(chatId, options.promptGrp, { parse_mode: "HTML" });
                                break;
                            default:
                                bot.sendMessage(chatId, options.promptCmd, { parse_mode: "HTML" });
                        }
                    } else if (!(inGroup) && !(message.substring(0, 1) == '/')) {
                        // not in group and a message
                        bot.sendMessage(chatId, options.startMessage, { parse_mode: "HTML" });
                    }
                })
        }).catch(err => {
            console.log(err)
        })
}

var replyReceived = (message, chatId, user, bot) => {
    switch (message) {
        case 'yes':
        case 'no':
            getGif().then(([res, limit]) => {
                var obj = JSON.parse(res)
                if (obj.data.length !== 0) {
                    var index = getRandomInt(0, limit - 1)
                    var link = obj.data[index].images.original.url
                    bot.sendDocument(chatId, link);
                }
                controller.saveReply(message, chatId, user).then((res) => {
                    bot.sendMessage(chatId, options.question + '\n' + res, { parse_mode: "HTML" })
                }).catch(err => {
                    console.log(err)
                });
            }).catch(err => {
                console.log(err)
            })
            break;
        default:
            bot.sendMessage(chatId, options.standardReply, replyPrompt);
    }
}

var getCommand = (message) => {
    if (message.indexOf(' ') !== -1) {
        return message.substr(0, message.indexOf(' '));
    } else {
        return message;
    }
}

var sendResponses = (bot, chatId, sendOptions) => {
    controller.findGroup(chatId).then((groupId) => {
        controller.todaysReplies(groupId).then((repliesArray) => {
            var botResponse = [];
            for (i = 0; i < repliesArray.length; i++) {
                botResponse.push(`${repliesArray[i].user}: ${repliesArray[i].reply}`);
            }
            if (botResponse.length !== 0) {
                botResponse = botResponse.join('\n');
                bot.sendMessage(chatId, options.question + `\n${botResponse}`, sendOptions);
            } else {
                bot.sendMessage(chatId, options.noReplies, sendOptions);
            }
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
}

module.exports = { botResponse, startReminderCron, replyReceived }