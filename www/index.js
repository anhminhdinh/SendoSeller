window.MyApp = window.MyApp || { };
(function() {"use strict";

	// Uncomment the line below to disable platform-specific look and feel and to use the Generic theme for all devices
	DevExpress.devices.current({
		platform : "android"
	});

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
			commandMapping : commandMapping

		});
		Globalize.addCultureInfo("default", {
			messages : {
				Yes : "Có",
				No : "Không",
				Cancel : "Bỏ qua",
				Done : "Xong",
				Loading : "Đang tải...",
				Back : "Trở về",
				OK : "Chấp nhận",
			}
		});

		jQuery.support.cors = true;
		// localStorage.clear();
		MyApp.app.router.register(":view/:id", {
			view : "user",
			id : undefined
		});
		window.sessionStorage.setItem("domain", "http://ban.sendo.vn");
		// window.sessionStorage.setItem("domain", "http://180.148.138.140/sellerTest2");
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

		if ( typeof AppMobi === 'object') {
			document.addEventListener("intel.xdk.device.ready", function() {
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
			}, false);
			document.addEventListener("appMobi.notification.push.enable", notificationsRegistered, false);
			document.addEventListener("appMobi.notification.push.receive", receivedPush, false);
			document.addEventListener("appMobi.device.resume", function() {
				DevExpress.ui.notify('Chào mừng bạn trở lại với Sendo!', 'info', 2000);
			}, false);
		}

		MyApp.app.navigate();
	});

})();
