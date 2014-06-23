MyApp.chatdetails = function(params) {
	var viewModel = {
		// title : ko.observable(),
		chatDetailDataSource : ko.observableArray(),
		id : params.id,
		productName : ko.observable(''),
		loadPanelVisible : ko.observable(false),
		viewShowing : function() {
			doLoadChatDetailData();
		},
		commentToPost : ko.observable(''),
	};
	doLoadChatDetailData = function() {
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();

		var tokenId = window.sessionStorage.getItem("MyTokenId");
		$.post("http://180.148.138.140/sellerTest2/api/mobile/ListCommentById", {
			TokenId : tokenId,
			Id : viewModel.id
		}, function(data) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}
			if (data.Data === null || data.Data.data === null || data.Data.data.length === 0)
				return;
			var result = $.map(data.Data.data, function(item) {
				var today = new Date();
				var date = convertDate(item.Time);
				var isSameDay = (date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear());
				var dateString = isSameDay ? Globalize.format(date, 'hh:mm') : Globalize.format(date, 'dd-MM-yy');
				var name = item.Customer_name;
				dateString = name + ' | ' + dateString;
				var message = item.Content;
				var isShop = item.Customer_type === "2";
				return {
					name : name,
					date : dateString,
					id : item.ProductId,
					msg : message,
					isParent : item.IsParent,
					isShop : isShop
				};
			});
			viewModel.productName(data.Data.ProductName);
			viewModel.chatDetailDataSource(result);
			var chatScroll = $("#chatScroll").dxScrollView("instance");
			var scrollHeight = chatScroll.scrollHeight();
			$("#chatScroll").dxScrollView("instance").scrollTo(scrollHeight);

		}, "json").fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});

	};
	postComment = function() {
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		$.post("http://180.148.138.140/sellerTest2/api/mobile/SendComment", {
			TokenId : tokenId,
			Id : viewModel.id,
			Message : viewModel.commentToPost()
		}, "json").done(function(data) {
			viewModel.commentToPost('');
			doLoadChatDetailData();
		}).fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});

	};
	return viewModel;
};
