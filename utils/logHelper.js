/**
 * Created by center on 17-2-10.
 */
var path = require("path");
var log_config = require("./log4jsConfig.js");
var log4js = require("log4js");
log4js.clearAppenders();
/**
 * 日志配置
 */
exports.configure = function(config) {
	log4js.configure(config); // log_config
};

/**
 * 暴露到应用的日志接口，调用该方法前必须确保已经configure过
 * @param name 指定log4js配置文件中的category。依此找到对应的appender。
 *              如果appender没有写上category，则为默认的category。可以有多个
 * @returns {Logger}
 */
exports.logger = function(name) {
    var dateFileLog = log4js.getLogger(name);
   //  var lev = log4js.levels.getLevel(name);
    // dateFileLog.setLevel(log4js.levels.INFO);
    return dateFileLog;
};

/**
 * 用于express中间件，调用该方法前必须确保已经configure过
 * @returns {Function|*}
 */
exports.useLog = function() {
    return log4js.connectLogger(log4js.getLogger("console"));
};
