/**
 * Created by center on 17-5-16.
 */
/**
 * Created by center on 17-3-28.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var CMD = require("../middlewares/apiCmd");
var eventPool = require("../utils/eventPoolHelper");

// 获取
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
	var result = [];
	var gateways = await redis.smembers("userGate:" + account);
	for(var i =0;i<gateways.length;i++){
		var dev = {};
		dev.id = gateways[i];
		var val = await redis.hmget("device:" + gateways[i],"name","trust");
		dev.name = val[0];
		dev.trust = val[1];
		result.push(dev);
	}
	gateways = await redis.smembers("userTrust:" + account);
	for(var i =0;i<gateways.length;i++){
		var dev = {};
		dev.id = gateways[i];
		dev.name = await redis.hget("device:" + gateways[i],"name");
		result.push(dev);
	}
	ctx.body = result;
});
// 获取网关下的场景
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
	var gId =ctx.params.id;
	if(!gId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var account ="";
	var result = [];
	var devs = await redis.smembers("gatewaySensors:" + gId);
	for(var i =0 ;i<devs.length;i++){
		var dev = {};
		var val = await redis.hmget("device:" + devs[i],"name","type");
		dev.id=devs[i];
		dev.name = val[0];
		dev.type = val[1];
		result.push(dev);
	}
	ctx.body = result;
});
//
router.post('/', async function (ctx, next) {
	let body = ctx.request.body;
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
	var trustAccount = body.trustAccount;
	var gateId = body.gId;
	if(!trustAccount || !gateId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	// 是否是自己家的网关
	var isExist = await redis.sismember("userGate:" + account,gateId);
	if(!isExist){
	
	}
	var val = await  redis.hmget("device:" + gateId,"type","trust");
	if(val[0] != 0){
		throw new ApiError(ApiError.DEVICE_TYPE_ERROR);
		return false;
	}
	if(val[1]){
		throw new ApiError(ApiError.REPEAT_SETTINGS);
		return false;
	}
	await redis.sadd("userTrust:" + trustAccount,gateId);
	await redis.hset("device:" + gateId,"trust",trustAccount);
	await  redis.save();
	ctx.body = {};
});
// 设置场景
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
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
	var gId = ctx.params.id;
	if(!gId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var type = body.type; // uint8(1:回家,2:入睡)
	var startTime = body.startTime;
	var endTime = body.endTime;
	redis.pub.publish("control",JSON.stringify({cmd:CMD.SCENE_SET_CMD,gId:gId,type:type,startTime:startTime,endTime:endTime}));
	
	var data = await eventPool.operate("sceneSetting",{gId:gId});
	ctx.body = {
		data:data
	};
});
// 取消委托
router.delete('/:id', async function (ctx, next) {
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
	var gId =ctx.params.id;
	var trust = body.trustAccount;
	if(!trust || !gId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	await redis.srem("userTrust:" + trust,gId);
	await redis.hset("device:" + gId,"trust","");
	await  redis.save();
	ctx.body = {};
});

module.exports = router;

