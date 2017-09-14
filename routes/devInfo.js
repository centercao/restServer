/**
 * Created by root on 17-3-24.
 */
Date.prototype.format = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份
		"d+": this.getDate(), //日
		"h+": this.getHours(), //小时
		"m+": this.getMinutes(), //分
		"s+": this.getSeconds(), //秒
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度
		"S": this.getMilliseconds() //毫秒
	};
	if(/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortId=require('js-shortid');
var socketIo = require("../utils/webSocketHelper");
var CMD = require("../middlewares/apiCmd");
var eventPool = require("../utils/eventPoolHelper");

// getui
//
//
//
//
//
//
// var Tran  = require("tran");
// var tran = new Tran();
// 获取设备
router.get('/', async function (ctx, next) {
    var query = ctx.request.query;
    var token = query.token;
    if(!token){
        throw new ApiError(ApiError.USER_NOT_LOGIN);
        return false;
    }
    var account = await redis.get("token:" + token);
    if(!account){
        throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
        return false;
    }
    // 获取设备
    var result = [];
    var gateways = await  redis.smembers("userGate:" + account);
    for(let i = 0;i<gateways.length;i++){
        var gVal = await redis.hmget("device:" + gateways[i],"name","state");
        var gate = {};
        gate["gName"] = gVal[0];;
        gate["gId"] = gateways[i];
        gate["name"] = gVal[0];
        gate["state"] = gVal[1];
        gate["id"] = gateways[i];
	    gate["type"] = 0;
        result.push(gate);
        var devs = await redis.smembers("gatewaySensors:" + gate.gId); // 设备集
        for(let j = 0;j< devs.length;j++){
            var val= await redis.hmget("device:" + devs[j],"name","state","type");
            var dev = {};
            dev["gName"] = gate.gName;
            dev["gId"] = gate.gId;
            dev["name"] = val[0];
            dev["state"] = val[1];
            dev["id"] = devs[j];
	        dev["type"] = val[2];
            result.push(dev);
        }
    }
    gateways = await  redis.smembers("userTrust:" + account);// 网管集
    for(let i = 0;i<gateways.length;i++){
        var gVal = await redis.hmget("device:" + gateways[i],"name","state");;
        var gate = {};
        gate["gName"] = gVal[0];;
        gate["gId"] = gateways[i];
        gate["name"] = gVal[0];
        gate["state"] = gVal[1];
        gate["id"] = gateways[i];
        gate["type"] = 0;
        result.push(gate);
        var devs = await redis.smembers("gatewaySensors:" + gate.gId); // 设备集
        for(let j = 0;j< devs.length;j++){
            var val= await redis.hmget("device:" + devs[j],"name","state","type");
            var dev = {};
            dev["gName"] = gate.gName;
            dev["gId"] = gate.gId;
            dev["name"] = val[0];
            dev["state"] = val[1];
            dev["id"] = devs[j];
	        dev["type"] = val[2];
            result.push(dev);
        }
    }
    ctx.body = result;
});
// 获取设备的历史信息
router.get('/:id', async function (ctx, next) {
    var query = ctx.request.query;
    var token = query.token;
    if(!token){
        throw new ApiError(ApiError.USER_NOT_LOGIN);
        return false;
    }
    var account = await redis.get("token:" + token);
    if(!account){
        throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
        return false;
    }
    var devId =ctx.params.id;
    var currentPage = Number(query.current);
    var pageSize = Number(query.pageSize);
    if(!devId || !currentPage || !pageSize){
        throw new ApiError(ApiError.DATA_IS_EMPTY);
        return false;
    }
    // var result = await mongoDb.find("devInfo",{devId: devId},currentPage,pageSize);
	var result = await ctx.mongo.collection('devInfo').find({devId: devId}).skip((currentPage-1) * pageSize).sort({_id:-1}).limit(pageSize).toArray();
    for(var i =0 ;i<result.length;i++){
        result[i].startDate = result[i].startDate.format("yyyy-MM-dd hh:mm:ss");
        if(result[i].endDate){
	        result[i].endDate = result[i].endDate.format("yyyy-MM-dd hh:mm:ss");
        }
	    delete result[i].devId;
    }
    ctx.body = result;
});
// 注册
router.post('/', async function (ctx, next) {
    let body = ctx.request.body;
    ctx.body = {
    };
    
});
// 处理报警
router.put('/:id', async function (ctx, next) {
    var body = ctx.request.body;
    var token = body.token;
     if(!token){
     throw new ApiError(ApiError.USER_NOT_LOGIN);
     return false;
     }
     var account = await redis.get("token:" + token);
     if(!account){
     throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
     return false;
     }
	var id = ctx.params.id;
	var gId = body.gId;
	var dealType = body.dealType;
	if(!id || !gId ){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	
	redis.pub.publish("control",JSON.stringify({cmd:CMD.RELEASE_ALARM_CMD,id:id,gId:gId}));
	
	var data = await eventPool.operate("dealAlert",{gId:gId});
	if(data.status == 200){
		// var result = await mongoDb.update("devInfo",{devId: id,endDate: {$exists: false}},{$set:{dealType:dealType,endDate:new Date()}} , {multi:true});
		var result = await ctx.mongo.collection('devInfo').updateMany({devId: id,endDate: {$exists: false}},{$set:{dealType:dealType,endDate:new Date()}} ); //, {multi:true}
		if(result.result.ok  != 1){
			throw new ApiError(ApiError.ALARM_DEAL_FAIL);
			return false;
		}
		await redis.hset("device:" + id ,"state" ,1);
		socketIo.emit(gId,"dealAlarm",{id:id,status:data.res});
	}else{
		throw new ApiError(ApiError.OPERATE_RROR);
		return false;
	}
    ctx.body = {
    	data:data
    };
});
router.delete('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	let gId = body.gId;
	if(!(await redis.sismember("gatewaySensors:" +gId,id))){
		throw new ApiError(ApiError.DEVICE_NON_EXISTENT);
		return;
	}
	let token =body.token;
	let enable = body.enable;
	redis.pub.publish("control",JSON.stringify({cmd:CMD.DEVICE_ENABLE,id:id,gId:gId,enable:enable}));
	var data = await eventPool.operate("devEnable",{gId:gId});
	ctx.body = {
		data:data
	};
    ctx.body = {};
});

// 问题反馈
router.post('/question/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let token = ctx.params.id;
	if(!token){
		throw new ApiError(ApiError.USER_NOT_LOGIN);
		return false;
	}
	var account = await redis.get("token:" + token);
	if(!account){
		throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
		return false;
	}
	if(!body.id || !body.phone || !body.title){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var result = await ctx.mongo.collection('devInfo').updateOne({_id:ctx.mongo.ObjectID(body.id)},
		{$set:{question:{account:account,title:body.title,phone:body.phone,name:body.name,content:body.content,startDate:new Date()}}});
	
	ctx.body = {
	};
	
});

// 问题查询
router.get('/question/:id', async function (ctx, next) {
	let query = ctx.request.query;
	let token = ctx.params.id;
	if(!token){
		throw new ApiError(ApiError.USER_NOT_LOGIN);
		return false;
	}
	var account = await redis.get("token:" + token);
	if(!account){
		throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
		return false;
	}
	var currentPage = Number(query.current);
	var pageSize = Number(query.pageSize);
	if(!currentPage || !pageSize){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var result = await ctx.mongo.collection('devInfo').find({'question.account':account}).skip((currentPage-1) * pageSize).sort({_id:-1}).limit(pageSize).toArray();
	ctx.body = result;
	
});

// 接收网管服务器发送来的信息
redis.sub.subscribe('alert','heart', 'offLine','onLine','replyAlarmRelease',
	"replyReleaseBindMac",'replyBindMac','replySceneSetting','attRead','attSetting','zigRead','state',
	'zigSetting',"devEnable",function (err) {

});
// receive message
redis.sub.on('message',async function (channel, message) {
	switch (channel){
		case 'alert': {
			var info = JSON.parse(message);
			console.log("alert devId:" + info.devId);
			socketIo.emit("" + info.gId, "chat message",
				{cmd: "alarm", data: {id: info.devId}});
			var cIds = await redis.smembers("gateTui:" + info.gId);
			for(let i =0;i<cIds.length;i++){
				// tran.sendMessage("报警",{cmd: "alarm", data: {id: info.devId}},cIds[i]);
			}
		}
			break;
		case 'heart': {
			var info = JSON.parse(message);
		}
			break;
		case 'offLine': {
			var info = JSON.parse(message);
			socketIo.emit("" + info.gId, "chat message",
				{cmd: "offLine", data: {id: info.devId}});
			var cIds = await redis.smembers("gateTui:" + info.gId);
			for(let i =0;i<cIds.length;i++){
				// tran.sendMessage("离线",{cmd: "offLine", data: {id: info.devId}},cIds[i]);
			}
		}
			break;
		case 'onLine': {
			var info = JSON.parse(message);
			socketIo.emit("" + info.gId, "chat message",
				{cmd: "onLine", data: {id: info.devId}});
			var cIds = await redis.smembers("gateTui:" + info.gId);
			for(let i =0;i<cIds.length;i++){
				// tran.sendMessage("上线",{cmd: "onLine", data: {id: info.devId}},cIds[i]);
			}
		}
			break;
		case 'state': {
			var info = JSON.parse(message);
			socketIo.emit("" + info.gId, "chat message",
				{cmd: "state", data: {id: info.devId}});
			var cIds = await redis.smembers("gateTui:" + info.gId);
			for(let i =0;i<cIds.length;i++){
				// tran.sendMessage("状态",{cmd: "state", data: {id: info.devId,state:info.state,type:info.type}},cIds[i]);
			}
		}
			break;
		case 'replyAlarmRelease':{
			eventPool.trigger("dealAlert",message);
		}
			break;
		case 'replyReleaseBindMac':{
			eventPool.trigger("macReleaseBind",message);
		}
			break;
		case 'replyBindMac':{
			eventPool.trigger("macBind",message);
		}
			break;
		
		case 'replySceneSetting':{
			eventPool.trigger("sceneSetting",message);
		}
			break;
		case 'attRead':{
			eventPool.trigger("attRead",message);
		}
			break;
		case 'attSetting':{
		eventPool.trigger("attSetting",message);
		}
		break;
		case 'zigRead':{
			eventPool.trigger("zigRead",message);
		}
			break;
		case 'zigSetting':{
			eventPool.trigger("zigSetting",message);
		}
			break;
		case 'devEnable':{
			eventPool.trigger("devEnable",message);
		}
			break;
		default:
			break
	}
	
});

setInterval(async function () {
	let keys = await redis.keys("device:*");
	for(let i =0;i<keys.length;i++){
		let gateway = await redis.hmget(keys[i],'type','state','on');
		if(Number(gateway[0]) == 0){
			if(gateway[1] == "0"){
				var ids = keys[i].split(":");
				var cIds = await redis.smembers("gateTui:" + ids[1]);
				for(let j =0;j<cIds.length;j++){
					// tran.sendMessage("离线",{cmd: "offLine", data: {id: ids[1]}},cIds[j]);
				}
				continue;
			}
			if(gateway[2]){
				var oldTime = Number(gateway[2]) + 20000; // 20 妙
				var nowTime = Date.parse(new Date());
				if(nowTime>oldTime){
					var ids = keys[i].split(":");
					var cIds = await redis.smembers("gateTui:" + ids[1]);
					for(let j =0;j<cIds.length;j++){
					}
						// tran.sendMessage("离线",{cmd: "offLine", data: {id: ids[1]}},cIds[j]);
					}
				}
			} else{
				var ids = keys[i].split(":");
				var cIds = await redis.smembers("gateTui:" + ids[1]);
				for(let j =0;j<cIds.length;j++){
					// tran.sendMessage("离线",{cmd: "offLine", data: {id: ids[1]}},cIds[j]);
				}
			}
		}
	},1000);
module.exports = router;
