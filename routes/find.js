/**
 * Created by center on 17-5-9.
 */
/**
 * Created by root on 17-3-24.
 */
Date.prototype.format = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份
		"d+": this.getDate(), //日
		"h+": this.getHours(), //小时
		"m+": this.getMinutes(), //分
		"s+": this.getSeconds(), //秒
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度
		"S": this.getMilliseconds() //毫秒
	};
	if(/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var MongoDb = require("../utils/mongodbHelper");
var mongoDb = new MongoDb();

// 获取设备
router.get('/', async function (ctx, next) {
	var query = ctx.request.query;
	var devId =ctx.params.id;
	var current = query.current;
	var pageSize = query.pageSize;
	if(!devId || !current || !pageSize){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var result = await mongoDb.find("findInfo",current,pageSize);
	ctx.body = result;
});
// 获取设备的历史信息
router.get('/:id', async function (ctx, next) {
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
	var devId =ctx.params.id;
	var current = query.current;
	var pageSize = query.pageSize;
	if(!devId || !current || !pageSize){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var result = await mongoDb.find("devInfo",{devId: devId},current,pageSize);
	for(var i =0 ;i<result.length;i++){
		result[i].startDate = result[i].startDate.format("yyyy-MM-dd hh:mm:ss");
		if(result[i].endDate){
			result[i].endDate = result[i].endDate.format("yyyy-MM-dd hh:mm:ss");
		}
		delete result[i]._id;
		delete result[i].devId;
	}
	ctx.body = result;
});
// 注册
router.post('/', async function (ctx, next) {
	let body = ctx.request.body;
	ctx.body = {
	};
});
// 处理报警
router.put('/:id', async function (ctx, next) {
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
	var id = body.id;
	var gId = body.gId;
	var dealType = body.dealType;
	if(!id || !gId || !dealType ){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var result = await mongoDb.update("devInfo",{devId: id,endDate: {$exists: false}},{$set:{dealType:dealType,endDate:new Date()}} , {multi:true});
	if(result.result.ok  != 1){
		throw new ApiError(ApiError.ALARM_DEAL_FAIL);
		return false;
	}
	socketIo.emit(gId,"dealAlarm",{id:id,dealType:dealType});
	ctx.body = {
	};
});
router.delete('/:id', async function (ctx, next) {
	var body = ctx.request.body;
	
	ctx.body = {};
});
// 接收网管服务器发送来的信息
redis.sub.subscribe('alert','heart', 'offLine','onLine','reControl',function (err) {

});

module.exports = router;
