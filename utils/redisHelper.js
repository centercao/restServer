/**
 * Created by dev on 16-11-16.
 */
var Redis = require('ioredis');
var config = require("../config");

var redis = new Redis({
	port: config.redis_port,          // Redis port
	host: config.redis_url,   // Redis host
	family: 4,           // 4 (IPv4) or 6 (IPv6)
	password: config.redis_pass,
	db: 0
});
var sub = new Redis({
	port: config.redis_port,          // Redis port
	host: config.redis_url,   // Redis host
	family: 4,           // 4 (IPv4) or 6 (IPv6)
	password: config.redis_pass,
	db: 0
});
var pub = new Redis({
	port: config.redis_port,          // Redis port
	host: config.redis_url,   // Redis host
	family: 4,           // 4 (IPv4) or 6 (IPv6)
	password: config.redis_pass,
	db: 0
});
/*var publish = function (channel,message) {
	pub.publish(channel, message);
};*/
redis.sub =sub;
redis.pub =pub;
module.exports  = redis;