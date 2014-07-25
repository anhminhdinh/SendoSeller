var notificationsRegistered = function(event) {
	//This is first called from the checkPushUser event above.
	//If a user is not found, success = false, and this tries to add that user.
	if (event.success === false) {
		var myUserName = window.localStorage.getItem("UserName");
		var didAddPushUser = window.localStorage.getItem(myUserName + "didAddPushUser");
		if (didAddPushUser === null) {
			//Set cookie 'didAddPushUser' in order to avoid multiple addPushUser calls
			window.localStorage.setItem(myUserName + "didAddPushUser", true);
			//Try adding the user now - sending unique user id, password, and email address.
			var userId = window.localStorage.getItem(myUserName + "UserID");
			AppMobi.notification.addPushUser(userId, AppMobi.device.uuid, 'no@email.com');
			//This will fire the push.enable event again, so that is why we use didAdd to make sure
			//we dont add the user twice if this fails for any reason.
			return;
		}
		if ( typeof AppMobi === 'object')
			DevExpress.ui.notify('Không thể nhận tin nhắn nhanh từ Sendo', 'error', 2000);
		return;
	}
	var msg = event.message || 'success';
	if ( typeof AppMobi === 'object') {
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ApiAddAccount";
		return $.post(url, {
			TokenId : tokenId,
		}, "json").done(function(data) {
			DevExpress.ui.notify('Đăng ký nhận tin nhắn nhanh từ Sendo thành công', 'success', 2000);
		});
	}
};
var receivedPush = function() {
	//Get the notifications object
	// alert("have pushed");
	var myNotifications = null;
	var len = 0;
	myNotifications = AppMobi.notification.getNotificationList();
	len = myNotifications.length;
	//It may contain more than one message, so iterate over them
	// var pushes = [];
	if (len > 0) {
		// alert("have pushed " + len);
		// for (var i = 0; i < len; i++) {
		//Get message object
		var msgObj = null;
		msgObj = AppMobi.notification.getNotificationData(myNotifications[0]);

		try {
			if ( typeof msgObj == "object" && msgObj.id == myNotifications[0]) {
				//Display the message now.
				//You can do this however you like - it doesn't have to be an alert.
				// pushes.push(msgObj.msg);
				// AppMobi.notification.alert(msgObj.msg, "Sendo.vn", "OK");
				//Always mark the messages as read and delete them.
				//If you dont, your users will get them over and over again.
				if (window.sessionStorage.getItem("MyTokenId") !== null) {

					AppMobi.notification.deletePushNotifications(msgObj.id);
					var newPage = "orders";
					var dataString = "" + msgObj.data;
					if (dataString.indexOf("chat") === 0) {
						newPage = "chats";
						dataString.replace("chat_", "");
						window.sessionStorage.setItem("MustRefreshChat", true);
					} else if (dataString.indexOf("newOrder") === 0) {
						dataString.replace("newOrder", "");
						dataString.replace("_", "");
						window.sessionStorage.setItem("MustRefreshOrder", true);
					}

					var result = DevExpress.ui.dialog.confirm(msgObj.msg, "Sendo");
					result.done(function(dialogResult) {
						if (dialogResult) {
							MyApp.app.navigate({
								view : newPage,
								id : dataString,
							}, {
								root : true
							});
						}
					});

				}
				//here we have added return statement to show only first valid message, you can manage it accordingly if you want to read all messages
			}
			// DevExpress.ui.notify('Tin nhắn nhanh từ Sendo không hợp lệ', 'error', 2000);
		} catch(e) {
			DevExpress.ui.notify('Tin nhắn nhanh từ Sendo không hợp lệ ' + e.message, 'error', 2000);
			//Always mark the messages as read and delete them.
			//If you dont, your users will get them over and over again.
			AppMobi.notification.deletePushNotifications(msgObj.id);
		}
		// }
	} else {
		window.sessionStorage.setItem("MustRefreshOrder", true);
		window.sessionStorage.setItem("MustRefreshChat", true);
	}

	// alert("process pushes " + pushes.length);
	// for ( i = 0; i < pushes.length; i++) {
	// DevExpress.ui.dialog.alert(pushes[i], "Sendo.vn");
	// }
};
