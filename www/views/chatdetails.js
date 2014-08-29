MyApp.chatdetails = function(params) {
	var viewModel = {
		// title : ko.observable(),
		chatDetailDataSource : ko.observableArray(),
		id : params.id,
		loadPanelVisible : ko.observable(false),
		isAndroid : ko.observable(false),
		showProductInfo : ko.observable(false),
		viewShowing : function() {
			window.sessionStorage.setItem("MustNotRefreshCurrentChat", true);
			var platform = DevExpress.devices.real().platform;
			viewModel.isAndroid(platform === 'android' || platform === 'generic');
			viewModel.showProductInfo(false);
			doLoadChatDetailData(true);
		},
		commentToPost : ko.observable(''),
		thumbnail : ko.observable(''),
		productname : ko.observable('Tên sản phẩm'),
		productprice : ko.observable('100,000'),
		viewShown : function() {
			// $("#chatScroll").height($("#content").height() - $("#chatinfo").outerHeight(true) - $("#productinfo").outerHeight(true) - $("#chatcomment").outerHeight(true) - 10);
			var contentHeight = $("#content").height();
			var chatScroll = $("#chatScroll");
			var chatTopBar = $("#chattopbar");
			var chatComment = $("#chatcomment");
			var topBarHeight = chatTopBar.outerHeight(true);
			var commentHeight = chatComment.outerHeight(true);
			var chatScrollHeight = contentHeight - commentHeight - topBarHeight;
			chatScroll.height(chatScrollHeight);
		}
	};
	doLoadChatDetailData = function(showloading) {
		if (showloading) {
			viewModel.loadPanelVisible(true);
		}
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();

		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/Comment/ListCommentById";
		$.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : JSON.stringify({
				Id : viewModel.id
			}),
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
			if (data.Data === null || data.Data.data === null || data.Data.data.length === 0) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				window.sessionStorage.removeItem("MustNotRefreshCurrentChat");
				MyApp.app.back();
				return;
			}
			viewModel.productname(data.Data.Product_name);
			viewModel.productprice(numberWithCommas(data.Data.Product_price));
			viewModel.thumbnail(data.Data.Product_thumb);
			viewModel.showProductInfo(true);
			var result = $.map(data.Data.data, function(item) {
				var today = new Date();
				var date = convertDate(item.Time);
				var isSameDay = (date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear());
				var dateString = isSameDay ? Globalize.format(date, 'HH:mm') : Globalize.format(date, 'dd-MM-yy');
				var message = item.Content;
				message = message.replace(/([^\s-]{20})(?=[^\s-])/g, '$1 ');
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
			// var chatIdsStore = new DevExpress.data.LocalStore({
			// name : myUserName + "chatIdsStore",
			// key : "id",
			// // flushInterval : 1000,
			// immediate : true,
			// });
			// chatIdsStore.byKey(viewModel.id).done(function(dataItem){
			// dataItem.totalComment = result.length;
			// chatIdsStore.update(viewModel.id, dataItem);
			// });
			// setTimeout(function() {
			var chatScroll = $("#chatScroll").dxScrollView("instance");
			chatScroll.update(true);
			var scrollHeight = chatScroll.scrollHeight();
			chatScroll.scrollBy(scrollHeight);
			// }, 1500);

		}, "json").fail(function(jqxhr, textStatus, error) {
			prepareLogout("Lỗi mạng");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});
	};

	refreshChatData = function(actionOptions) {
		doLoadChatDetailData(true);
		actionOptions.component.release();
	};

	postComment = function() {
		viewModel.commentToPost(viewModel.commentToPost().trim());
		if (viewModel.commentToPost().length === 0)
			return;
		var chatScroll = $("#chatScroll").dxScrollView("instance");
		var today = new Date();
		var dateString = Globalize.format(today, 'HH:mm');
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
		chatScroll.update(true);
		var newScrollHeight = chatScroll.scrollHeight();
		// setTimeout(function() {
		chatScroll.scrollTo(newScrollHeight);
		//(newScrollHeight - scrollHeight);
		// }, 1500);

		// viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var domain = window.sessionStorage.getItem("domain");
		viewModel.commentToPost('');
		var url = domain + "/api/Comment/SendComment";
		return $.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : JSON.stringify({
				Id : viewModel.id,
				Message : message
			}),
			beforeSend : function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
			},
		}).done(function(data) {
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				prepareLogout(data.Message);
				return;
			}
			// window.sessionStorage.removeItem("MustNotRefreshCurrentChat");
			window.sessionStorage.setItem("editedChat", viewModel.id);
			window.sessionStorage.setItem("editedChatQuantity", viewModel.chatDetailDataSource().length);

			doLoadChatDetailData(false);
		}).fail(function(jqxhr, textStatus, error) {
			prepareLogout("Lỗi mạng");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});

	};
	return viewModel;
};
