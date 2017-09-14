/**
 * Created by center on 17-3-22.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var CMD = require("../middlewares/apiCmd");
var eventPool = require("../utils/eventPoolHelper");

var shortid=require('js-shortid');

router.get('/', async function (ctx, next) {
	var token = ctx.request.query.token;
	var teamId  = token;
	var keys = await redis.keys("teams:*");
	var result = {};
	result.teamList = [];
	var i = 0;
	for(i = 0; i<keys.length;i++){
		var val = {};
		val.text = await redis.hget(keys[i],"teamName");
		val.value = keys[i].substring(keys[i].lastIndexOf(":")+1);
		result.teamList.push(val);
	}
	keys = await redis.keys("devType:*");
	result.devTypeList = [];
	for(i = 0; i<keys.length;i++){
		var val = {};
		val.text = await redis.get(keys[i]);
		val.value = keys[i].substring(keys[i].lastIndexOf(":")+1);
		result.devTypeList.push(val);
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
// 录入设备
router.post('/', async function (ctx, next) {
	var body = ctx.request.body;
	var token = body.token;
	var teamId = body.teamId;
	var id = body.id;
	var typeId = body.type;
	var name = await redis.get("devType:" + typeId);
	await redis.hmset("device:" + id ,{name:name,teamId:teamId,type:typeId,state:0});
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
// 解除mac绑定
router.delete('/mac/:id', async function (ctx, next) {
	var id =ctx.params.id;
	var body = ctx.request.body;
	var gId = body.gId;
	var token = body.token;
	if(!(await redis.sismember("gatewaySensors:" +gId,id))){
		throw new ApiError(ApiError.DEVICE_NON_EXISTENT);
		return;
	}
	redis.pub.publish("control",JSON.stringify({cmd:CMD.RELEASE_BIND_CMD,id:id,gId:gId}));
	var data = await eventPool.operate("macReleaseBind",{gId:gId});
	ctx.body = {
		data:data
	};
});
// mac 绑定
router.post('/mac/:id', async function (ctx, next) {
	var id =ctx.params.id;
	var body = ctx.request.body;
	var gId = body.gId;
	var token = body.token;
	if(!(await redis.sismember("gatewaySensors:" +gId,id))){
		throw new ApiError(ApiError.DEVICE_NON_EXISTENT);
		return;
	}
	var type = await redis.hget("device:" + id,"type");
	redis.pub.publish("control",JSON.stringify({cmd:CMD.BIND_CMD,id:id,gId:gId,type:type}));
	var data = await eventPool.operate("macBind",{gId:gId});
	ctx.body = {
		data:data
	};
});

module.exports = router;

