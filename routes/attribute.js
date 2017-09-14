/**
 * Created by center on 17-6-30.
 */

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

//
router.get('/', async function (ctx, next) {
	var query = ctx.request.query;
	var gId = query.gId;
	var type = query.type;
	redis.pub.publish("control",JSON.stringify({cmd:CMD.ZIGBEE_READ_CMD,gId:gId,type:type}));
	var data = await eventPool.operate("zigRead",{gId:gId});
	ctx.body = data;
});
// 获取属性
router.get('/:id', async function (ctx, next) {
	var query = ctx.request.query;
	var devId =ctx.params.id;
	var gId = query.gId;
	var type = query.type;
	if(!devId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	redis.pub.publish("control",JSON.stringify({cmd:CMD.ATT_READ_CMD,id:devId,gId:gId,type:type}));
	var data = await eventPool.operate("attRead",{gId:gId});
	ctx.body = data;
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
// 设置设备属性
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	var devId = ctx.params.id;
	if(!devId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var type = body.type; // uint8(1:回家,2:入睡)
	var att = body.att;
	var gId = body.gId;
	redis.pub.publish("control",JSON.stringify({cmd:CMD.ATT_SET_CMD,id:devId,gId:gId,type:type,att:att}));
	
	var data = await eventPool.operate("attSetting",{gId:gId});
	ctx.body = {
		data:data
	};
});
// zigbee系统参数设置
router.put('/', async function (ctx, next) {
	let body = ctx.request.body;
	var type = body.type; // uint8(1:回家,2:入睡)
	var att = body.att;
	var gId = body.gId;
	if(!type || !att || !gId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	redis.pub.publish("control",JSON.stringify({cmd:CMD.ZIGBEE_SET_CMD,gId:gId,type:type,att:att}));
	
	var data = await eventPool.operate("zigSetting",{gId:gId});
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