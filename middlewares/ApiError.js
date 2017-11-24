/**
 * Created by center on 17-2-24.
 */
const error_map = new Map();
/**
 * 自定义Api异常
 */
class ApiError extends Error{
	//构造方法
	constructor(error_name){
		super();
		var error_info;
		if (error_name) {
			error_info = error_map.get(error_name);
		}
		
		//如果没有对应的错误信息，默认'未知错误'
		if (!error_info) {
			error_name = ApiError.UNKNOW_ERROR;
			error_info = error_map.get(error_name);
		}
		
		this.name = error_name;
		this.number = error_info.number;
		this.message = error_info.message;
	}
}
ApiError.UNKNOW_ERROR = "unknownError";
ApiError.OPERATION_TIMEOUT = "operationTimeout";
ApiError.USER_NOT_EXIST = "userNotExist";
ApiError.USER_EXIST = "userAlreadyExist";
ApiError.PASS_ERROR  = "passwordIsError";
ApiError.USER_NOT_LOGIN  = "userNotLogin";
ApiError.USER_TOKEN_EXPIRE  = "userTokenExpire";
ApiError.USER_NOT_PERM  = "userNotPermission";
ApiError.DATA_IS_EMPTY  = "data is empty";
ApiError.REPEATED_ADDITION  = "Repeated addition";
ApiError.PASSWORD_EMPTY  = "passwordEmpty";
ApiError.TOKEN_EMPTY  = "tokenEmpty";
ApiError.OLD_PASSWORD_ERROR  = "oldPasswordError";
ApiError.ACCOUNT_PASSWORD_EMPTY  = "accountPasswordEmpty";
ApiError.ALARM_DEAL_FAIL  = "alarmDealFail";
ApiError.REPEAT_SETTINGS  = "repeat settings ";
ApiError.DEVICE_TYPE_ERROR  = "Device type error ";
ApiError.CID_EMPTY  = "CID empty";
ApiError.OPERATE_TIMEOUT  = "operate timeout";
ApiError.OPERATE_RROR  = "operate error";
ApiError.GATE_REPEAT_BIND  = "gateway repeat";
ApiError.NONE_GATEWAY  = "none gateway";
ApiError.DEVICE_NO_EXISTS  = "device no exists";
ApiError.CODE_ERROR  = "code error";
ApiError.USER_NOT_IMAGE  = "user not image";
ApiError.GATE_NOT_DEVICE  = "device not in gateway";
ApiError.GATE_EZVIZ_TOKEN  = "ezviz get token fail";

// 网关服务器错误
ApiError.NOT_REGISTER = "not register";
ApiError.REGISTER_FAIL = "register fail";
ApiError.DEVICE_NON_EXISTENT = "device non-existent";

error_map.set(ApiError.UNKNOW_ERROR, { number: -1, message: '未知错误' });
error_map.set(ApiError.OPERATION_TIMEOUT, { number: 1, message: '操作超时' });
error_map.set(ApiError.USER_NOT_EXIST, { number: 101, message: '用户不存在' });
error_map.set(ApiError.USER_EXIST, { number: 102, message: '用户已存在' });
error_map.set(ApiError.PASS_ERROR, { number: 103, message: '密码错误' });
error_map.set(ApiError.USER_NOT_LOGIN, { number: 104, message: '用户未登录' });
error_map.set(ApiError.USER_TOKEN_EXPIRE, { number: 105, message: '用户Token过期' });
error_map.set(ApiError.USER_NOT_PERM, { number: 106, message: '用户没有操作权限' });
error_map.set(ApiError.DATA_IS_EMPTY, { number: 107, message: '关键数据不能为空' });
error_map.set(ApiError.REPEATED_ADDITION, { number: 108, message: '重复添加设备' });
error_map.set(ApiError.PASSWORD_EMPTY, { number: 109, message: '密码不能为空' });
error_map.set(ApiError.TOKEN_EMPTY, { number: 110, message: 'token 认证不能为空' });
error_map.set(ApiError.OLD_PASSWORD_ERROR, { number: 111, message: '旧密码错误' });
error_map.set(ApiError.ACCOUNT_PASSWORD_EMPTY, { number: 112, message: '账户或密码不能为空' });
error_map.set(ApiError.ALARM_DEAL_FAIL, { number: 113, message: '警报处理未成功' });
error_map.set(ApiError.REPEAT_SETTINGS, { number: 114, message: '重复设置' });
error_map.set(ApiError.DEVICE_TYPE_ERROR, { number: 115, message: '设备类型错误' });
error_map.set(ApiError.CID_EMPTY, { number: 116, message: '推送的CID为空' });
error_map.set(ApiError.OPERATE_TIMEOUT, { number: 117, message: '操作超时' });
error_map.set(ApiError.OPERATE_RROR, { number: 118, message: '操作错误' });
error_map.set(ApiError.GATE_REPEAT_BIND, { number: 119, message: '网关重复绑定' });
error_map.set(ApiError.NONE_GATEWAY, { number: 120, message: '设备不是网关设备类型' });
error_map.set(ApiError.DEVICE_NO_EXISTS, { number: 121, message: '设备不存在' });
error_map.set(ApiError.CODE_ERROR, { number: 122, message: '验证码错误' });
error_map.set(ApiError.USER_NOT_IMAGE, { number: 123, message: '用户头像不存在' });
error_map.set(ApiError.GATE_EZVIZ_TOKEN, { number: 124, message: '获取萤石云Token错误' });

// 网关服务器错误
error_map.set(ApiError.NOT_REGISTER, { number: 201, message: '网关未注册' });
error_map.set(ApiError.REGISTER_FAIL, { number: 202, message: '网关注册失败' });
error_map.set(ApiError.DEVICE_NON_EXISTENT, { number: 203, message: '设备不存在' });


module.exports = ApiError;