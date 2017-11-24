const Koa = require('koa');
const app = new Koa();
const cors = require('kcors');
const router = require('koa-router')();
const views = require('koa-views');
// const co = require('co');
const convert = require('koa-convert');
const json = require('koa-json');
// const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
// const logger = require('koa-logger');
const staticPath = require('koa-static');
var log4js = require("./utils/logHelper");
var config = require('./config');
const webSocket = require("./utils/webSocketHelper");
var log_config = require("./utils/log4jsConfig.js");
log4js.configure(log_config);
var logger = log4js.logger("dateFileLog");

const response_formatter = require('./middlewares/response_formatter');
// middlewares
const Mongo = require("./utils/mongodbHelper");
const mongo = new Mongo({
	host: 'localhost',
	port: 27017,
	user: 'data',
	pass: 'root2017',
	db: 'smartHome',
	max: 100,
	min: 1,
});
app.use(convert(cors()));
app.use(convert(bodyparser()));
app.use(convert(json()));
// app.use(convert(logger()));
app.use(convert(staticPath(__dirname + '/public')));

app.use(views(__dirname + '/views', {
	extension: 'ejs'
}));
;// logger
//格式化请求日志
function formatReqLog(req, resTime) {
	var method = req.method;
	//访问方法
	var logText = "request method: " + method + "\n";
	
	//请求原始地址
	logText += "request originalUrl:  " + req.originalUrl + "\n";
	
	//客户端ip
	logText += "request client ip:  " + req.ip + "\n";
	
	//开始时间
	var startTime;
	//请求参数
	if (method === 'GET') {
		logText += "request query:  " + JSON.stringify(req.query) + "\n";
		// startTime = req.query.requestStartTime;
	} else {
		logText += "request body: " + "\n" + JSON.stringify(req.body) + "\n";
		// startTime = req.body.requestStartTime;
	}
	//服务器响应时间
	logText += "response time: " + resTime + "\n";
	
	return logText;
}
//格式化响应日志
function formatRes(ctx, resTime) {
	// 响应日志开始
	var logText = "\n" + "*************** response log start ***************" + "\n";
	
	// 添加请求日志
	logText += formatReqLog(ctx.request, resTime);
	
	// 响应状态码
	logText += "response status: " + ctx.status + "\n";
	
	// 响应内容
	logText += "response body: " + "\n" + JSON.stringify(ctx.body) + "\n";
	
	// 响应日志结束
	logText += "*************** response log end ***************" + "\n";
	
	return logText;
	
}

//格式化错误日志
function formatError(ctx, err, resTime) {
	
	//错误信息开始
	var logText = "\n" + "*************** error log start ***************" + "\n";
	
	//添加请求日志
	logText += formatReqLog(ctx.request, resTime);
	
	//错误名称
	logText += "err name: " + err.name + "\n";
	//错误信息
	logText += "err message: " + err.message + "\n";
	//错误详情
	logText += "err stack: " + err.stack + "\n";
	
	//错误信息结束
	logText += "*************** error log end ***************" + "\n";
	
	return logText;
}

app.use(async(ctx, next) => {
	const start = new Date();
	try{
		await next();
		const ms = new Date() - start;
		console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
		//记录响应日志
		logger.info(formatRes(ctx, ms));
	} catch (error){
		var ms = new Date() - start;
		//错误信息开始
		logger.error(formatError(ctx, error, ms));
	}
	
});

// routes list
// 格式化输出
app.use(response_formatter);
app.use(mongo.use());
const index = require('./routes/index');
const users = require('./routes/users');
const teams = require('./routes/teams');
const roles = require('./routes/roles');
const perm = require('./routes/perm');
const teamUsers = require('./routes/teamUsers');
const device = require('./routes/device');
const teamLogin = require('./routes/teamLogin');
const teamToken = require('./routes/teamToken');
const devInfo = require('./routes/devInfo');
const gateway = require('./routes/gateway');
const find = require('./routes/find');
const scene = require('./routes/scene');
const attribute = require('./routes/attribute');
const video = require('./routes/video');
const knowledge = require('./routes/knowledge');
router.use('/', index.routes(), index.allowedMethods());
router.use('/users', users.routes(), users.allowedMethods());
router.use('/teams', teams.routes(), teams.allowedMethods());
router.use('/roles', roles.routes(), roles.allowedMethods());
router.use('/perm', perm.routes(), perm.allowedMethods());
router.use('/teamUsers', teamUsers.routes(), teamUsers.allowedMethods());
router.use('/device', device.routes(), device.allowedMethods());
router.use('/teamLogin', teamLogin.routes(), teamLogin.allowedMethods());
router.use('/teamToken', teamToken.routes(), teamToken.allowedMethods());
router.use('/devInfo', devInfo.routes(), devInfo.allowedMethods());
router.use('/gateway', gateway.routes(), gateway.allowedMethods());
router.use('/find', find.routes(), find.allowedMethods());
router.use('/scene', scene.routes(), scene.allowedMethods());
router.use('/attribute', attribute.routes(), attribute.allowedMethods());
router.use('/video', video.routes(), video.allowedMethods());
router.use('/knowledge', knowledge.routes(), knowledge.allowedMethods());
app.use(router.routes(), router.allowedMethods());

// response

app.on('error', function (err, ctx) {
	console.log(err);
	logger.error('server error', err, ctx);
});
// var server = app.listen(config.port || '3000');
var http = require('http');
var https = require('https');
var server = http.createServer(app.callback()).listen(config.port || '3000');
// SSL options
var fs = require('fs');
var options = {
	key: fs.readFileSync('./ssl/privatekey.pem'),
	cert: fs.readFileSync('./ssl/certificate.pem')
};
https.createServer(options, app.callback()).listen(1443);

webSocket.listen(server);
// module.exports = app;