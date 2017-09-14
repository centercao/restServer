/**
 * Created by center on 17-3-28.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortId = require('js-shortid');
var md5 = require("../utils/md5");
const TOKEN_TIME = 30*10;
const REFRESH_TOKEN_TIME = 60*100;

// 获取网关列表
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
// 获取网关下的设备
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
// 绑定网关
router.post('/:id', async function (ctx, next) {
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
	var exists = await redis.exists("device:" + gId);
	if(!exists){
		throw new ApiError(ApiError.DEVICE_NO_EXISTS);
		return false;
	}
	var type = await redis.hget("device:" + gId,"type");
	if(Number(type) != 0){
		throw new ApiError(ApiError.NONE_GATEWAY);
		return false;
	}
	var keys = await redis.keys("userGate:*");
	for(let i = 0;i < keys.length; i++){
		if(await redis.sismember(keys[i],gId)){
			throw new ApiError(ApiError.GATE_REPEAT_BIND);
			return false;
		}
	}
	await redis.sadd("userGate:" + account,gId);
	await  redis.save();
	ctx.body = {};
});
// 委托
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
// 设备重命名
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
	var devId = ctx.params.id;
	var name = body.name;
	if(!devId || !name){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	await redis.hset("device:" + devId,"name",name);
	ctx.body = {};
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

