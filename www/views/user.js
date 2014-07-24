MyApp.user = function(params) {
	var viewModel = {
		username : ko.observable(),
		pass : ko.observable(),
		loadPanelVisible : ko.observable(false),
		passMode : "password",
		savePassword : ko.observable(false),
		toggleSavePassword : function() {
			var myUserName = window.localStorage.getItem("UserName");
			if (!viewModel.savePassword()) {
				localStorage.removeItem(myUserName + "Password");
				viewModel.pass('');
			}
			localStorage.setItem(myUserName + "SavePassword", Boolean(viewModel.savePassword()));
		},
		isLoggedOut : ko.observable(false),
		viewShowing : function() {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			var tokenId = window.sessionStorage.getItem("MyTokenId");
			var isLoggedOut = tokenId === null;
			viewModel.isLoggedOut(isLoggedOut);
			if (isLoggedOut) {
				viewModel.toggleNavs(false);
				var myUserName = window.localStorage.getItem("UserName");
				if (myUserName !== null) {
					viewModel.username(myUserName);
					var myPassword = window.localStorage.getItem(myUserName + "Password");
					var mySavePassword = localStorage.getItem(myUserName + 'SavePassword');
					if (mySavePassword !== null) {
						viewModel.savePassword(Boolean(mySavePassword));
					}
					if (myPassword !== null) {
						viewModel.pass(myPassword);
						viewModel.dologin();
					}
				}
			} else {
				viewModel.dologout();
			}
		},
		toggleNavs : function(onOff) {
			MyApp.app.navigation[0].option('visible', onOff);
			MyApp.app.navigation[1].option('visible', onOff);
			MyApp.app.navigation[2].option('visible', onOff);
		},
		dologin : function() {
			setTimeout(function() {
				viewModel.doreallogin();
			}, 500);
		},
		doreallogin : function() {
			if (!validateEmail(viewModel.username())) {
				DevExpress.ui.dialog.alert("Địa chỉ email không hợp lệ!", "Sendo.vn");
				return;
			}
			viewModel.loadPanelVisible(true);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.showBusyIndicator();
			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/mobile/login";
			return $.post(url, {
				UserName : viewModel.username(),
				Password : viewModel.pass()
			}, "json").done(function(data) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				if (data.Flag !== true) {
					DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
					return;
				}
				if (data.Data.StoreStatus !== 2) {
					var message = "Shop trong trạng thái ";
					switch (data.Data.StoreStatus) {
						case 0:
							message += "nháp";
							break;
						case 1:
							message += "chờ duyệt";
							break;
						case 3:
							message += "bị từ chối";
							break;
						case 4:
							message += "đã huỷ";
							break;
						case 5:
							message += "đã xoá";
							break;
						default:
							message += "chưa duyệt";
							break;
					}
					DevExpress.ui.dialog.alert(message, "Sendo.vn");
					// return;
				}

				window.localStorage.setItem("UserName", viewModel.username());
				if (viewModel.savePassword)
					window.localStorage.setItem(viewModel.username() + "Password", viewModel.pass());
				if (data.Data.TokenId !== undefined)
					window.sessionStorage.setItem("MyTokenId", data.Data.TokenId);
				else
					window.sessionStorage.setItem("MyTokenId", data.Data);
				window.localStorage.setItem(viewModel.username() + "UserID", data.Data.FptId);
				viewModel.toggleNavs(true);
				MyApp.app.navigation[3].option('title', 'Đăng xuất');
				MyApp.app.navigate({
					view : "orders",
					id : undefined,
				}, {
					root : true
				});
				registerPush();
			}).fail(function(jqxhr, textStatus, error) {
				DevExpress.ui.dialog.alert("Lỗi mạng, đăng nhập thất bại!", "Sendo.vn");
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
			});
		},
		dologout : function() {
			var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn đăng xuất?", "Sendo.vn");
			result.done(function(dialogResult) {
				if (dialogResult) {
					viewModel.loadPanelVisible(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/mobile/logout";
					return $.post(url, {
						TokenId : window.sessionStorage.getItem("MyTokenId")
					}, "json").done(function(data, textStatus) {
						viewModel.loadPanelVisible(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag !== true) {
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						window.sessionStorage.removeItem("MyTokenId");
						window.sessionStorage.removeItem("firstloadorder");
						viewModel.isLoggedOut(true);
						viewModel.toggleNavs(false);
						MyApp.app.navigation[3].option('title', 'Đăng nhập');
						//textStatus contains the status: success, error, etc
					}).fail(function(jqxhr, textStatus, error) {
						DevExpress.ui.dialog.alert("Đăng xuất thất bại!", "Sendo.vn");
						viewModel.loadPanelVisible(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
					});
				}
			});
		},
	};
	return viewModel;
};
