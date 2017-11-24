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
	var result = {};
	var gateways = await redis.smembers("userGate:" + account);
	var myGate =[];
	for(var i =0;i<gateways.length;i++){
		var dev = {};
		dev.id = gateways[i];
		var val = await redis.hmget("device:" + gateways[i],"name","image");
		dev.name = val[0];
		dev["image"] = val[1];
		dev.trust=[];
		var trust = await redis.smembers("deviceTrust:" + gateways[i]);
		for(let j = 0;j<trust.length;j++){
			let value = await redis.hmget("users:" + trust[j],"name","image");
			let trustUser = {};
			trustUser.id = trust[j];
			trustUser.name = value[0];
			trustUser.image= value[1];
			dev.trust.push(trustUser);
		}
		myGate.push(dev);
	}
	result["owner"] = myGate;
	var trustGate =[];
	gateways = await redis.smembers("userTrust:" + account);
	for(var i =0;i<gateways.length;i++){
		var dev = {};
		dev.id = gateways[i];
		var val = await redis.hmget("device:" + gateways[i],"name","image");
		dev.name = val[0];
		dev["image"] = val[1];
		var gateKeys = await redis.keys("userGate:*");
		dev.trust = 0;
		for(var j = 0;j < gateKeys.length;j++){
			if(await redis.sismember(gateKeys[j],gateways[i])){
				var user = gateKeys[i].split(":");
				dev.trust = user[1];
				break;
			}
		}
		var trust = await redis.hmget("users:" + dev.trust,"name","image");
		dev.trustName = trust[0];
		dev.trustImage= trust[1];
		trustGate.push(dev);
	}
	result["trust"] = trustGate;
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
/*	var isExist = await redis.sismember("userGate:" + account,gateId);
	if(!isExist){
	
	}*/
	var val = await  redis.hmget("device:" + gateId,"type","trust");
	if(val[0] != 0){
		throw new ApiError(ApiError.DEVICE_TYPE_ERROR);
		return false;
	}
	/*if(val[1]){
		throw new ApiError(ApiError.REPEAT_SETTINGS);
		return false;
	}*/
	await redis.sadd("userTrust:" + trustAccount,gateId);
	await redis.sadd("deviceTrust:" + gateId,trustAccount);
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
	await redis.srem("deviceTrust:" + gId,trust);
	await  redis.save();
	ctx.body = {};
});

module.exports = router;

