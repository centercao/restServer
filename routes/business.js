/**
 * Created by Center on 2017/4/1.
 */
const routes = require("cet-router");
const CMD = require('../middlewares/apiCmd');
var redis = require('../utils/redisHelper');
const ApiError = require('../middlewares/ApiError');
var config = require('../config');
var mqtt = require('mqtt');
// getui
/*var Tran  = require("tran");
var tran = new Tran();*/
/*var Tran  = require("tui-helper");
var tran = new Tran({
	appId: 'eECHDNfs5Z680lzQMEHCt6',
	appKey: 'CcArSfD8IrA7l8diZDxw46',
	masterSecret: 'VDLFyCWoyd9onOrmCP4m78',
	title: "智能家居信息"
});*/
Buffer.prototype.ToString = function(){
	let len = this.length -1;
	for(let i =len ;i >= 0;i--){
		if(this[i] != 0){
			return this.slice(0,i+1).toString();
		}
	}
};
// 网关主动上报
routes.use(CMD.GATEWAY_REPORT,async function (ctx,next) {
	// 响应
	console.log("开始处理网关网关上报信息...");
	var type =ctx.request.data.readUInt8(0);
	switch (type) {
		case CMD.GATEWAY_HEART: {
			ctx.response.cmd = CMD.SERVER_REPLY_HEART;
			if(!ctx.request.clientId){ // 未注册
				throw new ApiError(ApiError.NOT_REGISTER);
			}
			await redis.hset("device:" + ctx.request.clientId,"state",1);
			await redis.hset("device:" + ctx.request.clientId,"on",(new Date()).getTime());
			ctx.response.data = new Buffer(3);
			ctx.response.data.writeUInt8(CMD.SERVER_REPLY_HEART);
			ctx.response.data.writeUInt16BE(200,1);
			var buffer = new Buffer(1);
			buffer.writeUInt8(1,0);
			ctx.mqttClient.publish('a/' + ctx.request.clientId, buffer);
		}
			break;
		case CMD.GATEWAY_REGISTER: {
			ctx.response.cmd = CMD.SERVER_REPLY_REGISTER;
			ctx.request.clientId = ctx.request.data.slice(1,17).ToString();
			if((await redis.exists("device:" + ctx.request.clientId))){
				console.log("gatewayId:" + ctx.request.clientId);
				await redis.hset("device:" + ctx.request.clientId,"state",1);
				ctx.cet.register(ctx);
				ctx.response.data = new Buffer(3);
				ctx.response.data.writeUInt8(CMD.SERVER_REPLY_REGISTER);
				ctx.response.data.writeUInt16BE(200,1);
				if(!ctx.mqttClient) {
					var options = {
						host: "127.0.0.1",
						port: 8243,
						rejectUnauthorized: false,
						clientId: ctx.request.clientId,
						keepalive: 10,
						clean: false,
					};
					ctx.mqttClient = mqtt.connect('mqtts://' + options.host, options);
				}
				/*ctx.mqttClient.subscribe("set/" + ctx.request.clientId,{qos:0});
				ctx.mqttClient.subscribe("bk/" + ctx.request.clientId,{qos:0});
				client.on('message', function(topic, message) {
					switch (topic){
						case "set/" + ctx.request.clientId:{
							let cmd = message.readUint8(0);
							switch (cmd){
								case 100:{ // 解除报警
								}
									break;
								case 101:{ // 解除绑定
								}
									break;
								case 102:{ // 场景设置
								}
									break;
								case 103:{ // 设置传感器阈值
								}
									break;
								case 104:{ // 查询传感器阈值
								}
									break;
								case 105:{ // 设置网络开放时间
								}
									break;
								case 106:{ // 查询网络开放时间
								}
									break;
								default:
									break;
							}
						}
							break;
						case "bk/" + ctx.request.clientId:{
						}
							break;
						default:
							break;
					}
				});*/
			} else{
				ctx.request.clientId = 0;
				throw new ApiError(ApiError.REGISTER_FAIL);
			}
			
		}
			break;
		case CMD.GATEWAY_MAC_LIST: {
			ctx.response.cmd = CMD.SERVER_REPLY_LIST;
			if(!ctx.request.clientId){ // 未注册
				throw new ApiError(ApiError.NOT_REGISTER);
			}
			let devices = await redis.smembers("gatewaySensors:" + ctx.request.clientId);
			ctx.response.data = new Buffer(devices.length * 24 + 4);
			ctx.response.data.fill(0);
			ctx.response.data.writeUInt8(CMD.SERVER_REPLY_LIST,0);
			ctx.response.data.writeUInt16BE(200,1);
			ctx.response.data.writeUInt8(devices.length,3);
			if(devices.length > 0){
				let offset = 4;
				for(let i = 0; i< devices.length; i++){
					let mac = await redis.hget("device:" + devices[i],"mac")||"";
					ctx.response.data.write(devices[i],offset,16);
					offset += 16;
					ctx.response.data.write(mac,offset,8,'base64');
					offset += 8;
				}
			}
		}
			break;
		case CMD.GATEWAY_MAC_BIND: {
			ctx.response.cmd = CMD.SERVER_REPLY_MAC;
			if(!ctx.request.clientId){ // 未注册
				throw new ApiError(ApiError.NOT_REGISTER);
			}
			var devId = ctx.request.data.slice(1,17).ToString();
			ctx.response.id = devId;
			if(!(await redis.exists("device:" + devId))){
				throw new ApiError(ApiError.DEVICE_NON_EXISTENT);
			}
			var mac = ctx.request.data.toString('base64',16,24);
			await redis.hset("device:" + devId,"mac",mac);
			await  redis.save();
			ctx.response.data = new Buffer(3);
			ctx.response.data.writeUInt8(CMD.SERVER_REPLY_MAC);
			ctx.response.data.writeUInt16BE(200,1);
		}
			break;
		case CMD.DEVICE_ONLINE: {
			ctx.response.cmd = CMD.SERVER_REPLY_ONLINE;
			if(!ctx.request.clientId){ // 未注册
				throw new ApiError(ApiError.NOT_REGISTER);
			}
			var devId = ctx.request.data.slice(1,17).ToString();
			if((await redis.exists("device:" + devId))){
				console.log("devId:" + devId);
				redis.pub.publish("onLine",JSON.stringify({devId:devId,gId:ctx.request.clientId}));
				var state = await redis.hget("device:" + devId,"state");
				await redis.hset("device:" + devId,"state",Number(state)>=2?2:1); // 在线
				var info = {
					"line":1 //上线
				};
				console.log("info:" + JSON.stringify(info));
				await ctx.mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
				ctx.response.data = new Buffer(3);
				ctx.response.data.writeUInt8(CMD.SERVER_REPLY_ONLINE);
				ctx.response.data.writeUInt16BE(200,1);
				var buffer = new Buffer(17);
				buffer.writeUInt8(3,0);
				buffer.write(devId,1,16);
				ctx.mqttClient.publish('a/' + ctx.request.clientId, buffer);
				var cIds = await redis.smembers("gateTui:" + ctx.request.clientId);
				for(let i =0;i<cIds.length;i++){
					//tran.sendMessage("上线",{cmd: "onLine", data: {id: devId}},cIds[i]);
				}
			}else{
				throw new ApiError(ApiError.DEVICE_NON_EXISTENT);
			}
		}
			break;
		case CMD.DEVICE_OFFLINE: {
			ctx.response.cmd = CMD.SERVER_REPLY_OFFLINE;
			if(!ctx.request.clientId){ // 未注册
				throw new ApiError(ApiError.NOT_REGISTER);
			}
			var devId = ctx.request.data.slice(1,17).ToString();
			if((await redis.exists("device:" + devId))){
				console.log("devId:" + devId);
				redis.pub.publish("offLine",JSON.stringify({devId:devId,gId:ctx.request.clientId}));
				var state = await redis.hget("device:" + devId,"state");
				await redis.hset("device:" + devId,"state",Number(state)>=2?3:0); // 在线
				var info = {
					"line":0 //"离线"
				};
				console.log("info:" + JSON.stringify(info));
				await ctx.mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
				ctx.response.data = new Buffer(3);
				ctx.response.data.writeUInt8(CMD.SERVER_REPLY_OFFLINE);
				ctx.response.data.writeUInt16BE(200,1);
				
				var buffer = new Buffer(17);
				buffer.writeUInt8(4,0);
				buffer.write(devId,1,16);
				ctx.mqttClient.publish('a/' + ctx.request.clientId, buffer);
				var cIds = await redis.smembers("gateTui:" + ctx.request.clientId);
				for(let i =0;i<cIds.length;i++){
					//tran.sendMessage("离线",{cmd: "offLine", data: {id: devId}},cIds[i]);
				}
			}else{
				throw new ApiError(ApiError.DEVICE_NON_EXISTENT);
			}
		}
			break;
		case CMD.DEVICE_REPORT_ATT: {
			ctx.response.cmd = CMD.SERVER_REPLY_ATT;
			if(!ctx.request.clientId){ // 未注册
				throw new ApiError(ApiError.NOT_REGISTER);
			}
			var devId = ctx.request.data.slice(1,17).ToString();
			if((await redis.exists("device:" + devId))){
				console.log("devId:" + devId);
				var num = ctx.request.data.readUInt8(17);
				let pos = 18;
				var info = {};
				for(let i = 0;i<num;i++){
					let type = ctx.request.data.readUInt8(pos++);
					switch (type){
						case 0:{ // 报警
							let alarm = ctx.request.data.readUInt8(pos++);
							info["alarm"] = alarm;
							if(alarm == 1){
								redis.pub.publish("alert",JSON.stringify({devId:devId,gId:ctx.request.clientId}));
							}
							await redis.hset("device:" + devId,"state",alarm?2:1); // 在线
							var buffer = new Buffer(17);
							buffer.writeUInt8(2,0);
							buffer.write(devId,1,16);
							ctx.mqttClient.publish('a/' + ctx.request.clientId, buffer);
							var cIds = await redis.smembers("gateTui:" + ctx.request.clientId);
							for(let i =0;i<cIds.length;i++){
								//tran.sendMessage("报警",{cmd: "alarm", data: {id:devId}},cIds[i]);
							}
						}
							break;
						case 1:{ // 电池电量百分比
							let val = ctx.request.data.readUInt8(pos++);
							info["battery"] = val + "%"; // 电量百分比
							var buffer = new Buffer(18);
							buffer.writeUInt8(20,0);
							buffer.write(devId,1,16);
							buffer.writeUInt8(val,17);
							ctx.mqttClient.publish('i/' + ctx.request.clientId, buffer);
							var cIds = await redis.smembers("gateTui:" + ctx.request.clientId);
							for(let i =0;i<cIds.length;i++){
								//tran.sendMessage("信息",{cmd: "battery", data: {id:devId,val:val + "%"}},cIds[i]);
							}
						}
							break;
						case 2:{ // 电池电量状态提示
							let state = ctx.request.data.readUInt8(pos++);
							info["batteryState"] = state; // 电池电量状态
							var buffer = new Buffer(18);
							buffer.writeUInt8(21,0);
							buffer.write(devId,1,16);
							buffer.writeUInt8(state,17);
							ctx.mqttClient.publish('i/' + ctx.request.clientId, buffer);
							var cIds = await redis.smembers("gateTui:" + ctx.request.clientId);
							for(let i =0;i<cIds.length;i++){
								// tran.sendMessage("信息",{cmd: "batteryState", data: {id:devId,state:state}},cIds[i]);
							}
						}
							break;
						case 3:{ // 传感器状态
							let state = ctx.request.data.readUInt8(pos++);
							redis.pub.publish("state", JSON.stringify({
								devId: devId, gId: ctx.request.clientId, state: state, type: 7
							}));
							info["state"] = state;
							
							var buffer = new Buffer(18);
							buffer.writeUInt8(5,0);
							buffer.write(devId,1,16);
							buffer.writeUInt8(state,17);
							ctx.mqttClient.publish('a/' + ctx.request.clientId, buffer);
							var cIds = await redis.smembers("gateTui:" + ctx.request.clientId);
							for(let i =0;i<cIds.length;i++){
								// tran.sendMessage("状态",{cmd: "state", data: {id: devId,state:state,type:7}},cIds[i]);
							}
						}
							break;
						case 4:{ // 传感器模拟值
							let val = ctx.request.data.readUInt16BE(pos++);
							pos++;
							info["value"] = val
							var buffer = new Buffer(20);
							buffer.writeUInt8(22,0);
							buffer.write(devId,1,16);
							buffer.writeUInt16BE(val,17);
							ctx.mqttClient.publish('i/' + ctx.request.clientId, buffer);
							var cIds = await redis.smembers("gateTui:" + ctx.request.clientId);
							for(let i =0;i<cIds.length;i++){
								// tran.sendMessage("信息",{cmd: "value", data: {id:devId,value:val}},cIds[i]);
							}
							
						}
							break;
						default:
							break;
					}
					console.log("info:" + JSON.stringify(info));
					await ctx.mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
				}
				ctx.response.data = new Buffer(3);
				ctx.response.data.writeUInt8(CMD.SERVER_REPLY_ATT);
				ctx.response.data.writeUInt16BE(200,1);
			}else{
				throw new ApiError(ApiError.DEVICE_NON_EXISTENT);
			}
		}
			break;
		case CMD.GATEWAY_TIME: {
			ctx.response.cmd = CMD.SERVER_REPLY_TIME;
			if(!ctx.request.clientId){ // 未注册
				throw new ApiError(ApiError.NOT_REGISTER);
			}
			ctx.response.data = new Buffer(10);
			ctx.response.data.writeUInt8(CMD.SERVER_REPLY_TIME);
			ctx.response.data.writeUInt16BE(200,1);
			var time = new Date();
			ctx.response.data.writeUInt16BE(time.getFullYear(),3);
			ctx.response.data.writeUInt8(time.getMonth()+1,5);
			ctx.response.data.writeUInt8(time.getDate(),6);
			ctx.response.data.writeUInt8(time.getHours(),7);
			ctx.response.data.writeUInt8(time.getMinutes(),8);
			ctx.response.data.writeUInt8(time.getSeconds(),9);
			
		}
			break;
		default:
			break;
	}
});

