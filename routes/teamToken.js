/**
 * Created by center on 17-3-23.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortId=require('js-shortid');
var md5 = require("../utils/md5");
const TOKEN_TIME = 60*10;
const REFRESH_TOKEN_TIME = 60*100;
// 刷新Token
router.get('/', async function (ctx, next) {
	var query = ctx.request.query;
	var keys = await redis.keys("reToken:*");
	for(var i = 0; i<keys.length;i++){
		if(keys[i]== "reToken:" + query.reToken){
			await redis.expire(query.reToken,REFRESH_TOKEN_TIME);
			var token = shortId.gen();
			var id = await redis.get(keys[i]);
			await redis.set("token:" + token,id);
			await redis.expire("token:" + token,TOKEN_TIME);
			ctx.body = {token:token,reToken:query.reToken};
			return 0;
		}
	}
	throw new ApiError(ApiError.USER_NOT_LOGIN);
});
router.get('/:id', async function (ctx, next) {
	var query = ctx.request.query;
	var id =ctx.params.id;
	ctx.body = {
		id:"checkOK"
	};
});
// 录入设备
router.post('/', async function (ctx, next) {
	var body = ctx.request.body;
	var token = body.token;
	var teamId = body.teamId;
	var id = body.id;
	var typeId = body.type;
	var name = await redis.get("devType:" + typeId);
	await redis.hmset("device:" + id ,{name:name,teamId:teamId,type:typeId});
	await  redis.save();
	ctx.body = {
	};
});
router.put('/:id', async function (ctx, next) {
	var body = ctx.request.body;
	var token = body.token; // teamId
	var teamId = body.teamId;
	var devId =ctx.params.id;
	var gatewayId= body.gateway;
	if(teamId &&  !gatewayId){ // 销售
		await redis.hmset("device:" + devId ,{teamId:teamId});
	} else{ // 绑定
		await redis.sadd("devSensor:" + gatewayId,devId);
	}
	await  redis.save();
	ctx.body = {};
});
router.delete('/:id', async function (ctx, next) {
	/*var token = ctx.request.body.token;
	 var teamId = token;
	 var id =ctx.params.id;
	 await redis.del("teamUsers:" + teamId + ":" + id);
	 await redis.del("userRoles:" + id);
	 await  redis.save();*/
	ctx.body = {};
});

module.exports = router;

