var today = new Date();
today.setHours(today.getHours() + 8);

var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();

if(dd<10) {
    dd = '0'+dd
} 

if(mm<10) {
    mm = '0'+mm
} 

var time = () => {
    var today = new Date();
    today.setHours(today.getHours() + 8);
    return `${today.getHours()}:${today.getMinutes()}`
}

today = mm + '/' + dd + '/' + yyyy;

module.exports = {today, time}