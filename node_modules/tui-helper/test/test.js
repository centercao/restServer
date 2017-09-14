var Tran  = require("../index");
var tran = new Tran();
/*tran.sendMessage("报警",{id:123456,alarm:2},'5c4e5cf583713aaa09543d5052f11f3e').then(function (value) {
	console.log(value);
});*/
tran.sendMessage("报警",{id:123456,alarm:2},'5c4e5cf583713aaa09543d5052f11f3e',function (err,value) {
	console.log(value);
});