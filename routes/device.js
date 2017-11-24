/**
 * Created by center on 17-3-22.
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var CMD = require("../middlewares/apiCmd");
var eventPool = require("../utils/eventPoolHelper");

var shortId=require('js-shortid');

var path = require('path');
var fs = require("fs");
var imgPath = path.resolve(__dirname, '..') + "/public/";
const multer = require('koa-multer');//加载koa-multer模块
//配置
var storage = multer.diskStorage({
	//文件保存路径
	destination: function (req, file, cb) {
		cb(null, 'public/images/')
	},
	//修改文件名称
	filename: function (req, file, cb) {
		var fileFormat = (file.originalname).split(".");
		cb(null,shortId.gen() + "." + fileFormat[fileFormat.length - 1]);
	}
});
//加载配置
var upload = multer({ storage: storage });

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
	if(data.res == 200){
		redis.hset("device:" + id,"state",0);
	}
	ctx.body = data;
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
// 上传图像 id=deviceId
router.post('/image/:id',upload.single('file'), async function (ctx, next) {
	// var body = ctx.request.body;
	var deviceId = ctx.params.id;
	if (!deviceId) {
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var image = await redis.hget("device:" + deviceId, "image")||"";
	if(image){
		var curPath = imgPath + image;
		if(fs.existsSync(curPath)) {
			fs.unlinkSync(curPath);
		}
	}
	await redis.hset("device:" + deviceId, "image", "images/" + ctx.req.file.filename);
	await  redis.save();
	ctx.body = {
		filename: ctx.req.file.filename //返回文件名
	};
});
function  readData(path){
	return new Promise(function(resolve,reject){
		fs.readFile(path,function(err,data){
			if(err){
				reject(err);//文件存在返回true
			}else{
				resolve(data);//文件不存在，这里会抛出异常
			}
		});
	}).then(function(data){
		console.log(data);
		return data;
	},function(err){
		console.log(err);
		return err;
	});
}
// 下载像 id=deviceId
router.get('/image/:id', async function (ctx, next) {
	var body = ctx.request.body;
	var deviceId = ctx.params.id;
	if (!deviceId) {
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var image = await redis.hget("device:" + deviceId,"image")||"";
	if(!image){
		throw new ApiError(ApiError.USER_NOT_IMAGE);
		return false;
	}
	if(image){
		var curPath = imgPath + image;
		if(fs.existsSync(curPath)) {
			// ctx.upload = "image";
			var info =await readData(imgPath + image);
			ctx.body=info.toString("base64");
		}else{
			throw new ApiError(ApiError.USER_NOT_IMAGE);
			return false;
		}
	} else {
		throw new ApiError(ApiError.USER_NOT_IMAGE);
		return false;
	}
});
module.exports = router;

