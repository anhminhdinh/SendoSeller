function successHandler(result) {
	// alert('result = ' + result);
}

// result contains any error description text returned from the plugin call
function errorHandler(error) {
	alert('error = ' + error);
}

// iOS
function tokenHandler(result) {
	// Your iOS push server needs to know the token before it can push to this device
	// here is where you might want to send it the token for later use.
	// console.log('device token = ' + result);
	// alert('device token = ' + result);
	var platform = DevExpress.devices.real().platform;
	var isAndroid = platform === 'android';

	var tokenId = window.sessionStorage.getItem("MyTokenId");
	var domain = window.sessionStorage.getItem("domain");
	var url = domain + "/api/mobile/APIAddAccount";
	return $.post(url, {
		TokenId : tokenId,
		Registration_ids : result,
		IsAndroid : isAndroid
	}, "json").done(function(data) {
	});

}

showCustomDialog = function(message, newPage, dataString) {
	var view = function() {
		return "View";
	};
	var cancel = function() {
		return "Cancel";
	};
	var customDialog = DevExpress.ui.dialog.custom({
		title : "Sendo.vn",
		message : message,
		buttons : [{
			text : "Xem",
			clickAction : view
		}, {
			text : "Bỏ qua",
			clickAction : cancel
		}]
	});
	customDialog.show().done(function(dialogResult) {
		if (dialogResult === "View") {
			console.log("will go to " + newPage + "/" + dataString);
			MyApp.app.navigate({
				view : newPage,
				id : dataString,
			}, {
				root : true
			});
		}
	});
};

function onNotificationAPN(event) {
	var pushMessage = event.alert;
	var index = pushMessage.indexOf('#');
	if (index < 0) {
		return;
	}
	var datas = pushMessage.split('#');
	if (datas.length < 2) {
		return;
	}
	if (window.sessionStorage.getItem("MyTokenId") !== null) {
		var newPage = "orders";
		var dataString = "" + datas[1];

		if (dataString.indexOf("chat") === 0) {
			newPage = "chats";
			dataString = dataString.replace("chat", "");
			dataString = dataString.replace("_", "");
		} else if (dataString.indexOf("Order") >= 0) {
		}
		if (dataString.indexOf("info") < 0) {
			showCustomDialog(datas[0], newPage, dataString);
		} else {
			DevExpress.ui.dialog.alert(datas[0], "Sendo");
		}
	}

	// alert(JSON.stringify(event));
	/*
	 if (event.alert) {
	 navigator.notification.alert(event.alert);
	 }
	 if (event.sound) {
	 var snd = new Media(event.sound);
	 snd.play();
	 }
	 if (event.badge) {
	 pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
	 }
	 */
}

// Android and Amazon Fire OS
function onNotificationGCM(e) {
	switch( e.event ) {
		case 'registered':
			if (e.regid.length > 0) {
				// Your GCM push server needs to know the regID before it can push to this device
				// here is where you might want to send it the regID for later use.
				console.log("regID = " + e.regid);
				// alert(e.regid);
				var platform = DevExpress.devices.real().platform;
				var isAndroid = platform === 'android';

				var tokenId = window.sessionStorage.getItem("MyTokenId");
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/mobile/APIAddAccount";
				return $.post(url, {
					TokenId : tokenId,
					Registration_ids : e.regid,
					IsAndroid : isAndroid
				}, "json").done(function(data) {
				});
			}
			break;

		case 'message':
			// if this flag is set, this notification happened while we were in the foreground.
			// you might want to play a sound to get the user's attention, throw up a dialog, etc.
			if (e.foreground) {
				// // on Android soundname is outside the payload.
				// // On Amazon FireOS all custom attributes are contained within payload
				// var soundfile = e.soundname || e.payload.sound;
				// // if the notification contains a soundname, play it.
				// var my_media = new Media("/android_asset/www/" + soundfile);
				// my_media.play();
			} else {// otherwise we were launched because the user touched a notification in the notification tray.
				if (e.coldstart) {
				} else {
				}
			}
			if (window.sessionStorage.getItem("MyTokenId") !== null) {
				var newPage = "orders";
				var dataString = "" + e.payload.data;
				if (dataString.indexOf("chat") === 0) {
					newPage = "chats";
					dataString = dataString.replace("chat", "");
					dataString = dataString.replace("_", "");
				} else if (dataString.indexOf("Order") >= 0) {
				}
				if (dataString.indexOf("info") < 0) {
					showCustomDialog(e.payload.message, newPage, dataString);
				} else {
					DevExpress.ui.dialog.alert(e.payload.message, "Sendo");
				}
			}
			// alert(JSON.stringify(e));
			// DevExpress.ui.notify(e.payload.message + ' ' + e.payload.msgcnt + ' ' + e.payload.data, 'info', 2000);
			break;

		case 'error':
			DevExpress.ui.notify(e.msg, 'error', 2000);
			break;

		default:
			DevExpress.ui.notify('Tin nhắn lỗi', 'error', 2000);
			break;
	}
}
