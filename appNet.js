/**
 * Created by Center on 2017/4/1.
 */
let Cet = require("cet");
let routes = require("./routes/business");
let app = new Cet();
const checkData = require("./utils/checkData");
var log4js = require("./utils/logHelper");
var config = require('./config');
var log_config = require("./utils/log4jsNetConfig");
log4js.configure(log_config);
var logger = log4js.logger("netFileLog");
const response_formatter = require('./middlewares/net_response_formatter');
const CMD = require('./middlewares/apiCmd');
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
function formatReqLog(req, resTime) {
	var method = req.method;
	//访问方法
	var logText = "request method: " + method + "\n";
	//请求url
	logText += "request originalUrl:  " +  req.originalUrl + "\n";
	// 请求命令
	logText += "request cmd:  " +  new CMD(req.originalUrl).message + "\n";
	//客户端ip
	logText += "request client ip:  " + req.ip + "\n";
	//开始时间
	//请求参数
	logText += "request body: " + "\n" + JSON.stringify(req.body) + "\n";
	//服务器请求时间
	logText += "response time: " + resTime + "\n";
	return logText;
}
//格式化日志
function formatRes(ctx, resTime) {
	// 请求日志开始
	var logText = "\n" + "*************** response log start ***************" + "\n";
	// 添加请求日志
	logText += formatReqLog(ctx.request, resTime);
	// 响应状态码
	logText += "response status: " + ctx.status + "\n";
	// 响应内容
	logText += "response body: " + "\n" + JSON.stringify(ctx.body) + "\n";
	// 日志结束
	logText += "*************** response log end ***************" + "\n";
	return logText;
}
//格式化错误日志
function formatError(ctx, err, resTime) {
	// 信息开始
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
// 日志信息
app.use(async function (ctx,next) {
	const start = new Date();
	try{
		await next();
		if(ctx.data){
			const ms = new Date() - start;
			//记录请求日志
			logger.info(formatRes(ctx, ms));
		}
	}catch (error){
		const ms = new Date() - start;
		//错误信息开始
		logger.error(formatError(ctx, error, ms));
	}
});
// 数据完整性分析
app.use(checkData());
// routes
// 格式化输出
app.use(response_formatter);
app.use(mongo.use());
// 业务处理
app.use(routes.route());
// others
app.use(async function (ctx,next) {
	console.log("not found!");
});
//
app.createServer(config.netPort);

var Control = require('./routes/control');
new Control(app);
