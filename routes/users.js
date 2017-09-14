/**
 * Created by center on 17-3-24.
 * 'use strict';
 */
var router = require('koa-router')();
const ApiError = require('../middlewares/ApiError');
var redis = require('../utils/redisHelper');
var shortId = require('js-shortid');
var md5 = require("../utils/md5");
var path = require('path');
var fs = require("fs");
var imgPath = path.resolve(__dirname, '..') + "/uploads/"
const multer = require('koa-multer');//加载koa-multer模块
//配置
var storage = multer.diskStorage({
	//文件保存路径
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	},
	//修改文件名称
	filename: function (req, file, cb) {
		var fileFormat = (file.originalname).split(".");
		cb(null,shortId.gen() + "." + fileFormat[fileFormat.length - 1]);
	}
});
//加载配置
var upload = multer({ storage: storage });
const send = require('koa-send');
const TOKEN_TIME = 60 * 1000;
const REFRESH_TOKEN_TIME = 60*60*1000;
var AliMNS = require("ali-mns");
var aliCfg = {
	accountId:"1004084288091550",//阿里主题中Endpoint的ID http(s)://123456789.mns.cn-hangzhou.aliyuncs.com/
	keyId: "LTAIRc2SMLEhIdUZ",//阿里消息服务所用的密钥ID
	keySecret: "6TZT2J0t1xiP0vdGR4NYRWDXF2X6Eq",//阿里消息服务所用的密钥值
	topicName: "sms.topic-cn-hangzhou",//阿里消息服务主题名称
};
function getAttrs(phone,code) {
	return {
		DirectSMS: JSON.stringify(
			{
				FreeSignName:"众信元和",//短信签名
				TemplateCode:"SMS_63405162",//短信模板
				Type:"singleContent",//单发
				Receiver:phone+"",//接收人的手机号
				SmsParams:JSON.stringify({code: code+"",
					product: 'smartHome'}),//短信具体参数: key为短信模板->短信内容的key
			}
		)
	}
}
var account = new AliMNS.Account(aliCfg.accountId, aliCfg.keyId, aliCfg.keySecret);
var mns = new AliMNS.Topic(aliCfg.topicName, account);
// 登录
router.get('/', async function (ctx, next) {
    var query = ctx.request.query;
    if (!query.password || !query.account) {
        throw new ApiError(ApiError.ACCOUNT_PASSWORD_EMPTY);
    }
	if(!query.cId){
		throw new ApiError(ApiError.CID_EMPTY);
		return false;
	}
    var password = await redis.hget("users:" + query.account, "pass");
    if (!password) {
        throw new ApiError(ApiError.USER_NOT_EXIST);
        return false;
    }
    if (md5.hex_md5(query.password) != password) {
        throw new ApiError(ApiError.PASS_ERROR);
        return false;
    }
    var token = shortId.gen();
    await redis.set("token:" + token, query.account);
    await redis.expire("token:" + token,TOKEN_TIME);
    var reToken = shortId.gen();
    await redis.set("reToken:" + reToken, query.account);
    await redis.expire("reToken:" + reToken,REFRESH_TOKEN_TIME);
    var members = await redis.smembers("userGate:" + query.account);
    for(let i =0;i<members.length;i++){
	    await redis.sadd("gateTui:" + members[i],query.cId);
    }
	members = await redis.smembers("userTrust:" + query.account);
	for(let i =0;i<members.length;i++){
		await redis.sadd("gateTui:" + members[i],query.cId);
	}
	var name = await redis.hget("users:" + query.account, "name")||query.account;
    ctx.body = {
        token: token,
        reToken: reToken,
	    name:name
    };
});
// 刷新
router.get('/:id', async function (ctx, next) {
    var reToken = ctx.params.id;
    var account = await redis.get("reToken:" + reToken);
    if (!account) {
        throw new ApiError(ApiError.USER_NOT_LOGIN);
        return false;
    }
    var token = shortId.gen();
    await redis.set("token:" + token, account);
    await redis.expire("token:" + token,TOKEN_TIME);
    var reToken = shortId.gen();
    await redis.set("reToken:" + reToken, account);
    await redis.expire("reToken:" + reToken,REFRESH_TOKEN_TIME);
    ctx.body = {
        token: token,
        reToken: reToken
    };
});
// 注册
router.post('/', async function (ctx, next) {
    let body = ctx.request.body;
    if (!body.account || !body.password) {
        throw new ApiError(ApiError.DATA_IS_EMPTY);
        return false;
    }
    /*// 校验网关
     let keys = await redis.keys("userGate:*");
     let i =0;
     for(i =0;i < keys.length;i++){
     if(await redis.sismember(keys[i],body.gateway)){
     throw new ApiError(ApiError.REPEATED_ADDITION);
     return false;
     }
     }*/
	var code = await redis.get("register:" + body.token);
	if(code == body.code){
		var keys = await redis.keys("users:*");
		for (var i = 0; i < keys.length; i++) {
			let account = await redis.hget(keys[i], "account");
			if (account == body.account) {
				throw new ApiError(ApiError.USER_EXIST);
				return false;
			}
		}
		await redis.hmset("users:" + body.account, {name: "", pass: md5.hex_md5(body.password)});
		// await redis.sadd("userGate:" + body.account,body.gateway);
		await  redis.save();
	} else{
		throw new ApiError(ApiError.CODE_ERROR);
		return false;
	}
    
    ctx.body = {};
});

