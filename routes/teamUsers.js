/**
 * Created by center on 17-3-15.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortid=require('js-shortid');

router.get('/', async function (ctx, next) {
	var token = ctx.request.query.token;
	var teamId  = token;
	var keys = await redis.keys("teamUsers:" + teamId + ":*");
	var result = {};
	result.userList = [];
	for(var i = 0; i<keys.length;i++){
		var val = await redis.hgetall(keys[i]);
		val.id = keys[i].substring(keys[i].lastIndexOf(":")+1);
		val.list=[];
		delete val.pass;
		// 获取用户角色
		var userRoles = await redis.smembers("userRoles:" + val.id);
		for(var j = 0;j<userRoles.length;j++){
			var roleName = await redis.get("roles:" + teamId + ":" + userRoles[j]);
			val.list.push({id:userRoles[j],name:roleName});
		}
		result.userList.push(val);
	}
	// 团队角色集合
	keys = await redis.keys("roles:" + teamId + ":*");
	result.roleList = [];
	for(var i = 0 ;i < keys.length;i++){
		var val = {};
		val.id = keys[i].substring(keys[i].lastIndexOf(":")+1);
		val.name = await redis.get(keys[i]);
		result.roleList.push(val);
	}
	ctx.body = result;
});
router.get('/:id', async function (ctx, next) {
	var query = ctx.request.query;
	var id =ctx.params.id;
	ctx.body = {
		id:"checkOK"
	};
});
router.post('/', async function (ctx, next) {
	var body = ctx.request.body;
	var token = body.token; // teamId
	var teamId = token;
	var id = body.id;
	delete body.token;
	await redis.hmset("teamUsers:" + teamId + ":" + id,{name:body.name,pass:"123456"});
	await redis.sadd("userRoles:" + id,body.data);
	await  redis.save();
	ctx.body = {
		id:id
	};
});
router.put('/:id', async function (ctx, next) {
	var body = ctx.request.body;
	var token = ctx.request.body.token; // teamId
	var teamId = token;
	var id =ctx.params.id;
	await redis.hmset("teamUsers:" + teamId + ":" + id,{name:body.name});
	await redis.del("userRoles:"  + id);
	await redis.sadd("userRoles:" + id,body.data);
	await  redis.save();
	ctx.body = {};
});
router.delete('/:id', async function (ctx, next) {
	var token = ctx.request.body.token;
	var teamId = token;
	var id =ctx.params.id;
	await redis.del("teamUsers:" + teamId + ":" + id);
	await redis.del("userRoles:" + id);
	await  redis.save();
	ctx.body = {};
});

module.exports = router;
