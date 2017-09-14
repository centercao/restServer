/**
 * Created by center on 17-3-14.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortid=require('js-shortid');

router.get('/', async function (ctx, next) {
	var token = ctx.request.query.token;
	var teamId = token;
	var keys = await redis.keys("roles:*");
	var result = {};
	result.rolesList = [];
	for(var i = 0; i<keys.length;i++){
		var val = {};
		val.name = await redis.get(keys[i]);
		val.id = keys[i].substring(keys[i].lastIndexOf(":")+1);
		val.obj=[];
		var rolePerms = await redis.smembers("rolePerms:" + val.id);
		for(var j = 0;j<rolePerms.length;j++){
			var permName = await redis.get("perms:" + rolePerms[j]);
			val.obj.push({id:rolePerms[j],name:permName});
		}
		result.rolesList.push(val);
	}
	// 团队权限
	keys = await redis.smembers("teamPerms:" + teamId);
	result.perms = [];
	for(var i = 0 ;i< keys.length;i++){
		var val = {};
		val.id = keys[i];
		val.name = await redis.get("perms:" + val.id );
		result.perms.push(val);
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
	var token = ctx.request.body.token; // teamId
	var teamId = token;
	var body = ctx.request.body;
	var id = shortid.gen();
	delete body.token;
	await redis.set("roles:" + teamId + ":" + id,body.name);
	await redis.sadd("rolePerms:" + id,body.data);
	await  redis.save();
	ctx.body = {
		id:id
	};
});
router.put('/:id', async function (ctx, next) {
	var body = ctx.request.body;
	var token = body.token;
	var teamId = token;
	var id =ctx.params.id;
	await redis.set("roles:" + teamId + ":" + id,body.name);
	await redis.del("rolePerms:" + id);
	await redis.sadd("rolePerms:" + id,body.data);
	await  redis.save();
	ctx.body = {};
});
router.delete('/:id', async function (ctx, next) {
	var token = ctx.request.body.token;
	var teamId = token;
	var id =ctx.params.id;
	await redis.del("roles:" + teamId + ":" + id);
	await redis.del("rolePerms:"  + ":" + id);
	ctx.body = {};
});

module.exports = router;
