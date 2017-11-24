var Event = (function(){
	var clientList = {},
		listen,
		trigger,
		remove;
	listen = function( key, fn ){
		if ( !clientList[ key ] ){
			clientList[ key ] = [];
		}
		clientList[ key ].push( fn );
	};
	trigger = function(){
		var key = Array.prototype.shift.call( arguments ),
			fns = clientList[ key ];
		if ( !fns || fns.length === 0 ){
			return false;
		}
		for( var i = 0, fn; fn = fns[ i++ ]; ){
			fn.apply( this, arguments );
		}
	};
	remove = function( key, fn ){
		var fns = clientList[ key ];
		if ( !fns ){
			return false;
		}
		if ( !fn ){
			fns && ( fns.length = 0 );
		}else{
			for ( var l = fns.length - 1; l >=0; l-- ){
				var _fn = fns[ l ];
				if ( _fn === fn ){
					fns.splice( l, 1 );
					break;
				}
			}
		}
	};
	return {
		listen: listen,
		trigger: trigger,
		remove: remove
	}
})();
exports.listen = Event.listen;
exports.trigger = Event.trigger;
exports.operate=function (key,info) {
	return new Promise(function(resolve, reject) {
		var backFun = function (message) {
			var data = JSON.parse(message);
			if(data.gId == info.gId){
				resolve(data);
			}else{
				var error = new Error("gId error");
				error.number = 118;
				Event.remove(key,backFun);
				reject(error);
			}
		};
		Event.listen(key,backFun);
		setTimeout(function () {
			var error = new Error("操作超时");
			error.number = 117;
			Event.remove(key,backFun);
			reject(error);
		},5000);
	});
};