/**
 * Created by center on 17-2-24.
 */
/**
 * 在app.use(router)之前调用
 */
var ApiError = require('./ApiError');
const CMD = require('../middlewares/apiCmd');

var response_formatter = async (ctx, next) => {
	
	try {
		//先去执行路由
		await next();
	} catch (error) {
		//如果异常类型是API异常并且通过正则验证的url，将错误信息添加到响应体中返回。
		ctx.request.rervLen = 0;
		if(error instanceof ApiError){ // 自定义的错误（走异常处理）
			ctx.response.status = error.number || 500;
			ctx.response.message = error.message;
		} else {
			ctx.response.status = error.number || 500;
			ctx.response.message = error.message;
		}
		if(ctx.request.cmd == CMD.GATEWAY_REPORT){
			var dataBuffer = new Buffer(3);
			dataBuffer.writeUInt8(ctx.response.cmd,0);
			dataBuffer.writeUInt16BE(ctx.response.status, 1);
			var headBuffer = new Buffer(6);
			var len = dataBuffer.length;
			headBuffer.writeUInt16BE(CMD.G_REPLY_HEAD, 0);
			headBuffer.writeUInt16BE(CMD.SERVER_REPLY, 2);
			headBuffer.writeUInt16BE(len, 4);
			ctx.response.data = Buffer.concat([headBuffer,dataBuffer]);
		}
		// 继续抛，让外层中间件处理日志,包括系统异常
		throw error;
	}
	ctx.response.status = 200;
	if(ctx.request.cmd == CMD.GATEWAY_REPORT){
		
		var headBuffer = new Buffer(6);
		var len = ctx.response.data.length;
		headBuffer.writeUInt16BE(CMD.G_REPLY_HEAD, 0);
		headBuffer.writeUInt16BE(CMD.SERVER_REPLY, 2);
		headBuffer.writeUInt16BE(len, 4);
		// 打造回复数据
		ctx.response.data = Buffer.concat([headBuffer,ctx.response.data]);
	}
};

module.exports = response_formatter;