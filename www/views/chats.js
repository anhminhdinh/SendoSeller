MyApp.chats = function(params) {
	var viewModel = {
		// dataSource : ko.observableArray(),
		viewShowing : function() {
			if (window.sessionStorage.getItem("MyTokenId") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined
				}, {
					root : true
				});
			} else {
				// chatIdsStore.clear();
				doLoadChatIdsData();
			}
		},
		viewShown : function() {
			var isAndroid = DevExpress.devices.real().platform === 'android';
			var obj = null;
			obj = $("#chatidlist");
			var list = obj.dxList("instance");
			list.option('showNextButton', isAndroid);
			list.option('pullRefreshEnabled', !isAndroid);
			// list.option('autoPagingEnabled', !isAndroid);
			loadImages();
		},
		loadPanelVisible : ko.observable(false),
	};

	var myUserName = window.localStorage.getItem("UserName");
	var chatIdsStore = new DevExpress.data.LocalStore({
		name : myUserName + "chatIdsStore",
		key : "id",
		flushInterval : 1000,
		// immediate: true,
	});
	chatsDataSource = new DevExpress.data.DataSource({
		store : chatIdsStore,
		sort : [{
			getter : 'updatedDate',
			desc : true
		}, {
			getter : 'createdDate',
			desc : true
		}],
		pageSize : 10
	});

	doLoadChatIdsData = function() {
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var myUserName = window.localStorage.getItem("UserName");
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var timeStamp = Number(window.localStorage.getItem(myUserName + "ListCommentTimeStamp"));
		if (timeStamp === null)
			timeStamp = 0;
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ListComment", {
			TokenId : tokenId,
			TimeStamp : timeStamp
		}, "json").done(function(data, textStatus) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}
			window.localStorage.setItem(myUserName + "ListCommentTimeStamp", data.TimeStamp);
			if ((data.Data === undefined) || (data.Data.data === undefined) || (data.Data.data.length === 0)) {
				return;
			}
			var result = $.map(data.Data.data, function(item) {
				var date = convertDate(item.Time);
				var dateString = Globalize.format(date, 'dd-MM-yy');
				var name = item.Customer_name.toUpperCase();
				var message = name + ' (' + dateString + '):\n' + item.Content;
				var updatedDate = convertDate(item.Time_update);
				var totalComment = item.SubLength + ' ';

				return {
					id : item.Id,
					name : item.Product_Name,
					thumbnail : item.Product_thumb,
					msg : message,
					// isParent : item.IsParent,
					updatedDate : updatedDate,
					createdDate : date,
					totalComment : totalComment,
				};
			});
			for (var i = 0; i < result.length; i++) {
				chatIdsStore.byKey(result[i].id).done(function(dataItem) {
					if (dataItem !== undefined)
						chatIdsStore.update(result[i].id, result[i]);
					else
						chatIdsStore.insert(result[i]);
				}).fail(function(error) {
					chatIdsStore.insert(result[i]);
				});
			}
			chatIdsStore.load();
			chatsDataSource.sort([{
				getter : 'updatedDate',
				desc : true
			}, {
				getter : 'createdDate',
				desc : true
			}]);
			chatsDataSource.pageIndex(0);
			chatsDataSource.load();
		}).fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});
	};

	textClicked = function(id) {
		MyApp.app.navigate({
			view : 'chatdetails',
			id : id
		});
	};

	loadImages = function() {
		jQuery("img.product-thumbnail.lazy").lazy({
			effect : "fadeIn",
			effectTime : 1500
		});
	};

	return viewModel;
};
