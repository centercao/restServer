/**
 * Created by center on 17-6-29.
 */
var Mosca = require('mosca');
var SECURE_KEY = __dirname + '/ssl/privatekey.pem';
var SECURE_CERT = __dirname + '/ssl/certificate.pem';
var config = require('./config');
var redis = require('./utils/redisHelper');
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
Buffer.prototype.ToString = function(){
	let len = this.length -1;
	for(let i =len ;i >= 0;i--){
		if(this[i] != 0){
			return this.slice(0,i+1).toString();
		}
	}
};

let server = new Mosca.Server({
	port: config.gPort,
	stats: false,
	http: {port: config.gHttpPort, bundle: true, static: './'},
	https: {
		port: config.gHttpsPort,
		bundle: true,
		static: './'
	},
	secure : {
		port: config.gsPort,
		keyPath: SECURE_KEY,
		certPath: SECURE_CERT,
	},
	allowNonSecure:true
});
// 认证
async function authenticate (client, username, password, callback) {
	if(username){ // app
		var account = await redis.get("token:" + username);
		if(client.id != account){
			return;
		}
	}else{ // gateway
		if(!(await redis.exists("device:" + client.id))) {
			return;
		}
	}
	client.mongo = mongo.getConnect();
	callback(null, true);
}
server.authenticate =authenticate;
server.on('ready', function(){
	console.log('mqtt is running...');
});
server.on('clientConnected', function(client){
	console.log('client connected', client.id);
});
server.on('clientDisconnected', function(client){
	console.log('client disConnected: ' + client.id);
});
server.on('subscribed', function(topic, client){
	console.log('subscribed: clientId: '+client.id +",topic:" + topic);
});

server.on('unSubscribed', function(topic, client){
	console.log('unSubscribed: clientId: '+client.id +",topic" + topic);
})
server.on('published',async function(packet, client) {
	if(client){
		console.log('Published topic:', packet.topic);
		 return;
		var topic = packet.topic.split("/");
		switch (topic[0]){
			case "a":{ // 重要信息
				var cmd = packet.payload.readUInt8(0);
				var info = {};
				switch (cmd){
					case 1: { // 心跳
						await redis.hset("device:" + client.id,"state",1);
					}
						break;
					case 2: { // 报警
						let devId = packet.payload.slice(1,17).ToString();
						await redis.hset("device:" + devId,"state",2);
						info["报警状态"] = 1;
						await client.mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
						
					}
						break;
					case 3: { // 设备上线
						let devId = packet.payload.slice(1,17).ToString();
						var state = await redis.hget("device:" + devId,"state");
						await redis.hset("device:" + devId,"state",Number(state)>=2?2:1); // 在线
						info["设备状态"] = "上线";
						console.log("info:" + JSON.stringify(info));
						await client.mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
					}
						break;
					case 4: { // 设备离线
						let devId = packet.payload.slice(1,17).ToString();
						var state = await redis.hget("device:" + devId,"state");
						await redis.hset("device:" + devId,"state",Number(state)>=2?3:0);
						info["设备状态"] = "离线";
						await client.mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
					}
						break;
					case 5: { // 传感器状态
						let devId = packet.payload.slice(1,17).ToString();
						let state =packet.payload.readUInt8(pos++);
						info["传感器状态"] = state;
						await client.mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
					}
						break;
				}
			}
				break;
			case "i":{ // 一般信息
				var cmd = packet.payload.readUInt8(0);
				var info = {};
				switch (cmd){
					case 20:{ // 电池电量百分比
					}
						break;
				}
			}
				break;
			case "s":{ // 服务器订阅信息
				var buffer = new Buffer("abcdefg");
				var pack = {topic:"abcdr",payload:buffer,qos:0,retain:false};
				server.publish(pack,client,function (err,pac) {
					console.log(err);
				});
			}
				break;
			default:
				break;
		}
	}
});
