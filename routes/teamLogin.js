/**
 * Created by center on 17-3-22.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortId=require('js-shortid');
var md5 = require("../utils/md5");
const TOKEN_TIME = 60*10;
const REFRESH_TOKEN_TIME = 60*100;

router.get('/', async function (ctx, next) {
	var query = ctx.request.query;
	var keys = await redis.keys("teamUsers:*");
	for(var i = 0; i<keys.length;i++){
		var list = keys[i].split(":");
		var id = list[1] + ":" + list[2];// teamId + userId keys[i].substring(keys[i].lastIndexOf(":")+1);
		if(list[2] == query.account){
			var pass = await redis.hget(keys[i],"pass");
			if(md5.hex_md5(query.password) == pass){
				var token = shortId.gen();
				await redis.set("token:" + token,id);
				await redis.expire("token:" + token,TOKEN_TIME);
				var reToken = shortId.gen();
				await redis.set("reToken:" + reToken,id);
				await redis.expire("reToken:" + reToken,REFRESH_TOKEN_TIME);
				ctx.body = {token:token,reToken:reToken};
				return 0;
			}else{
				throw new ApiError(ApiError.PASS_ERROR);
				return 1;
			}
		}
	}
	throw new ApiError(ApiError.USER_EXIST);
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

