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
	// DevExpress.ui.notify('Token ' + result, 'success', 1000);
	var platform = DevExpress.devices.real().platform;

	var domain = window.sessionStorage.getItem("domain");
	var url = domain + "/api/User/APIAddAccount";
	return $.ajax({
		type : 'POST',
		dataType : "json",
		contentType : "application/json",
		url : url,
		data : JSON.stringify({
			Registration_ids : result,
			IsAndroid : false
		}),
		beforeSend : function(xhr) {
			xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
		},
	}).done(function(data) {
		if (data.Flag !== true)
			DevExpress.ui.notify('Bạn sẽ không nhận được tin nhắn nhanh từ Sendo.', 'error', 1000);
	});

}

showCustomDialog = function(message, newPage, dataString) {
	var view = function() {
		return "View";
	};
	var cancel = function() {
		return "Cancel";
	};

	message = message.trunc(100, true);
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
			// alert("will go to " + newPage + "/" + dataString);
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
	var pushData = event.data;
	// var pushId = event.id;
	// DevExpress.ui.notify(pushData, 'info', 1000);
	// var index = pushMessage.indexOf('#');
	// if (index < 0) {
	// return;
	// }
	// var datas = pushMessage.split('#');
	// if (datas.length < 2) {
	// return;
	// }
	if (window.sessionStorage.getItem("access_token") !== null) {
		var newPage = "orders";
		var dataString = pushData;

		if (dataString.indexOf("newQuestion") === 0) {
			newPage = "chats";
			dataString = dataString.replace("newQuestion", "");
			dataString = dataString.replace("_", "");
			// window.sessionStorage.setItem("MustRefreshChat", true);
		} else if (dataString.indexOf("Order") >= 0) {
			window.sessionStorage.removeItem("ViewDetails");
		}

		if (dataString.indexOf("info") < 0) {
			showCustomDialog(pushMessage, newPage, dataString);
		} else {
			DevExpress.ui.dialog.alert(pushMessage, "Sendo");
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
			// var platform = DevExpress.devices.real().platform;

			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/User/APIAddAccount";
			return $.ajax({
				type : 'POST',
				dataType : "json",
				contentType : "application/json",
				url : url,
				data : JSON.stringify({
					Registration_ids : e.regid,
					IsAndroid : true
				}),
				beforeSend : function(xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
				},
			}).done(function(data) {
				console.log(JSON.stringify(data));
				if (data.Flag !== true)
					DevExpress.ui.notify('Bạn sẽ không nhận được tin nhắn nhanh từ Sendo.', 'error', 1000);
			}).fail(function(jqxhr, textStatus, error) {
				console.log(JSON.stringify(jqxhr.responseText));
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
		if (window.sessionStorage.getItem("access_token") !== null) {
			console.log(JSON.stringify(e));
			var newPage = "orders";
			var dataString = "" + e.payload.data;
			if (dataString.indexOf("newQuestion") === 0) {
				newPage = "chats";
				dataString = dataString.replace("newQuestion", "");
				dataString = dataString.replace("_", "");
				// window.sessionStorage.setItem("MustRefreshChat", true);
			} else if (dataString.indexOf("Order") >= 0) {
				window.sessionStorage.removeItem("ViewDetails");
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
