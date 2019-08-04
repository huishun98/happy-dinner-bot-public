const { ObjectID } = require('mongodb');
const controller = require('../database/controller');
const customReplies = require("../messages")
const getGif = require("../gifs/giphy")
const getRandomInt = require('../common/random-int')
const CronJob = require('cron').CronJob;

// everyday at 9am, question will be asked
var startCronJob = (bot) => {
    new CronJob('0 0 9 * * *', function () {
        console.log('You will see this message every second');
        controller.fetchChatIdsOfThoseInGroups().then((arrayOfChatIds) => {
            for (i = 0; i < arrayOfChatIds.length; i++) {
                bot.sendMessage(arrayOfChatIds[i], customReplies.question, { parse_mode: "HTML" })
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
                    bot.sendMessage(chatId, customReplies.startMessage, { parse_mode: "HTML" });
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
                                bot.sendMessage(chatId, customReplies.success + customReplies.question, { parse_mode: "HTML" });
                                break;
                            case '/help':
                                bot.sendMessage(chatId, customReplies.help, { parse_mode: "HTML" });
                                break;
                            case '/create':
                                bot.sendMessage(chatId, customReplies.errMultipleGrps, { parse_mode: "HTML" });
                                break;
                            case '/join':
                                bot.sendMessage(chatId, customReplies.errMultipleGrps, { parse_mode: "HTML" });
                                break;
                            case '/group':
                                controller.findGroup(chatId).then((groupId) => {
                                    controller.retrieveGroupData(groupId).then((groupData) => {
                                        bot.sendMessage(chatId, customReplies.checkGrpId, { parse_mode: "HTML" });
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
                                    controller.retrieveGroupData(groupId, (groupData) => {
                                        var arrayOfMemberObjects = groupData.members;
                                        var arrayOfMembers = [];
                                        for (i = 0; i < arrayOfMemberObjects.length; i++) {
                                            arrayOfMembers.push(arrayOfMemberObjects[i].username);
                                        }
                                        arrayOfMembers = arrayOfMembers.join('\n')
                                        bot.sendMessage(chatId, `Group members:\n${arrayOfMembers}`, { parse_mode: "HTML" });
                                    })
                                }).catch(err => {
                                    console.log(err)
                                })
                                break;
                            case '/responses':
                                controller.findGroup(chatId).then((groupId) => {
                                    //find the one that has todays data
                                    controller.todaysReplies(groupId).then((repliesArray) => {
                                        var botResponse = [];
                                        for (i = 0; i < repliesArray.length; i++) {
                                            botResponse.push(`${repliesArray[i].user}: ${repliesArray[i].reply}`);
                                        }
                                        botResponse = botResponse.join('\n');
                                        bot.sendMessage(chatId, customReplies.question + `\n${botResponse}`, { parse_mode: "HTML" });
                                    }).catch(err => {
                                        console.log(err)
                                    })
                                }).catch(err => {
                                    console.log(err)
                                })
                                break;
                            case '/quit':
                                controller.quitGroup(chatId);
                                bot.sendMessage(chatId, customReplies.quit);
                                break;
                            default:
                                bot.sendMessage(chatId, customReplies.promptCmd, { parse_mode: "HTML" });
                        }
                    }
                    else if (inGroup && !(message.substring(0, 1) == '/')) {
                        //in group and a message
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
                                        bot.sendMessage(chatId, customReplies.question + '\n' + res, { parse_mode: "HTML" })
                                    }).catch(err => {
                                        console.log(err)
                                    });
                                }).catch(err => {
                                    console.log(err)
                                })
                                break;
                            default:
                                bot.sendMessage(chatId, customReplies.standardReply, { parse_mode: "HTML" });
                        }
                    } else if (!(inGroup) && message.substring(0, 1) == '/') {
                        // not in group and a command

                        var command = getCommand(message)
                        switch (command) {
                            case '/help':
                                bot.sendMessage(chatId, customReplies.help, { parse_mode: "HTML" });
                                break;
                            case '/create':
                                var groupId = new ObjectID();
                                controller.addUserGroup(user, chatId, groupId)
                                    .then((groupId) => {
                                        bot.sendMessage(chatId, customReplies.success + customReplies.createdGrp, { parse_mode: "HTML" });
                                        bot.sendMessage(chatId, `${groupId}`);
                                        bot.sendMessage(chatId, customReplies.question, { parse_mode: "HTML" });
                                    }
                                    ).catch(err => {
                                        if (err == 'has a group') {
                                            bot.sendMessage(chatId, customReplies.errMultipleGrps, { parse_mode: "HTML" });
                                        } else {
                                            console.log(err)
                                        }
                                    })
                                break;
                            case '/join':
                                bot.sendMessage(chatId, customReplies.join).then((sended) => {
                                    bot.onReplyToMessage(sended.chat.id, sended.message_id, (message) => {
                                        var groupId = message.text
                                        controller.groupExists(groupId)
                                            .then(() => {
                                                bot.sendMessage(chatId, customReplies.success + customReplies.question, { parse_mode: "HTML" });
                                                controller.addUserGroup(user, chatId, groupId);
                                                controller.addGroupMember(user, chatId, groupId);
                                            }).catch(err => {
                                                bot.sendMessage(chatId, customReplies.invalidGrpId, { parse_mode: "HTML" });
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
                                bot.sendMessage(chatId, customReplies.promptGrp, { parse_mode: "HTML" });
                                break;
                            default:
                                bot.sendMessage(chatId, customReplies.promptCmd, { parse_mode: "HTML" });
                        }
                    } else if (!(inGroup) && !(message.substring(0, 1) == '/')) {
                        // not in group and a message
                        bot.sendMessage(chatId, customReplies.promptGrp, { parse_mode: "HTML" });
                    }
                })
        }).catch(err => {
            console.log(err)
        })
}

var getCommand = (message) => {
    if (message.indexOf(' ') !== -1) {
        return message.substr(0, message.indexOf(' '));
    } else {
        return message;
    }
}

module.exports = { botResponse, startCronJob }