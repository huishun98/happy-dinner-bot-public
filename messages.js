const startMessage = `<b>Welcome to Happy Dinner Bot.</b>\nIf you would like to create a new group, please enter '/create'.\nIf you would like to join an existing group, please enter '/join' followed by group ID. (e.g. /join 1234).\nFor the full list of commands, enter '/help'.`
const question = '<b>Dinner tonight?</b>';
const standardReply = question + '\n**Please reply with either Yes or No';
const success = 'Welcome to Happy Dinner Bot!\n'
const help = "List of commands:\n/responses - check who is having dinner tonight\n/group - check group ID \n/members - list group members \n/create - create a group \n/join - join a group (e.g. /join 1234)"
const errMultipleGrps = `You already have a dinner group.\nYou can't create/join another one.`
const checkGrpId = (grpId) => {
    return `Your group ID is ${grpId}.`
}
const createdGrp = (groupId) => {
    return `Your dinner group is successfully created.\nThe group ID is ${groupId}.\n`
}
const invalidGrpId = `Invalid group ID.\nPlease enter '/join' followed by a valid group ID.\n(e.g. /join 1234)`
const promptGrp = `Please create a group or join a group!`
const promptCmd = `Please enter a valid command.`
const changedGrp = `Your group has been changed.`
const newGrpId = (newGroupId) => {
    return `Your new group ID is ${newGroupId}.`
}
const quit = "You have quitted your dinner group"

module.exports = {
    startMessage,
    question,
    standardReply,
    success,
    help,
    errMultipleGrps,
    checkGrpId,
    createdGrp,
    invalidGrpId,
    promptGrp,
    promptCmd,
    changedGrp,
    newGrpId,
    quit
}