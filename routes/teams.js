/**
 * Created by center on 17-3-9.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortid = require('js-shortid');
const TEAM_MANAGEMENT = "vSSe1zd9z0"; // 团队管理
async function checkToken(token, permission) {
	if(!token){
		throw new ApiError(ApiError.USER_NOT_LOGIN);
		return false;
	}
	// 获取redis里面的token
	var listStr = await redis.get("token:" + token);
	if(!listStr){
		throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
		return false;
	}
	// 验证权限
	var list = listStr.split(":");
	var userId = list[1];
	var roleList = await redis.smembers("userRoles:" + userId);
	for(var i = 0; i<roleList.length;i++){
		if(await redis.sismember("rolePerms:" + roleList[i], permission) == 1){
			return true;
		}
	}
	throw new ApiError(ApiError.USER_NOT_PERM);
	return false;
}
router.get('/',  async function (ctx, next) { //
	var query = ctx.request.query;
	var token = query.token;
	if(! await checkToken(token,TEAM_MANAGEMENT))
	{
		return false;
	}
	// 加载数据
	var keys = await redis.keys("teams:*");
	var result = {};
	result.teamList = [];
	for (var i = 0; i < keys.length; i++) {
		var val = await redis.hgetall(keys[i]);
		val.id = keys[i].substring(keys[i].lastIndexOf(":")+1);
		val.teamPerms = [];
		var perms = await redis.smembers("teamPerms:" + val.id);
		for(var j = 0;j <perms.length;j++){
			var perm = {id:perms[j],name:await redis.get("perms:" + perms[j])};
			val.teamPerms.push(perm);
		}
		result.teamList.push(val);
	}
	keys = await redis.keys("perms:*");
	result.permList = [];
	for(var i = 0 ;i< keys.length;i++){
		var val = {};
		val.id = keys[i].substring(keys[i].lastIndexOf(":")+1);;
		val.name = await redis.get("perms:" + val.id );
		result.permList.push(val);
	}
	ctx.body = result;
});
router.get('/:id', async function (ctx, next) {
	var query = ctx.request.query;
	var id = ctx.params.id;
	ctx.body = {
		id: "checkOK"
	};
});
router.post('/', async function (ctx, next) {
	var body = ctx.request.body;
    const token = body.token;
    if(! await checkToken(token,TEAM_MANAGEMENT))
    {
        return false;
    }
	var id = shortid.gen();
	await redis.hmset("teamUsers:" + id + ":" + body.adminAccount, {pass: "123456", name: "admin"});
    await redis.sadd("teamPerms:" + id,body.teamPerms);
    delete body.teamPerms;
	await redis.hmset("teams:" + id, body);
	await  redis.save();
	ctx.body = {
		id: id
	};
});
router.put('/:id', async function (ctx, next) {
	var body = ctx.request.body;
	const token = body.token;
	if(! await checkToken(token,TEAM_MANAGEMENT))
	{
		return false;
	}
	var id = ctx.params.id;
	await redis.hmset("teams:" + id, body);
	await redis.del("teamPerms:" + id);
	await redis.sadd("teamPerms:" + id,body.permList);
	await  redis.save();
	ctx.body = {};
});
router.delete('/:id', async function (ctx, next) {
	var id = ctx.params.id;
    var body = ctx.request.body;
    const token = body.token;
    if(! await checkToken(token,TEAM_MANAGEMENT))
    {
        return false;
    }
	await redis.del("teams:" + id);
	var keys = await redis.keys("teamUsers:" + id + ":*");
	for(var i = 0;i<keys.length;i++){
        await redis.del(keys[i]);
	}
	await  redis.save();
	ctx.body = {};
});
module.exports = router;