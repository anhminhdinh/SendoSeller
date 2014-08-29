MyApp.user = function(params) {
	var viewModel = {
		username : ko.observable(),
		pass : ko.observable(),
		loadPanelVisible : ko.observable(false),
		passMode : "password",
		// savePassword : ko.observable(false),
		// toggleSavePassword : function() {
		// var myUserName = window.localStorage.getItem("UserName");
		// if (viewModel.savePassword() !== true) {
		// localStorage.removeItem(myUserName + "SavePassword");
		// viewModel.pass('');
		// } else
		// localStorage.setItem(myUserName + "SavePassword", viewModel.savePassword());
		// },
		isLoggedOut : ko.observable(false),
		viewShowing : function() {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();

			var myUserName = window.localStorage.getItem("UserName");
			if (myUserName !== null) {
				viewModel.username(myUserName);
			}

			// var mySavePassword = localStorage.getItem(myUserName + 'SavePassword');
			// if (mySavePassword !== null) {
			// viewModel.savePassword(true);
			// }

			var myPassword = window.localStorage.getItem(myUserName + "Password");
			if (myPassword !== null) {
				viewModel.pass(myPassword);
			}

			var tokenId = window.sessionStorage.getItem("access_token");
			var isLoggedOut = tokenId === null;
			viewModel.isLoggedOut(isLoggedOut);

			if (isLoggedOut || (params.id === "forced")) {
				viewModel.toggleNavs(false);
				if (myUserName !== null && myPassword !== null)
					viewModel.dologin();
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
			if (viewModel.pass().length < 6) {
				DevExpress.ui.dialog.alert("Mật khẩu không hợp lệ!", "Sendo.vn");
				return;
			}
			viewModel.loadPanelVisible(true);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.showBusyIndicator();

			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/token";
			$.post(url, {
				"grant_type" : "password",
				"username" : viewModel.username(),
				"password" : viewModel.pass()
			}, "json").done(function(data) {
				console.log(data.access_token);
				window.sessionStorage.setItem("access_token", data.access_token);
				var url = domain + "/api/User/UserInfo";

				// return $.post(url, {
				// UserName : viewModel.username(),
				// Password : viewModel.pass()
				// }, "json").done(function(data) {
				return $.ajax({
					type : "POST",
					url : url,
					dataType : "json",
					contentType : "application/json",
					data : {},
					beforeSend : function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
					},
				}).done(function(data) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						prepareLogout(data.Message);
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
						DevExpress.ui.dialog.alert(Message, "Sendo.vn");
						// return;
					}

					window.localStorage.setItem("UserName", viewModel.username());
					window.localStorage.setItem(viewModel.username() + "Password", viewModel.pass());
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
					if (jqxhr.responseText !== null && jqxhr.responseText !== undefined) {
						var errorObj = JSON.parse(jqxhr.responseText);
						DevExpress.ui.dialog.alert(errorObj.error, "Sendo.vn");
					} else
						DevExpress.ui.dialog.alert("Lỗi mạng, đăng nhập thất bại!", "Sendo.vn");
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
				});
			}).fail(function(jqxhr, textStatus, error) {
				if (jqxhr.responseText !== null && jqxhr.responseText !== undefined) {
					var errorObj = JSON.parse(jqxhr.responseText);
					DevExpress.ui.dialog.alert(errorObj.error, "Sendo.vn");
				} else
					DevExpress.ui.dialog.alert("Lỗi mạng, đăng nhập thất bại!", "Sendo.vn");
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
			});
		},
		logoutDone : function() {
			if (params.id !== "forced") {
				var myUserName = window.localStorage.getItem("UserName");
				localStorage.removeItem(myUserName + 'Password');
				viewModel.pass('');
			}
			window.sessionStorage.removeItem("access_token");
			viewModel.isLoggedOut(true);
			viewModel.toggleNavs(false);
			MyApp.app.navigation[3].option('title', 'Đăng nhập');
			// window.plugins.pushNotification.unregister(null, null, null);
		},
		dologout : function() {
			if (params.id === "forced") {
				viewModel.logoutDone();
			} else {
				var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn đăng xuất?", "Sendo.vn");
				result.done(function(dialogResult) {
					if (dialogResult) {
						viewModel.logoutDone();
						// viewModel.doRealLogout();
					}
				});
			}
		},
		checkPassword : function() {
			var myPassword = window.localStorage.getItem(viewModel.username() + "Password");
			if (myPassword !== null) {
				viewModel.pass(myPassword);
			}			
		},
	};
	return viewModel;
};
