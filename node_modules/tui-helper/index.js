/**
 * Created by Center on 2017-05-05.
 */
var GeTui = require('./GT.push');
var Target = require('./getui/Target');
var APNPayload = require('./payload/APNPayload');
var DictionaryAlertMsg = require('./payload/DictionaryAlertMsg');
var TransmissionTemplate = require('./getui/template/TransmissionTemplate');

var SingleMessage = require('./getui/message/SingleMessage');
const _ = require('lodash');

const createPromiseCallback = () => {
	for(let i = 0; i < arguments.length; i++) {
		if(typeof arguments[i] === "function") {
			return arguments[i];
		}
	}
	let cb;
	if (!global.Promise) {
		cb = () => {};
		cb.promise = {};
		
		const throwPromiseNotDefined = () => {
			throw new Error(
				'Your Node runtime does support ES6 Promises. ' +
				'Set "global.Promise" to your preferred implementation of promises.');
		};
		
		Object.defineProperty(cb.promise, 'then', { get: throwPromiseNotDefined });
		Object.defineProperty(cb.promise, 'catch', { get: throwPromiseNotDefined });
		return cb;
	}
	
	const promise = new global.Promise((resolve, reject) => {
		cb = (err, data) => {
			if (err) return reject(err);
			return resolve(data);
		};
	});
	cb.promise = promise;
	return cb;
};

const defaultOptions = {
	host: 'https://api.getui.com/apiex.htm', // http://sdk.open.api.igexin.com/apiex.htm
	appId: 'eECHDNfs5Z680lzQMEHCt060',
	appKey: 'CcArSfD8IrA7l8diZDxw4060',
	masterSecret: 'VDLFyCWoyd9onOrmCP4m7080',
	title: "智能家居信息"
};
function tran(options) {
	// http的域名
	this.options = _.assign({}, defaultOptions, options);
	this.gt = new GeTui(this.options.host, this.options.appKey, this.options.masterSecret);
}
tran.prototype ={
	sendMessage:function (title,info,cId,cb) {
		cb = cb || createPromiseCallback();
		var template =  new TransmissionTemplate({
			appId: this.options.appId,
			appKey: this.options.appKey,
			transmissionType: 1,
			transmissionContent: JSON.stringify(info)
		});
		//APN高级推送
		var payload = new APNPayload();
		var alertMsg = new DictionaryAlertMsg();
		alertMsg.body = JSON.stringify(info);
		alertMsg.actionLocKey = "actionLocKey";
		alertMsg.locKey = title; // locKey
		alertMsg.locArgs = Array("locArgs");
		alertMsg.launchImage = "launchImage";
		//ios8.2以上版本支持
		alertMsg.title = "信息";
		alertMsg.titleLocKey = this.options.title; // titleLocKey
		alertMsg.titleLocArgs = Array("titleLocArgs");
		payload.alertMsg=alertMsg;
		// template.setApnInfo(payload);
		//个推信息体
		var message = new SingleMessage({
			isOffline: true,                        //是否离线
			offlineExpireTime: 3600 * 12 * 1000,    //离线时间
			data: template,                          //设置推送消息类型
			pushNetWorkType:0                     //是否wifi ，0不限，1wifi
		});
		//接收方
		var target = new Target({
			appId: this.options.appId,
			clientId: cId
		});
		var that = this;
		that.gt.pushMessageToSingle(message, target, function(err, res){
			if(err != null && err.exception != null && err.exception instanceof  RequestError){
				var requestId = err.exception.requestId;
				console.log(err.exception.requestId);
				that.gt.pushMessageToSingle(message,target,requestId,function(err, res){
					if(err){
						console.log(err);
						console.log(res);
						cb(err,res);
					}else{
						cb(null,res);
					}
				});
			}else{
				cb(null,res);
			}
		});
		return cb.promise;
	}
};
module.exports = tran;
