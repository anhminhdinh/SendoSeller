MyApp.chats = function(params) {
	var LOADSIZE = 100;
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
		loadFrom : ko.observable(0),
		viewShown : function() {
			var platform = DevExpress.devices.real().platform;
			var isAndroid = platform === 'android' || platform === 'generic';
			var obj = null;
			obj = $("#chatidlist");
			var list = obj.dxList("instance");
			list.option('showNextButton', isAndroid);
			list.option('pullRefreshEnabled', !isAndroid);
			// list.option('autoPagingEnabled', !isAndroid);
			loadChatsImages();
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
		}, {
			getter : 'read',
			desc : true
		}],
		pageSize : LOADSIZE
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
		var from = viewModel.loadFrom();
		var to = viewModel.loadFrom() + LOADSIZE - 1;
		if (viewModel.loadFrom() > 0)
			timeStamp = 0;
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ListComment", {
			TokenId : tokenId,
			TimeStamp : timeStamp,
			From : from,
			To : to
		}, "json").done(function(data, textStatus) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			if (viewModel.loadFrom() === 0)
				window.localStorage.setItem(myUserName + "ListCommentTimeStamp", data.TimeStamp);
			if ((data.Data === undefined) || (data.Data.data === undefined) || (data.Data.data.length === 0)) {
				return;
			}
			var result = $.map(data.Data.data, function(item) {
				var date = convertDate(item.Time);
				var name = item.Customer_name.toUpperCase();
				var message = item.Content;
				var updatedDate = convertDate(item.Time_update);
				var today = new Date();
				var dateString = DateDiff.showDiff(today, updatedDate);
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
					read : false,
					customerName : name,
					dateString : dateString,
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
			chatIdsStore.load().done(function() {
				chatsDataSource.sort([{
					getter : 'updatedDate',
					desc : true
				}, {
					getter : 'createdDate',
					desc : true
				}]);
			});
			chatsDataSource.pageIndex(0);
			chatsDataSource.load();
		}).fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});
	};

	loadNextChats = function() {
		var page = chatsDataSource._pageIndex;
		var pageSize = chatsDataSource._pageSize;
		var currentView = (page + 2) * pageSize;
		if (currentView >= viewModel.loadFrom() + LOADSIZE - 1) {
			doLoadChatIdsData();
			viewModel.loadFrom(viewModel.loadFrom() + LOADSIZE);
		}
		loadChatsImages();
	};

	loadChatsImages = function() {
		jQuery("img.product-thumbnail.lazy").lazy({
			effect : "fadeIn",
			effectTime : 1500
		});
	};

	showChatDetails = function(e) {
		chatIdsStore.byKey(e.itemData.id).done(function(dataItem) {
			dataItem.read = true;
			chatIdsStore.update(e.itemData.id, dataItem);
		});
		MyApp.app.navigate({
			view : 'chatdetails',
			id : e.itemData.id
		});
	};

	return viewModel;
};
