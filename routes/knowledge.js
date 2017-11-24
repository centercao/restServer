/**
 * Created by center ON 17-11-21
 */
var router = require('koa-router')();
var redis = require('../utils/redisHelper');
// 知识查询
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
	var result = await ctx.mongo.collection('knowledge').find().toArray();
	for(var i =0 ;i < result.length;i++){
		var dev = await redis.hmget("deviceType:" + result[i].type,"name","image");
		result[i].name= dev[0];
		result[i].image= dev[1];
	}
	ctx.body = result;
});

module.exports = router;