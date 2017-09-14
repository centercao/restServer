/**
 * Created by Center on 2017/4/1.
 */
const cmd_map = new Map();
class CMD{
	constructor(cmd_name){
		var cmd_info;
		if (cmd_name !=undefined) {
			cmd_info = cmd_map.get(cmd_name);
		}
		
		//如果没有对应的错误信息，默认'未知错误'
		if (!cmd_info) {
			cmd_name = CMD.UNKNOWN_CMD;
			cmd_info = cmd_map.get(cmd_name);
		}
		
		this.cmd = cmd_name;
		this.message = cmd_info.message;// replyBindMac
	}
}
CMD.G_HEAD = 0xAA75;
CMD.G_REPLY_HEAD = 0x557A;
// 第一级命令
CMD.GATEWAY_REPORT = 0x0000; // 网关主动上报
CMD.GATEWAY_REPLY = 0x0001; // 网关应答Server
CMD.SERVER_DOWN = 0x0002; // 服务器下发网关
CMD.SERVER_REPLY = 0x0003; // 服务器应答网关服务器应答网关
// 二级命令
CMD.GATEWAY_HEART = 0x00;    // 网关心跳
CMD.GATEWAY_REGISTER = 0x01; // 网关注册
CMD.GATEWAY_MAC_LIST = 0x02; // 网关请求设备列表
CMD.GATEWAY_MAC_BIND = 0x03; // 网关和设备绑定
CMD.DEVICE_ONLINE = 0x04;    // Zigbee设备上线
CMD.DEVICE_OFFLINE = 0x05;   // Zigbee设备离线
CMD.DEVICE_REPORT_ATT = 0x06;   // Zigbee设备属性上报
CMD.GATEWAY_TIME = 0x07;     // 网关请求服务器时间

CMD.GATEWAY_WARN_REPLY = 0x00; // 解除报警回复
CMD.GATEWAY_BIND_REPLY = 0x01; // 解除绑定回复
CMD.GATEWAY_SCENE_REPLY = 0x02;// 场景设置回复
CMD.GATEWAY_ATTSET_REPLY = 0x03;// 场景设置回复
CMD.GATEWAY_ATTREAD_REPLY = 0x04;// 场景设置回复
CMD.GATEWAY_ZIGSET_REPLY = 0x05;// 场景设置回复
CMD.GATEWAY_ZIGREAD_REPLY = 0x06;// 场景设置回复
CMD.GATEWAY_ENABLE_REPLY = 0x08;

CMD.SERVER_RELEASE_WARN = 0x00; // 服务器解除报警
CMD.SERVER_RELEASE_BIND = 0x01; // 服务器解除绑定
CMD.SERVER_SCENE_SET = 0x02;    // 场景设置回复
CMD.SERVER_SET_ATT = 0x03;      // 设备属性设置
CMD.SERVER_READ_ATT = 0x04;      // 设备属性设置
CMD.SERVER_SET_ZIGBEE = 0x05;      // 设备属性设置
CMD.SERVER_READ_ZIGBEE = 0x06;      // 设备属性设置
CMD.MAC_BIND = 0x07;      // 设备属性设置

CMD.SERVER_REPLY_HEART = 0x00;    // 网关心跳回复
CMD.SERVER_REPLY_REGISTER = 0x01; // 网关注册回复
CMD.SERVER_REPLY_ONLINE = 0x02;   // 设备上线回复
CMD.SERVER_REPLY_OFFLINE = 0x03;  // 设备离线回复
CMD.SERVER_REPLY_MAC = 0x04;      // 网关设备绑定回复
CMD.SERVER_REPLY_ATT = 0x05;      // 设备属性回复
CMD.SERVER_REPLY_LIST = 0x06;     // 网关请求设备列表回复
CMD.SERVER_REPLY_TIME = 0x07;     // 服务器当前时间
CMD.SERVER_SEND_DEVENABLE = 0x08;


// 反向控制命令
CMD.RELEASE_ALARM_CMD = 100;
CMD.REPLY_RELEASE_ALARM_CMD = 101;
CMD.RELEASE_BIND_CMD = 102;
CMD.REPLY_RELEASE_BIND_CMD = 103;
CMD.SCENE_SET_CMD = 104;
CMD.REPLY_SCENE_SET_CMD = 105;
CMD.ATT_READ_CMD = 107;
CMD.ATT_SET_CMD = 108;
CMD.ZIGBEE_READ_CMD = 109;
CMD.ZIGBEE_SET_CMD = 110;
CMD.BIND_CMD = 111;
CMD.DEVICE_ENABLE = 112;

cmd_map.set(CMD.UNKNOWN_CMD, {message: '未知命令' });
cmd_map.set(CMD.HEART_CMD, {message: '心跳命令' });
cmd_map.set(CMD.REGISTER_CMD, {message: '主机注册命令' });
cmd_map.set(CMD.REPLY_REGISTER_CMD, {message: '回复主机注册命令' });
cmd_map.set(CMD.GATEWAY_REPLY, {message: '网关回复服务器命令' });
cmd_map.set(CMD.GATEWAY_REQUEST_LIST, {message: '网关请求设备列表命令' });
cmd_map.set(CMD.DEVICE_BIND_CMD, {message: '设备绑定命令' });
cmd_map.set(CMD.ONLINE_CMD, {message: 'Zigbee设备上线命令' });
cmd_map.set(CMD.OFFLINE_CMD, {message: 'Zigbee设备离线命令' });
cmd_map.set(CMD.VALUE_REPORT, {message: 'Zigbee设备属性上报命令' });

cmd_map.set(CMD.RELEASE_ALARM, {message: '解除警报命令' });
cmd_map.set(CMD.RELEASE_BIND, {message: '解除绑定命令' });
cmd_map.set(CMD.REPLY_SCENE_SET, {message: '场景设置命令' });

module.exports = CMD;