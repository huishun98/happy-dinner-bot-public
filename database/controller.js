const { ObjectID } = require('mongodb');

const { today, time } = require('../common/date');

const { connect } = require('./connect-mongo')
const { groups, users } = require('./models')

connect()

var addGroup = (groupId, members) => {
    var group = new groups({
        _id: groupId,
        members
    });
    group.save().catch((err) => {
        console.log(err)
    })
}

var addUser = (username, chatId) => {
    var user = new users({
        username,
        chatId
    });

    return new Promise((resolve, reject) => {
        user
            .save()
            .then((res) => {
                resolve(res)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

var getUserData = (chatId) => {
    return new Promise((resolve, reject) => {
        users.findOne({ chatId }).then((userData) => {
            resolve(userData)
        })
    })
}

var addUserGroup = (username, chatId, groupId) => {
    return new Promise((resolve, reject) => {
        users.findOne({ chatId }).then((res) => {
            if (res.group === null) {
                users
                    .findOneAndUpdate(
                        { chatId },
                        { $set: { group: groupId } },
                        { new: true }
                    )
                    .catch(err => reject(err))

                addGroup(groupId, {
                    username,
                    chatId
                })
                resolve(groupId);
            } else {
                reject('has a group')
            }
        })
    })
}

var inGroup = (chatId) => {
    return new Promise((resolve, reject) => {
        users.findOne({ chatId }).then((res) => {
            if (res.group === null) {
                resolve(false)
            }
            resolve(true)
        }).catch(err => {
            console.log("New user", err)
        });
    })
}

var groupExists = (groupId) => {
    return new Promise((resolve, reject) => {
        groups
            .find()
            .then((res) => {
                for (i = 0; i < res.length; i++) {
                    if (res[i]._id == groupId) {
                        resolve()
                    }
                }
                reject("invalid group Id")
            })
            .catch(err => {
                reject(err);
            })
    })

}

var addGroupMember = (username, chatId, group) => {
    groups.findOneAndUpdate(
        { _id: new ObjectID(group) },
        {
            $push: {
                members: {
                    username,
                    chatId
                }
            }
        },
        { new: true },
    ).catch(
        err => {
            console.log(err)
        }
    )
}

var findGroup = (chatId) => {
    return new Promise((resolve, reject) => {
        users.findOne({ chatId }).then((res) => {
            resolve(res.group);
        }).catch(err => {
            reject(err)
        })
    })
}

var saveReply = (reply, chatId, user) => {
    return new Promise((resolve, reject) => {
        findGroup(chatId).then((groupId) => {
            groups.findById(groupId).then((res) => {
                const findTodayArray = res.data.filter((replyObject) => replyObject.date == today);
                console.log(today, time())
                const entry = {
                    user,
                    chatId,
                    reply,
                    time: time()
                }
                if (findTodayArray.length == 0) {
                    var todaysData = {
                        date: today,
                        replies: [entry]
                    }
                    res.data.push(todaysData);
                    groups.findByIdAndUpdate(
                        groupId,
                        { $set: { data: res.data } },
                        { new: true },
                    ).then(() => {
                        resolve(`${user}: ${reply}`);
                    })
                }
                else {
                    const newReplies = res.data.filter((replyObject) => replyObject.date !== today);
                    var todaysReplies = findTodayArray[0].replies.filter((reply) => reply.chatId !== chatId)
                    todaysReplies.push(entry)
                    const todaysObject = {
                        date: today,
                        replies: todaysReplies
                    }
                    newReplies.push(todaysObject);
                    groups.findByIdAndUpdate(
                        groupId,
                        {
                            $set: { data: newReplies }
                        },
                        { new: true },
                    ).then((updatedGroup) => {
                        var todaysReplies = updatedGroup.data.filter((data) => data.date == today)[0]
                        for (i = 0; i < todaysReplies.length; i++) {
                            var toPush = `${todaysReplies[i].user}: ${todaysReplies[i].reply}`;
                            todaysReplies.push(toPush);
                        };
                        todaysReplies = todaysReplies.join('\n');
                        resolve(todaysReplies);
                    })
                }
            })
        }).catch(err => {
            reject(err)
        })
    })
}

var retrieveGroupData = (groupId) => {
    return new Promise((resolve, reject) => {
        groups.findById(groupId).then((res) => {
            resolve(res);
        }).catch(err => {
            reject(err)
        })
    })
}

var todaysReplies = (groupId) => {
    return new Promise((resolve, reject) => {
        groups.findById(groupId).then((groupData) => {
            var dataArray = groupData.data;
            var todaysReplies = [];
            //loop through the array to find object with date set to today, return that object for now.
            for (i = 0; i < dataArray.length; i++) {
                var object = dataArray[i];
                if (object.date == today) {
                    todaysReplies = object.replies;
                }
            }
            resolve(todaysReplies);
        }).catch(err => reject(err))
    })
}

// var changeGroupId = (chatId) => {
//     return new Promise((resolve, reject) => {
//         findGroup(chatId).then((oldGroupId) => {
//             var newGroupId = new ObjectID();
//             groups.findById(oldGroupId).then((groupObject) => {
//                 var group = new groups({
//                     _id: newGroupId,
//                     members: groupObject.members,
//                     data: groupObject.data
//                 });
//                 group.save(() => {
//                     groups.deleteOne({ _id: new ObjectID(oldGroupId) }).then(() => {
//                         users.updateMany(
//                             { group: oldGroupId },
//                             {
//                                 $set: {
//                                     group: newGroupId
//                                 }
//                             },
//                         ).then(() => {
//                         });
//                     });
//                 })
//                 resolve(newGroupId);
//             });
//         }).catch(err => {
//             reject(err)
//         })
//     })
// }

var fetchChatIds = () => {
    return new Promise((resolve, reject) => {
        users.find().then((allUsers) => {
            // console.log(`all users are ${allUsers}.`);
            var chatIdArray = [];
            for (i = 0; i < allUsers.length; i++) {
                chatIdArray.push(allUsers[i].chatId);
            }
            resolve(chatIdArray);
        })
    })

}

module.exports = {
    addGroup,
    addUser,
    addUserGroup,
    inGroup,
    groupExists,
    addGroupMember,
    saveReply,
    findGroup,
    retrieveGroupData,
    todaysReplies,
    // changeUserGroup,
    // changeGroupId,
    fetchChatIds,
    // createNewToday,
    getUserData
}