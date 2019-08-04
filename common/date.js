
var initialiseToday = () => {
    var today = new Date();
    today.setHours(today.getHours() + 8);
    return today
}

var parse = (number) => {
    if (number < 10) {
        return '0' + number.toString()
    }
    return number
}

var date = () => {
    initialiseToday()
    var dd = parse(today.getDate());
    var mm = parse(today.getMonth() + 1); //January is 0!
    var yyyy = today.getFullYear();
    return mm + '/' + dd + '/' + yyyy;
}

var time = () => {
    initialiseToday()
    return `${parse(today.getHours())}:${parse(today.getMinutes())}`
}

module.exports = { date, time }
