/**
 * Created by center on 17-2-24.
 */
/**
 * 在app.use(router)之前调用
 */
var ApiError = require('./ApiError');
var response_formatter = async (ctx, next) => {
	
	try {
		//先去执行路由
		await next();
	} catch (error) {
		//如果异常类型是API异常并且通过正则验证的url，将错误信息添加到响应体中返回。
		if(error instanceof ApiError){ // 自定义的错误（走异常处理）
			ctx.body = {
				status: error.number || ctx.status || 500,
				message: error.message
			}
		} else {
			ctx.body = {
				status:error.number || ctx.status || 500,
				message:error.message
			}
		}
		//继续抛，让外层中间件处理日志,包括系统异常
		throw error;
	}
	if(!ctx.upload){
		if (ctx.body) {
			ctx.body = {
				status: ctx.status,
				message: 'success',
				data: ctx.body
			}
		} else {
			ctx.body = {
				status: ctx.status,
				message: '服务器找不到请求的资源'
			}
		}
	}
};

module.exports = response_formatter;