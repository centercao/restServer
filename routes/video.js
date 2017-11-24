/**
 * Created by center ON 17-11-6
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var AppToken =require("ezviz-helper");
var config = require('../config');
// var TOKEN_TIME = 60 * 1000 * 60 * 24 * 6.5; // 毫秒
var appToken = new AppToken({
	appKey:config.appKey,
	appSecret:config.appSecret
});
// 获取萤石云Token
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
	// 查询
	var ezToken = await redis.get("video:ezToken");
	if(!ezToken){
		var tokenData = await appToken.getToken();
		if(tokenData.status == 200){
			await redis.set("video:ezToken",tokenData.data.accessToken);
			await redis.expire("video:ezToken",Math.floor((tokenData.data.expireTime -new Date().getTime() - 100) /1000));
			ctx.body = tokenData.data.accessToken;
		}else{
			throw new ApiError(ApiError.GATE_EZVIZ_TOKEN);
			return false;
		}
	}else{
		ctx.body = ezToken;
	}
	
});
// 录入萤石云设备（摄像头)
router.post('/', async function (ctx, next) {
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
	var id = body.deviceSeriaNO;
	var gId = body.gId;
	var typeId = 10;
	var name = body.name;
	var mac = body.deviceSeriaNO;
	var deviceVerifyCode =body.deviceVerifyCode;
	if(!id || !gId || !name || !deviceVerifyCode){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	await redis.hmset("device:" + id ,{name:name,teamId:0,type:typeId,state:0,mac:mac,deviceSeriaNO:id,deviceVerifyCode:deviceVerifyCode});
	await redis.sadd("gatewaySensors:" + gId,id);
	await  redis.save();
	ctx.body = {
	};
});
module.exports = router;