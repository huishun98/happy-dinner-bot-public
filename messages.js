const startMessage = `<b>Welcome to Happy Dinner Bot!</b>\nTo start, you might want to create a new group (enter '/create')\nor join an existing group (enter '/join').\nFor the full list of commands, enter '/help'.`
const question = '<b>Dinner tonight?</b>';
const standardReply = question + '\n**Please reply with either Yes or No';
const success = 'Welcome to Happy Dinner Bot!\n'
const help = "List of commands:\n/responses - check who is having dinner tonight\n/group - check group ID \n/members - list group members \n/create - create a group \n/join - join a group (e.g. /join 1234)"
const errMultipleGrps = `You already have a dinner group.\nYou can't create/join another one.`
const checkGrpId = `Here is your group ID!`
const createdGrp = `Your dinner group is successfully created.\nHere's your group ID!`
const invalidGrpId = `Invalid group ID. Your request has been aborted.`
const promptGrp = `Please create a group or join a group!`
const promptCmd = `Please enter a valid command.`
const changedGrp = `Your group has been changed.`
const quit = "You have quitted your dinner group"
const join = "Please manually reply to this message with the group's ID."
const noReplies = "No one has replied yet. Be the first!"

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
    quit,
    join,
    noReplies
}