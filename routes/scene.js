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
	ctx.body = result;
});
// 获取某个sensor场景设置
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
	var id =ctx.params.id; // devId
	var gId = query.gId;
	if(!id || !gId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	redis.pub.publish("control",JSON.stringify({cmd:CMD.SCENE_READ_CMD,gId:gId,id:id}));
	var data = await eventPool.operate("sceneRead",{gId:gId});
	ctx.body = data;
});
//
router.post('/', async function (ctx, next) {
	
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
	var type = body.type; // uint8(0：自动/手动,1入睡时间设置)
	if(type == 0){
		redis.pub.publish("control",JSON.stringify({cmd:CMD.SCENE_SET_CMD,gId:gId,type:type,typeCmd:body.cmd}));
	}else{
		var startTime = body.startTime;
		var endTime = body.endTime;
		if(!startTime || !endTime || !body.id){
			throw new ApiError(ApiError.DATA_IS_EMPTY);
		}
		redis.pub.publish("control",JSON.stringify({cmd:CMD.SCENE_SET_CMD,gId:gId,id:body.id,type:type,startTime:startTime,endTime:endTime}));
	}
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