// 上传头像
router.post('/image/:id',upload.single('file'), async function (ctx, next) {
	// var body = ctx.request.body;
	var token = ctx.params.id;
	if (!token) {
		throw new ApiError(ApiError.TOKEN_EMPTY);
		return false;
	}
	var account = await redis.get("token:" + token);
	if(!account){
		throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
		return false;
	}
	var image = await redis.hget("users:" + account, "image")||"";
	if(image){
		var curPath = imgPath + image;
		if(fs.existsSync(curPath)) {
			fs.unlinkSync(curPath);
		}
	}
	await redis.hset("users:" + account, "image", ctx.req.file.filename);
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
// 下载头像
router.get('/image/:id', async function (ctx, next) {
	var body = ctx.request.body;
	var token = ctx.params.id;
	if (!token) {
		return false;
	}
	var account = await redis.get("token:" + token);
	if(!account){
		throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
		return false;
	}
	var image = await redis.hget("users:" + account,"image")||"";
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
	// var filepath= path.join(__dirname+'/../uploads/',image);
	
	//await send(ctx, "uploads/" + image);
	/*ctx.body = {
	};*/
});

// 获取短信验证码

router.post('/:id', async function (ctx, next) {
	var phone = ctx.params.id;
	if (!phone) {
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var token = shortId.gen();
	var code = parseInt(Math.random()*10000 + 10000,10);
	await redis.set("register:" + token, code);
	await redis.expire("register:" + token,60*2);
	var res = await mns.publishP("ali-mns",true,null,getAttrs(phone,code));
	console.log(res);
	ctx.body = {token:token};
});

// 修改密码
router.put('/:id', async function (ctx, next) {
    var body = ctx.request.body;
    if (!body.oldPass || !body.password) {
        throw new ApiError(ApiError.PASSWORD_EMPTY);
        return false;
    }
    var token = ctx.params.id;
    if (!token) {
        throw new ApiError(ApiError.TOKEN_EMPTY);
        return false;
    }
    var id = await redis.get("token:" + token);
    if(!id){
        throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
        return false;
    }
    var pass = await redis.hget("users:" + id,"pass");
    if (pass != md5.hex_md5(body.oldPass)) {
        throw new ApiError(ApiError.OLD_PASSWORD_ERROR);
        return false;
    }
    await redis.hset("users:" + id, "pass", md5.hex_md5(body.password));
    await  redis.save();
    ctx.body = {};
});
// 修改昵称
router.put('/name/:id', async function (ctx, next) {
	var body = ctx.request.body;
	if (!body.name) {
		throw new ApiError(ApiError.PASSWORD_EMPTY);
		return false;
	}
	var token = ctx.params.id;
	if (!token) {
		throw new ApiError(ApiError.TOKEN_EMPTY);
		return false;
	}
	var id = await redis.get("token:" + token);
	if(!id){
		throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
		return false;
	}
	await redis.hset("users:" + id, "name", body.name);
	await  redis.save();
	ctx.body = {};
});
// 忘记密码
router.put('/forget/:id', async function (ctx, next) {
	var body = ctx.request.body;
	var account = ctx.params.id;
	if (!account) {
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var code = await redis.get("register:" + body.token);
	if(code == body.code){
		await redis.hset("users:" + account, "pass", md5.hex_md5(body.password));
		await  redis.save();
	} else{
		throw new ApiError(ApiError.CODE_ERROR);
		return false;
	}
	
	
	ctx.body = {};
});
// 登出
router.delete('/:id', async function (ctx, next) {
    var body = ctx.request.body;
	var token = ctx.params.id;
	if(!token){
		throw new ApiError(ApiError.USER_NOT_LOGIN);
		return false;
	}
	var account = await redis.get("token:" + token);
	if(!account){
		throw new ApiError(ApiError.USER_TOKEN_EXPIRE);
		return false;
	}
	if(!body.cId){
		throw new ApiError(ApiError.DATA_IS_EMPTY);
		return false;
	}
	var members = await redis.smembers("userGate:" + account);
	for(let i =0;i<members.length;i++){
		await redis.srem("gateTui:" + members[i],body.cId);
	}
	members = await redis.smembers("userTrust:" + account);
	for(let i =0;i<members.length;i++){
		await redis.srem("gateTui:" + members[i],body.cId);
	}
	await redis.del("token:" + token);
    ctx.body = {};
});

module.exports = router;