// 网关应答Server
routes.use(CMD.GATEWAY_REPLY,async function (ctx,next) {
	// 响应
	if(!ctx.request.clientId){ // 未注册
		throw new ApiError(ApiError.NOT_REGISTER);
	}
	var type =ctx.request.data.readUInt8(0);
	var res = ctx.request.data.readUInt16BE(1);
	switch (type){
		case CMD.GATEWAY_WARN_REPLY: // 解除报警回复
		{
			var devId = ctx.request.data.slice(3,19).ToString();
			redis.pub.publish("replyAlarmRelease",JSON.stringify({gId:ctx.request.clientId,id:devId,status:res}));
		}
			break;
		case CMD.GATEWAY_BIND_REPLY: // 解除绑定回复
		{
			var devId = ctx.request.data.slice(3,19).ToString();
			redis.pub.publish("replyBindMac",JSON.stringify({gId:ctx.request.clientId,id:devId,res:res}));
		}
			break;
		case CMD.GATEWAY_SCENE_REPLY: // 场景设置回复
		{
			redis.pub.publish("replySceneSetting",JSON.stringify({gId:ctx.request.clientId,res:res}));
		}
			break;
		case CMD.GATEWAY_ATTREAD_REPLY: // 属性read回复
		{
			var id = ctx.request.data.slice(1,17).ToString();
			var num = ctx.request.data.readUInt8(17);
			var numType = ctx.request.data.readUInt8(18);
			var att = ctx.request.data.readUInt8(19);
			redis.pub.publish("attRead",JSON.stringify({gId:ctx.request.clientId,res:res,id:id,att:att}));
		}
			break;
		case CMD.GATEWAY_ATTSET_REPLY: // 属性设置回复
		{
			var id = ctx.request.data.slice(3,19).ToString();
			redis.pub.publish("attSetting",JSON.stringify({gId:ctx.request.clientId,res:res,id:id}));
		}
			break;
		case CMD.GATEWAY_ZIGREAD_REPLY: // zigbee 读取回复
		{
			var numType = ctx.request.data.readUInt8(3);
			var att = ctx.request.data.readUInt8(4);
			redis.pub.publish("zigRead",JSON.stringify({gId:ctx.request.clientId,res:res,att:att}));
		}
			break;
		case CMD.GATEWAY_ZIGSET_REPLY: // zigbee设置回复
		{
			redis.pub.publish("zigSetting",JSON.stringify({gId:ctx.request.clientId,res:res}));
		}
			break;
		case CMD.MAC_BIND: // zigbee设置回复
		{
			redis.pub.publish("replyBindMac",JSON.stringify({gId:ctx.request.clientId,res:res}));
		}
			break;
		case CMD.GATEWAY_ENABLE_REPLY: // zigbee设置回复
		{
			let id = ctx.request.data.slice(2,18).ToString();
			redis.pub.publish("devEnable",JSON.stringify({gId:ctx.request.clientId,res:res,id:id}));
		}
			break;
		default:
			break;
	}
});

module.exports = routes;