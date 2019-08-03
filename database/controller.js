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
            console.log(res.group === null, res.group === null)
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

var changeUserGroup = (chatId, newGroupId) => {
    return new Promise((resolve, reject) => {

        groupExists(newGroupId)
        .then(() => {
            findGroup(chatId).then((oldGroup) => {
                groups
                    .findById(oldGroup)
                    .then((oldGroupData) => {
                        var oldGroupMembersArray = oldGroupData.members;
                        for (i = 0; i < oldGroupMembersArray.length; i++) {
                            if (oldGroupMembersArray[i].chatId == chatId) {
                                oldGroupMembersArray.splice(i, 1);
                            }
                        }
                        groups
                            .findOneAndUpdate(
                                { _id: new ObjectID(oldGroup) },
                                { $set: { members: oldGroupMembersArray, } },
                                { new: true },
                            )
                            .then(() => {
                                users.findOneAndUpdate(
                                    { chatId },
                                    { $set: { group: newGroupId } }
                                ).then(() => {
                                    var userData = getUserData(chatId)
                                    var username = userData.username;
                                    addGroupMember(username, chatId, newGroupId);
                                })
                                resolve()
                            })
                    })
            }).catch(err => {
                reject(err)
            })
        })
        .catch(err => {
            reject(err)
        })
    })


}

// check if user is in any group
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

// var createNewToday = () => {
//     groups.find().then((allGroupsArray) => {
//         for (i = 0; i < allGroupsArray.length; i++) {
//             groups
//             .findByIdAndUpdate(
//                 allGroupsArray[i]._id,
//                 {
//                     $push: {
//                         data: {
//                             date: today,
//                             replies: []
//                         }
//                     }
//                 },
//                 { new: true }
//             )
//             .then((updatedGroup) => {
//                 console.log(`updated group with new date ${updatedGroup}`);
//             }).catch((err) => {
//                 console.log(err);
//             });
//         }
//     });
// }

var saveReply = (reply, chatId, user) => {
    return new Promise((resolve, reject) => {
        findGroup(chatId).then((groupId) => {
            groups.findById(groupId).then((res) => {
                var filteredArray = res.data.filter((replyObject) => replyObject.date !== today);
                if (filteredArray.length === res.data.length) {
                    var todaysData = {
                        date: today,
                        replies: [
                            {
                                user,
                                chatId,
                                reply,
                                time: time()
                            }
                        ]
                    }
                    res.data.push(todaysData);
                    groups.findByIdAndUpdate(
                        groupId,
                        { $set: { data: res.data } },
                        { new: true },
                    ).then(() => {
                        var todaysReplies = `${user}: ${reply}`;
                        resolve(todaysReplies);
                    })
                }
                else {
                    var replyToPush = {
                        user,
                        chatId,
                        reply,
                        time: time()
                    }
                    var todaysData;
                    var todaysObject;
                    var newDataArray = [];
                    for (i = 0; i < res.data.length; i++) {
                        if (res.data[i].date == today) {
                            todaysData = res.data[i];
                            todaysData = todaysData.replies.filter((reply) => reply.chatId !== chatId);
                            todaysData.push(replyToPush);
                            todaysObject = {
                                date: today,
                                replies: todaysData
                            }
                        } else {
                            newDataArray.push(res.data[i]);
                        }
                    }
                    newDataArray.push(todaysObject);
                    groups.findByIdAndUpdate(
                        groupId,
                        {
                            $set: {
                                data: newDataArray
                            }
                        },
                        { new: true },
                    ).then((updatedGroups) => {
                        var allData = updatedGroups.data;
                        var todaysRepliesArray;
                        var todaysReplies = [];
                        for (i = 0; i < allData.length; i++) {
                            if (allData[i].date == today) {
                                todaysRepliesArray = allData[i].replies;
                            }
                        };
                        for (i = 0; i < todaysRepliesArray.length; i++) {
                            var toPush = `${todaysRepliesArray[i].user}: ${todaysRepliesArray[i].reply}`;
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

var changeGroupId = (chatId) => {
    return new Promise ((resolve, reject) => {
        findGroup(chatId).then((oldGroupId) => {
            var newGroupId = new ObjectID();
            groups.findById(oldGroupId).then((groupObject) => {
                var group = new groups({
                    _id: newGroupId,
                    members: groupObject.members,
                    data: groupObject.data
                });
                group.save(() => {
                    groups.deleteOne({ _id: new ObjectID(oldGroupId) }).then(() => {
                        users.updateMany(
                            { group: oldGroupId },
                            {
                                $set: {
                                    group: newGroupId
                                }
                            },
                        ).then(() => {
                        });
                    });
                })
                resolve(newGroupId);
            });
        }).catch(err => {
            reject(err)
        })
    })
}

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
    changeUserGroup,
    changeGroupId,
    fetchChatIds,
    // createNewToday,
    getUserData
}