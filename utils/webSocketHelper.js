/**
 * Created by dev on 16-10-18.
 */
var io = require('socket.io')();
var redis = require('./redisHelper')
const ApiError = require('../middlewares/ApiError');
/*io.use(function(socket, next) {
	io.sessionMiddleware(socket.request, socket.request.res, next);
});*/
io.on('connection', function(socket) {
	socket.on('disconnect', function(){
		console.log('socket.io User disconnected....');
	});
	socket.on('error', function(){
		console.log('socket.io error....');
	});
	socket.on('login',async function (data) {
        var token = data.token;
        var rData = {};
		rData.status = 200;
		rData.message = "";
		if(!token){
			var error =  new ApiError(ApiError.USER_NOT_LOGIN);
			rData.status = error.number;
			rData.message = error.message;
			socket.emit("loginApply",rData);
			return;
		}
		var account = await redis.get("token:" + token);
		if(!account) {
			var error = new ApiError(ApiError.USER_TOKEN_EXPIRE);
			rData.status = error.number;
			rData.message = error.message;
			socket.emit("loginApply",rData);
			return;
		}
		var gateways = await  redis.smembers("userGate:" + account);// 网管集
		for(var i = 0; i< gateways.length;i++){
			socket.join(gateways[i]);
		}
		gateways = await  redis.smembers("userTrust:" + account);// 网管集
		for(var i = 0; i< gateways.length;i++){
			socket.join(gateways[i]);
		}
		socket.emit("loginApply",rData);
	});
});
var webSocket={
    listen:function (_server) {
        io.listen(_server);
    },
    emit:function (room,message,data) {
        io.in(room).emit(message,data);
    }
};
module.exports  = webSocket;