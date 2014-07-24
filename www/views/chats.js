MyApp.chats = function(params) {
	var LOADSIZE = 100;
	var viewModel = {
		// dataSource : ko.observableArray(),
		nextPageId : ko.observable(params.id),
		chatIdsStore : ko.observable(),
		chatsDataSource : ko.observable(),
		viewShowing : function() {
			var platform = DevExpress.devices.real().platform;
			viewModel.isAndroid(platform === 'android' || platform === 'generic');

			var myUserName = window.localStorage.getItem("UserName");
			viewModel.chatIdsStore(new DevExpress.data.LocalStore({
				name : myUserName + "chatIdsStore",
				key : "id",
				// flushInterval : 1000,
				immediate : true,
			}));
			viewModel.chatsDataSource(new DevExpress.data.DataSource({
				store : viewModel.chatIdsStore(),
				sort : [{
					getter : 'updatedDate',
					desc : true
				}, {
					getter : 'createdDate',
					desc : true
				}],
				postProcess : groupByData,
				pageSize : LOADSIZE
			}));

			if (window.sessionStorage.getItem("MyTokenId") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined
				}, {
					root : true
				});
			}
		},
		loadFrom : ko.observable(0),
		isAndroid : ko.observable(false),
		showRefresh : ko.observable(false),
		viewShown : function() {
			// var obj = null;
			// obj = $("#chatidlist");
			// var list = obj.dxList("instance");
			// if (viewModel.isAndroid())
			// list.option('useNativeScrolling', false);
			// list.option('showNextButton', viewModel.isAndroid());
			// list.option('pullRefreshEnabled', !isAndroid);
			// list.option('autoPagingEnabled', !isAndroid);
			var myUserName = window.localStorage.getItem("UserName");
			if ((window.sessionStorage.getItem(myUserName + "firstloadchats") === null) || (window.sessionStorage.getItem("MustRefreshChat") === true)) {
				window.sessionStorage.setItem(myUserName + "firstloadchats", true);
				window.sessionStorage.removeItem("MustRefreshChat");
				doLoadChatIdsData();
			}

		},
		loadPanelVisible : ko.observable(false),
	};

	function groupByData(data) {
		var result = [], Items = [];

		// Fill intervals
		$.each(data, function() {
			Items.push(this);
		});

		// Construct final result
		if (Items.length)
			result.push({
				key : "Danh sách hỏi đáp",
				items : Items
			});

		return result;
	}

	doLoadChatIdsData = function() {
		var obj = $("#chatidlist");
		var list = obj.dxList("instance");
		list.option('noDataText', '');
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
		if (from > 0)
			timeStamp = 0;
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ListComment";
		return $.post(url, {
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
			viewModel.showRefresh(data.Data === null || data.Data.length === 0 || viewModel.isAndroid());

			if ((data.Data === undefined) || (data.Data.data === undefined) || (data.Data.data.length === 0)) {
				viewModel.chatsDataSource().pageIndex(0);
				viewModel.chatIdsStore().load().done(function() {
					viewModel.chatsDataSource().sort([{
						getter : 'updatedDate',
						desc : true
					}, {
						getter : 'createdDate',
						desc : true
					}]);
					viewModel.chatsDataSource().load();
				});
				list.option('noDataText', 'Shop của bạn chưa có câu hỏi nào.');
				return;
			}
			var result = $.map(data.Data.data, function(item) {
				var date = convertDate(item.Time);
				var name = item.Customer_name;
				var message = item.Content;
				var updatedDate = convertDate(item.Time_update);
				var today = new Date();
				var dateString = DateDiff.showDiff(today, updatedDate);
				var totalComment = item.SubLength + ' ';

				return {
					id : item.Id,
					name : name,
					productName : item.Product_Name,
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
				viewModel.chatIdsStore().byKey(result[i].id).done(function(dataItem) {
					if (dataItem !== undefined)
						viewModel.chatIdsStore().update(result[i].id, result[i]);
					else
						viewModel.chatIdsStore().insert(result[i]);
				}).fail(function(error) {
					viewModel.chatIdsStore().insert(result[i]);
				});
			}
			viewModel.chatsDataSource().pageIndex(0);
			viewModel.chatIdsStore().load().done(function() {
				viewModel.chatsDataSource().sort([{
					getter : 'updatedDate',
					desc : true
				}, {
					getter : 'createdDate',
					desc : true
				}]);
				viewModel.chatsDataSource().load();
				loadChatsImages();
				if ((viewModel.nextPageId() !== null) && (viewModel.nextPageId() !== undefined)) {
					MyApp.app.navigate({
						view : "chatdetails",
						id : viewModel.nextPageId(),
					});
					viewModel.nextPageId(null);
				}
			});
		}).fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			viewModel.showRefresh(true);
		});
	};

	loadNextChats = function() {
		var page = viewModel.chatsDataSource()._pageIndex;
		var pageSize = viewModel.chatsDataSource()._pageSize;
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
		viewModel.chatIdsStore().byKey(e.itemData.id).done(function(dataItem) {
			dataItem.read = true;
			viewModel.chatIdsStore().update(e.itemData.id, dataItem);
			viewModel.chatsDataSource().load();
		});
		MyApp.app.navigate({
			view : 'chatdetails',
			id : e.itemData.id
		});
	};

	return viewModel;
};
