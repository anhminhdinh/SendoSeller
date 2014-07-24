function successHandler(result) {
	alert('result = ' + result);
}

// result contains any error description text returned from the plugin call
function errorHandler(error) {
	alert('error = ' + error);
}

// iOS
function onNotificationAPN(event) {
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
}

// Android and Amazon Fire OS
function onNotificationGCM(e) {
	switch( e.event ) {
		case 'registered':
			if (e.regid.length > 0) {
				// Your GCM push server needs to know the regID before it can push to this device
				// here is where you might want to send it the regID for later use.
				console.log("regID = " + e.regid);
			}
			break;

		case 'message':
			// if this flag is set, this notification happened while we were in the foreground.
			// you might want to play a sound to get the user's attention, throw up a dialog, etc.
			if (e.foreground) {
				// on Android soundname is outside the payload.
				// On Amazon FireOS all custom attributes are contained within payload
				var soundfile = e.soundname || e.payload.sound;
				// if the notification contains a soundname, play it.
				var my_media = new Media("/android_asset/www/" + soundfile);
				my_media.play();
			} else {// otherwise we were launched because the user touched a notification in the notification tray.
				if (e.coldstart) {
				} else {
				}
			}
			DevExpress.ui.notify(e.payload.message + ' ' + e.payload.msgcnt + ' ' + e.payload.timeStamp, 'info', 2000);
			break;

		case 'error':
			DevExpress.ui.notify(e.msg, 'error', 2000);
			break;

		default:
			DevExpress.ui.notify('Tin nhắn lỗi', 'error', 2000);
			break;
	}
}
