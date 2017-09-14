/**
 * Created by center on 17-4-25.
 * 接收API服务器的命令，并向网关发送命令
 */
var redis = require('../utils/redisHelper');
var CMD = require("../middlewares/apiCmd");
const ApiError = require('../middlewares/ApiError');
var cet = null ;
redis.sub.subscribe('control',function (err) { // 反向控制

});
function sendData(ctx,cmd,dataBuffer) {
	var headBuffer = new Buffer(6);
	var len = dataBuffer.length;
	headBuffer.writeUInt16BE(CMD.G_REPLY_HEAD, 0);
	headBuffer.writeUInt16BE(cmd, 2);
	headBuffer.writeUInt16BE(len, 4);
	ctx.send(Buffer.concat([headBuffer,dataBuffer]));
}
redis.sub.on('message', function (channel, message) {
	if(channel == "control"){
		var info = JSON.parse(message);
		switch (info.cmd){
			case CMD.RELEASE_ALARM_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
				var dataBuffer = new Buffer(17);
				dataBuffer.writeUInt8(CMD.SERVER_RELEASE_WARN, 0);
				dataBuffer.write(info.id,1,16);
				sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.cmd = CMD.REPLY_RELEASE_ALARM_CMD;
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					redis.pub.publish("reControl",JSON.stringify(backInfo));
				}
			}
			break;
			case CMD.BIND_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(18);
					dataBuffer.writeUInt8(CMD.MAC_BIND, 0);
					dataBuffer.write(info.id,1,16);
					dataBuffer.writeUInt8(Number(info.type), 17);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("replyBindMac",JSON.stringify(backInfo));
				}
			}
				break;
			case CMD.RELEASE_BIND_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(17);
					dataBuffer.writeUInt8(CMD.SERVER_RELEASE_BIND, 0);
					dataBuffer.write(info.id,1,16);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("replyReleaseBindMac",JSON.stringify(backInfo));
				}
			}
			break;
			case CMD.SCENE_SET_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(8);
					dataBuffer.writeUInt8(CMD.SERVER_SCENE_SET, 0);
					dataBuffer.writeUInt8(info.type,1);
					var startTime = info.startTime.split(":");
					dataBuffer.writeUInt8(Number(startTime[0]),2);
					dataBuffer.writeUInt8(Number(startTime[1]),3);
					dataBuffer.writeUInt8(Number(startTime[2]),4);
					var endTime = info.endTime.split(":");
					dataBuffer.writeUInt8(Number(endTime[0]),5);
					dataBuffer.writeUInt8(Number(endTime[1]),6);
					dataBuffer.writeUInt8(Number(endTime[2]),7);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("reControl",JSON.stringify(backInfo));
				}
			}
				break;
			case CMD.ATT_READ_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(19);
					dataBuffer.writeUInt8(CMD.SERVER_READ_ATT, 0);
					dataBuffer.write(info.id,1,16);
					dataBuffer.writeUInt8(1,17);
					dataBuffer.writeUInt8(info.type,18);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("reControl",JSON.stringify(backInfo));
				}
			}
				break;
			case CMD.ATT_SET_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(20);
					dataBuffer.writeUInt8(CMD.SERVER_SET_ATT, 0);
					dataBuffer.write(info.id,1,16);
					dataBuffer.writeUInt8(1,17);
					dataBuffer.writeUInt8(info.type,18);
					dataBuffer.writeUInt8(info.att,19);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("reControl",JSON.stringify(backInfo));
				}
			}
				break;
			case CMD.ZIGBEE_READ_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(3);
					dataBuffer.writeUInt8(CMD.SERVER_READ_ZIGBEE, 0);
					dataBuffer.writeUInt8(1,1);
					dataBuffer.writeUInt8(info.type,2);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("reControl",JSON.stringify(backInfo));
				}
			}
				break;
			case CMD.ZIGBEE_SET_CMD :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(4);
					dataBuffer.writeUInt8(CMD.SERVER_SET_ZIGBEE, 0);
					dataBuffer.writeUInt8(1,1);
					dataBuffer.writeUInt8(info.type,2);
					dataBuffer.writeUInt8(info.att,3);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("reControl",JSON.stringify(backInfo));
				}
			}
				break;
			
			case CMD.DEVICE_ENABLE :{
				var ctx = cet.getContext(info.gId);
				if(ctx){
					var dataBuffer = new Buffer(18);
					dataBuffer.writeUInt8(CMD.SERVER_SEND_DEVENABLE, 0);
					dataBuffer.write(info.id,1,16);
					dataBuffer.writeUInt8(info.enable, 17);
					sendData(ctx,CMD.SERVER_DOWN,dataBuffer);
				}else{
					var backInfo = {};
					backInfo.status = (new ApiError(ApiError.NOT_REGISTER)).number;
					backInfo.gid = info.id;
					backInfo.id = 0;
					redis.pub.publish("devEnable",JSON.stringify(backInfo));
				}
			}
				break;
			default:
				break;
			
		}
	}
});
module.exports = function (app) {
	cet = app;
};