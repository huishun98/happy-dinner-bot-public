const { ObjectID } = require('mongodb');

const { date, time } = require('./date');

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
                reject("Invalid Group Id")
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
                members: { username, chatId }
            }
        },
        { new: true },
    ).catch(err => { console.log(err) })
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
                const findTodayArray = res.data.filter((replyObject) => replyObject.date == date());
                const entry = {
                    user,
                    chatId,
                    reply,
                    time: time()
                }
                if (findTodayArray.length == 0) {
                    var todaysData = {
                        date: date(),
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
                    const newReplies = res.data.filter((replyObject) => replyObject.date !== date());
                    var todaysReplies = findTodayArray[0].replies.filter((reply) => reply.chatId !== chatId)
                    todaysReplies.push(entry)
                    const todaysObject = {
                        date: date(),
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
                        var todaysReplies = updatedGroup.data.filter((data) => data.date == date())[0].replies
                        var response = []
                        for (i = 0; i < todaysReplies.length; i++) {
                            response.push(`${todaysReplies[i].user}: ${todaysReplies[i].reply}`);
                        };
                        response = response.join('\n');
                        resolve(response);
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

var retrieveAllGroups = () => {
    return new Promise((resolve, reject) => {
        groups.find({}).then((res) => {
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
                if (object.date == date()) {
                    todaysReplies = object.replies;
                }
            }
            resolve(todaysReplies);
        }).catch(err => reject(err))
    })
}

var quitGroup = (chatId) => {
    users.findOne({ chatId }).then((res) => {
        var groupId = res.group
        users
            .findOneAndUpdate(
                { chatId },
                { $set: { group: null } },
                { new: true }
            )
            .catch(err => console.log(err))

        groups.findById(groupId).then((groupObject) => {
            var groupMembers = groupObject.members
            groupMembers = groupMembers.filter((member) => member.chatId !== chatId)

            groups.findOneAndUpdate(
                { _id: new ObjectID(groupId) },
                {
                    $set: {
                        members: groupMembers
                    }
                },
                { new: true },
            ).catch(err => { console.log(err) })
        })
    });
}

// var fetchChatIdsOfThoseInGroups = () => {
//     return new Promise((resolve, reject) => {
//         users.find().then((allUsers) => {
//             var usersInGroups = allUsers.filter((user) => user.group !== null)
//             var chatIdArray = [];
//             for (i = 0; i < usersInGroups.length; i++) {
//                 chatIdArray.push(usersInGroups[i].chatId);
//             }
//             resolve(chatIdArray);
//         })
//     })
// }

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
    // fetchChatIdsOfThoseInGroups,
    getUserData,
    quitGroup,
    retrieveAllGroups
}