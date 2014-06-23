(function() {"use strict";

	var MyApp = window.MyApp = { };

	// Uncomment the line below to disable platform-specific look and feel and to use the Generic theme for all devices
	// DevExpress.devices.current({ platform: "generic" });

	$(function() {
		MyApp.app = new DevExpress.framework.html.HtmlApplication({
			namespace : MyApp,

			layoutSet : DevExpress.framework.html.layoutSets["slideout"],
			navigation : [{
				title : 'Đơn hàng',
				action : "#orders",
				icon : "orders",
				// icon : "cart",
			}, {
				title : 'Sản Phẩm',
				action : "#products",
				icon : "products",
				// icon : "box",
			}, {
				title : 'Hỏi & đáp',
				action : "#chats",
				icon : "qa",
				// icon : "comment",
			}, {
				title : 'Đăng nhập',
				action : "#user",
				icon : "profile",
				// icon : "user",
			}, {
				title : 'Thông tin',
				action : "#about",
				icon : "info"
			}],
			commandMapping : {
				"ios-header-toolbar" : {
					commands : [{
						id : "sort",
						location : 'after',
						showText : true
					}, {
						id : "edit",
						location : 'after',
						showText : false
					}, {
						id : "refresh",
						location : 'after',
						showText : false
					}]
				},
				"android-header-toolbar" : {
					commands : [{
						id : "sort",
						location : 'after',
						text : 'Sắp xếp ',
						showText : true
					}, {
						id : "edit",
						location : 'after',
						showText : false
					}, {
						id : "refresh",
						location : 'after',
						showText : false
					}]
				},
				"generic-header-toolbar" : {
					commands : [{
						id : "sort",
						location : 'after',
						text : 'Sắp xếp ',
						showText : true
					}, {
						id : "edit",
						location : 'after',
						showText : false
					}, {
						id : "refresh",
						location : 'after',
						showText : false
					}]
				}

			}
		});

		jQuery.support.cors = true;
		// localStorage.clear();
		MyApp.app.router.register(":view/:id", {
			view : "user",
			id : undefined
		});

		function onBackButton() {
			DevExpress.hardwareBackButton.fire();
		}

		function exitApp() {
			var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn thoát ứng dụng?", "Sendo.vn");
			result.done(function(dialogResult) {
				if (dialogResult) {
					switch(DevExpress.devices.real().platform) {
						case "win8":
							window.external.Notify("DevExpress.ExitApp");
							break;
						default:
							navigator.app.exitApp();
							break;
					}
				}
			});
			// DevExpress.ui.notify("Nhấn lần nữa sẽ thoát ứng dụng!");unction onBackButton() {
		}

		var onDeviceReady = function() {
			//hide splash screen
			intel.xdk.device.hideSplashScreen();
			intel.xdk.device.setRotateOrientation("portrait");
			intel.xdk.device.setAutoRotate(false);
			document.addEventListener("backbutton", onBackButton, false);
			MyApp.app.navigatingBack.add(function(e) {
				if (!MyApp.app.canBack()) {
					e.cancel = true;
					if (window.cordova) {
						exitApp();
					}
				}
			});
			// AppMobi.device.hideSplashScreen();
		};
		document.addEventListener("intel.xdk.device.ready", onDeviceReady, false);

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
			if ( typeof AppMobi === 'object')
				DevExpress.ui.notify('Đăng ký nhận tin nhắn nhanh từ Sendo thành công', 'success', 2000);
		};
		document.addEventListener("appMobi.notification.push.enable", notificationsRegistered, false);

		var receivedPush = function() {
			//Get the notifications object
			var myNotifications = null;
			var len = 0;
			try {
				myNotifications = AppMobi.notification.getNotificationList();
				len = myNotifications.length;
			} catch (e) {
				DevExpress.ui.notify('Tin nhắn nhanh từ Sendo không hợp lệ ' + e.message, 'error', 2000);
			}
			//It may contain more than one message, so iterate over them
			if (len > 0) {
				for (var i = 0; i < len; i++) {
					//Get message object
					var msgObj = null;
					try {
						msgObj = AppMobi.notification.getNotificationData(myNotifications[i]);
					} catch (e) {
						DevExpress.ui.notify('Tin nhắn nhanh từ Sendo không hợp lệ ' + e.message, 'error', 2000);
					}

					try {
						if ( typeof msgObj == "object" && msgObj.id == myNotifications[i]) {
							//Display the message now.
							//You can do this however you like - it doesn't have to be an alert.
							var titleStr = 'Xem đơn hàng mới!';
							var newPage = 'orders';
							if (msgObj.data !== null) {
								if (msgObj.data !== "info") {
									if (msgObj.data === "newQuestion") {
										titleStr = 'Xem câu hỏi mới!';
										newPage = 'chats';
									}
									var result = DevExpress.ui.dialog.confirm(msgObj.msg, titleStr);
									result.done(function(dialogResult) {
										if (dialogResult) {
											MyApp.app.navigate({
												view : newPage,
												id : undefined
											}, {
												root : true
											});
										}
									});
								}
							} else
								DevExpress.ui.dialog.alert(msgObj.msg, "Sendo.vn");

							// AppMobi.notification.alert(msgObj.msg, "Sendo.vn", "OK");
							//Always mark the messages as read and delete them.
							//If you dont, your users will get them over and over again.

							AppMobi.notification.deletePushNotifications(msgObj.id);
							//here we have added return statement to show only first valid message, you can manage it accordingly if you want to read all messages
						}
						DevExpress.ui.notify('Tin nhắn nhanh từ Sendo không hợp lệ', 'error', 2000);
					} catch(e) {
						DevExpress.ui.notify('Tin nhắn nhanh từ Sendo không hợp lệ ' + e.message, 'error', 2000);
						//Always mark the messages as read and delete them.
						//If you dont, your users will get them over and over again.
						AppMobi.notification.deletePushNotifications(msgObj.id);
					}
				}
			}
		};
		document.addEventListener("appMobi.notification.push.receive", receivedPush, false);

		MyApp.app.navigate();
	});

})();
