var config = require('../config');
var mongo = require("mongoskin");
var db = null;
/*process.on('SIGINT', function() {
	console.log('Recieve SIGINT');
	if(db){
		db.close(function(){
			console.log('database has closed');
		});
	}
});

 findAny:function () {
 var collection = db.collection(Array.prototype.shift.call(arguments));
 var args = arguments;
 return new Promise(function(resolve, reject) {
 collection.find.apply(collection,args).toArray(function (err,result) {
 if(err){
 reject(err);
 }else {
 resolve(result);
 }
 });
 });
 },*/
var CRUD = function(){
	if (!db) {
		var connStr = 'mongodb://' + config.mongodb_user + ':' + config.mongodb_password + '@' +
			config.mongodb_url +':' + config.mongodb_port+ '/' + config.mongodb_database +
			'?auto_reconnect=true&poolSize=3';
		db = mongo.db(connStr,
			{numberOfRetries: 1, retryMiliSeconds: 500, safe: true, native_parser: true},
			{socketOptions: {timeout: 5000}}
		);
	}
};
CRUD.prototype = {
	insert:function () {
		var collection = db.collection(Array.prototype.shift.call(arguments));
		var args = arguments;
		return new Promise(function(resolve, reject) {
			Array.prototype.push.call(args,function (err, result) {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
			collection.insert.apply(collection, args);
		});
	},
    find:function () {
        var collection = db.collection(Array.prototype.shift.call(arguments));
        var pageSize = Number(Array.prototype.pop.call(arguments));
        var currentPage = Number(Array.prototype.pop.call(arguments));
        var args = arguments;
        return new Promise(function(resolve, reject) {
            collection.find.apply(collection,args).skip((currentPage-1) * pageSize).sort({_id:-1}).limit(pageSize).toArray(function (err,result) {
                if(err){
                    reject(err);
                }else {
                    resolve(result);
                }
            });
        });
    },
	update:function () {
		var collection = db.collection(Array.prototype.shift.call(arguments));
		var args = arguments;
		return new Promise(function(resolve, reject) {
			Array.prototype.push.call(args,function (err, result) {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
			collection.update.apply(collection, args);
		});
	},
	remove:function () {
		var collection = db.collection(Array.prototype.shift.call(arguments));
		var args = arguments;
		return new Promise(function(resolve, reject) {
			Array.prototype.push.call(args,function (err, result) {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
			collection.remove.apply(collection, args);
		});
	}
};
module.exports = CRUD;