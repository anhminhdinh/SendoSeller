function convertDate(inputDateString) {
	if (inputDateString === null)
		return null;
	var dateString = inputDateString;
	if ((dateString.indexOf("+") === -1) && (dateString.indexOf("Z") === -1))
		dateString += 'Z';
	var date = new Date(dateString);
	return date;
}

function registerPush() {
	if ( typeof AppMobi === 'object') {
		var myUserName = window.localStorage.getItem("UserName");
		var didAddPushUser = window.localStorage.getItem(myUserName + "didAddPushUser");
		if (didAddPushUser === null) {
			//See if the push user exists already
			//We are just using the unique device id, but you can send any unique user id and password.
			var userId = window.localStorage.getItem(myUserName + "UserID");
			AppMobi.notification.checkPushUser(userId, "nopassword");
		}
	}
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}