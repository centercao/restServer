/**
 * Created by dev on 16-7-12.
 */
var io = require('../utils/webSocketHelper');
var redis = require('../utils/redisHelper').redis;
var config = require("../config");

// 订阅
redis.subscribe('alert','heart', 'offLine','onLine');
// receive message
redis.on('message',async function (channel, message) {
	var info = JSON.parse(message);
	switch (channel){
		case 'alert':{
            io.emit(info.gId,"chat message",
                {cmd:"alarm",data:{id:info.id}});
            redis.hset("device:" + info.id,"state",2); // 报警
        }
			break;
		case 'heart':{
            io.emit(info.gId, "chat message",
                {cmd:"heart",data:{id:info.id}});
            redis.hset("device:" + info.id,"state",1); // 上线
        }
			break;
		case 'offLine':{
            var info = message.split(":");
            io.emit(info.gId,,"chat message",
                {cmd:"offLine",data:{id:info.id}});
            redis.hset("device:" + info.id,"state",0);
        }
			break;
		case 'onLine':{
            io.emit(info.gId, "chat message",
                {cmd:"onLine",data:{id:info.id}});
            redis.hset("device:" + info.id,"state",1); // 在线
        }
			break;
		default:
			break
	}

});

var pub = new Redis({
	port: config.redis_port,          // Redis port
	host: config.redis_url,   // Redis host
	family: 4,           // 4 (IPv4) or 6 (IPv6)
	password: config.redis_pass,
	db: 0
});
exports.publish = function (channel,message) {
	pub.publish(channel, message);
};