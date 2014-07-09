MyApp.chatdetails = function(params) {
	var viewModel = {
		// title : ko.observable(),
		chatDetailDataSource : ko.observableArray(),
		id : params.id,
		loadPanelVisible : ko.observable(false),
		viewShowing : function() {
			doLoadChatDetailData(true);
		},
		commentToPost : ko.observable(''),
		thumbnail : ko.observable(''),
		productname : ko.observable(''),
		productprice : ko.observable(''),
		viewShown : function() {
			// $("#chatScroll").height($("#content").height() - $("#chatinfo").outerHeight(true) - $("#productinfo").outerHeight(true) - $("#chatcomment").outerHeight(true) - 10);
			$("#chatScroll").height($("#content").height() - $("#chattopbar").outerHeight(true) - $("#chatcomment").outerHeight(true));
		}
	};
	doLoadChatDetailData = function(showloading) {
		if (showloading) {
			viewModel.loadPanelVisible(true);
		}
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();

		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ListCommentById";
		return $.post(url, {
			TokenId : tokenId,
			Id : viewModel.id
		}, function(data) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			if (data.Data === null || data.Data.data === null || data.Data.data.length === 0)
				return;
			viewModel.productname(data.Data.Product_name);
			viewModel.productprice(numberWithCommas(data.Data.Product_price));
			viewModel.thumbnail(data.Data.Product_thumb);
			var result = $.map(data.Data.data, function(item) {
				var today = new Date();
				var date = convertDate(item.Time);
				var isSameDay = (date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear());
				var dateString = isSameDay ? Globalize.format(date, 'hh:mm') : Globalize.format(date, 'dd-MM-yy');
				var message = item.Content;
				var isShop = item.Customer_type === "2";
				var name = isShop ? 'Shop' : item.Customer_name;
				dateString = name + ' | ' + dateString;
				return {
					name : name,
					date : dateString,
					id : item.ProductId,
					msg : message,
					isParent : item.IsParent,
					isShop : isShop
				};
			});
			viewModel.chatDetailDataSource(result);
			// var chatScroll = $("#chatScroll").dxScrollView("instance");
			// var scrollHeight = chatScroll.scrollHeight();
			// $("#chatScroll").dxScrollView("instance").scrollTo(scrollHeight);

		}, "json").fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});

	};
	postComment = function() {
		if (viewModel.commentToPost().length === 0)
			return;
		var today = new Date();
		var dateString = Globalize.format(today, 'hh:mm');
		var name = 'Shop';
		dateString = name + ' | ' + dateString;
		var message = viewModel.commentToPost();
		viewModel.chatDetailDataSource.push({
			name : name,
			date : dateString,
			id : viewModel.id,
			msg : message,
			isParent : false,
			isShop : true
		});
		// var chatScroll = $("#chatScroll").dxScrollView("instance");
		// var scrollHeight = chatScroll.scrollHeight();
		// $("#chatScroll").dxScrollView("instance").scrollTo(scrollHeight);
		// viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/SendComment";
		var msg = viewModel.commentToPost();
		viewModel.commentToPost('');
		return $.post(url, {
			TokenId : tokenId,
			Id : viewModel.id,
			Message : msg
		}, "json").done(function(data) {
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}

			doLoadChatDetailData(false);
		}).fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});

	};
	return viewModel;
};
