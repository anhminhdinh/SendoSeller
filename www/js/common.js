function convertDate(inputDateString) {
	if (inputDateString === null)
		return null;
	var dateString = inputDateString;
	if ((dateString.indexOf("+") === -1) && (dateString.indexOf("Z") === -1))
		dateString += 'Z';
	var date = new Date(dateString);
	// var mOffset = date.getTimezoneOffset() * 60 * 1000;
	// var dTime = date.getTime();
	// dTime += mOffset;
	// date.setTime(dTime);
	return date;
}

String.prototype.trunc = String.prototype.trunc ||
function(n, useWordBoundary) {
	var toLong = this.length > n, s_ = toLong ? this.substr(0, n - 1) : this;
	s_ = useWordBoundary && toLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
	return toLong ? s_ + '&hellip;' : s_;
};

function isNumber(obj) {
	return !isNaN(parseFloat(obj));
}

function registerPush() {
	if ( typeof AppMobi === 'object') {
		//DevExpress.ui.notify('Đăng ký tin nhắn nhanh từ Sendo', 'info', 2000);
		var myUserName = window.localStorage.getItem("UserName");
		var didAddPushUser = window.localStorage.getItem(myUserName + "didAddPushUser");
		if (didAddPushUser === null) {
			//See if the push user exists already
			//We are just using the unique device id, but you can send any unique user id and password.
			var userId = window.localStorage.getItem(myUserName + "UserID");
			AppMobi.notification.checkPushUser(userId, "nopassword");
		}
	} else {
		var pushNotification = window.plugins.pushNotification;
		//DevExpress.ui.notify('Đăng ký tin nhắn nhanh từ Cordova cho ' + window.device.platform, 'info', 200);
		if (device.platform == 'android' || device.platform == 'Android') {
			pushNotification.register(successHandler, errorHandler, {
				"senderID" : "1017201532317",
				"ecb" : "onNotificationGCM"
			});
			// DevExpress.ui.notify('Đăng ký tin nhắn nhanh từ Cordova cho Android', 'info', 2000);se {
		} else {
			pushNotification.register(tokenHandler, errorHandler, {
				"badge" : "true",
				"sound" : "true",
				"alert" : "true",
				"ecb" : "onNotificationAPN"
			});
			DevExpress.ui.notify('Đăng ký tin nhắn nhanh', 'info', 1000);
		}
	}

}

function numberWithCommas(x) {
	if (x !== null && x !== undefined)
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return 0;
}

function validateEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

var DateDiff = {

	inDays : function(d1, d2) {
		var t2 = d2.getTime();
		var t1 = d1.getTime();

		return parseInt((t2 - t1) / (24 * 3600 * 1000));
	},

	inWeeks : function(d1, d2) {
		var t2 = d2.getTime();
		var t1 = d1.getTime();

		return parseInt((t2 - t1) / (24 * 3600 * 1000 * 7));
	},

	inMonths : function(d1, d2) {
		var d1Y = d1.getFullYear();
		var d2Y = d2.getFullYear();
		var d1M = d1.getMonth();
		var d2M = d2.getMonth();

		return (d2M + 12 * d2Y) - (d1M + 12 * d1Y);
	},

	inYears : function(d1, d2) {
		return d2.getFullYear() - d1.getFullYear();
	},

	showDiff : function(d1, d2) {
		var same = d1.getFullYear() === d2.getFullYear();
		same &= d1.getMonth() === d2.getMonth();
		same &= d1.getDate() === d2.getDate();
		if (same)
			return Globalize.format(d2, 'HH:mm') + ' hôm nay';
		var dateDiff = DateDiff.inDays(d1, d2);
		if (dateDiff === 1)
			return Globalize.format(d2, 'HH:mm') + ' hôm qua';
		return Globalize.format(d2, 'dd/MM/yyyy');
	}
};

function prepareLogout(message) {
	if (message === 'Bạn không có quyền truy cập' || (message === 'Lỗi mạng')) {
		var result = DevExpress.ui.dialog.confirm("Bạn cần đăng nhập lại, bạn có muốn chuyển đến trang đăng nhập?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult === true)
				MyApp.app.navigate({
					view : "user",
					id : "forced",
				}, {
					root : true
				});
		});
	} else {
		DevExpress.ui.dialog.alert(message, "Sendo.vn");
	}
}

