/**
 * Created by center on 17-3-14.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortid=require('js-shortid');

router.get('/', async function (ctx, next) {
	var token = ctx.request.query.token;
	var keys = await redis.keys("permission:*");
	var result = [];
	for(var i = 0; i<keys.length;i++){
		var val = {};
		val.id = keys[i].substring(keys[i].lastIndexOf(":")+1);
		val.name=await redis.get(keys[i]);
		result.push(val);
	}
	/*var myData={
		permList:[{id:0,name:"创建"},{id:1,name:"修改"}]
	};*/
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
	var param = ctx.request.body;
	var id = shortid.gen();
	await redis.hmset("teamUsers:" + param.adminName,{pass:"123456",teamId:id});
	await redis.hmset("teams:" + id,param);
	await  redis.save();
	ctx.body = {
		id:id
	};
});
router.put('/:id', async function (ctx, next) {
	var body = ctx.request.body;
	var id =ctx.params.id;
	await redis.hmset(id,body);
	ctx.body = {};
});
router.delete('/:id', async function (ctx, next) {
	var id =ctx.params.id;
	await redis.del(id);
	ctx.body = {};
});

module.exports = router;

