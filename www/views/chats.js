MyApp.chats = function(params) {
	var LOADSIZE = 30;
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
				// postProcess : groupByData,
				pageSize : LOADSIZE
			}));

			if (window.sessionStorage.getItem("access_token") === null) {
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
			// var myUserName = window.localStorage.getItem("UserName");
			// var firstLoad = window.sessionStorage.getItem(myUserName + "firstloadchats");
			// console.log("firstLoad " + firstLoad);
			// var mustRefresh = window.sessionStorage.getItem("MustRefreshChat");
			// console.log("mustRefresh " + mustRefresh);
			// if ((firstLoad === null) || (mustRefresh !== null)) {
			// window.sessionStorage.setItem(myUserName + "firstloadchats", true);
			// window.sessionStorage.removeItem("MustRefreshChat");
			// doLoadChatIdsData(true);
			// console.log("doLoadChatIdsData");
			// } else {
			var currentChatRefresh = window.sessionStorage.getItem("MustNotRefreshCurrentChat");
			if (currentChatRefresh === null) {
				doLoadChatIdsData();
			} else {
				window.sessionStorage.removeItem("MustNotRefreshCurrentChat");
				var editedId = window.sessionStorage.getItem("editedChat");
				var editedQuantity = window.sessionStorage.getItem("editedChatQuantity");
				if (editedId !== null) {
					viewModel.chatIdsStore().byKey(editedId).done(function(dataItem) {
						dataItem.totalComment = editedQuantity;
						viewModel.chatIdsStore().update(editedId, dataItem);
						viewModel.chatsDataSource().load();
					});
				}
			}
			// }
		},
		loadPanelVisible : ko.observable(false),
		endOfList : ko.observable(false),
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

	doLoadChatIdsData = function(restart, previous) {
		if (restart === true) {
			viewModel.loadFrom(0);
		}
		if (previous === true) {
			var previousFrom = viewModel.loadFrom() - LOADSIZE;
			if (previousFrom < 0)
				previousFrom = 0;
			viewModel.loadFrom(previousFrom);
		}
		viewModel.chatIdsStore().clear();

		var obj = $("#chatidlist");
		var list = obj.dxList("instance");
		list.option('noDataText', '');
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var myUserName = window.localStorage.getItem("UserName");
		var timeStamp = Number(window.localStorage.getItem(myUserName + "ListCommentTimeStamp"));
		if (timeStamp === null)
			timeStamp = 0;
		var from = viewModel.loadFrom();
		var to = viewModel.loadFrom() + LOADSIZE;
		if (from > 0 || restart === true)
			timeStamp = 0;
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/Comment/ListComment";
		return $.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : JSON.stringify({
				TimeStamp : 0,
				From : from,
				To : to
			}),
			beforeSend : function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
			},
		}).done(function(data) {
			// console.log(JSON.stringify(data));
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				prepareLogout(data.Message);
				return;
			}
			if (viewModel.loadFrom() === 0)
				window.localStorage.setItem(myUserName + "ListCommentTimeStamp", data.TimeStamp);
			viewModel.showRefresh(data.Data === null || data.Data.length === 0 || viewModel.isAndroid());

			if ((data.Data === undefined) || (data.Data.data === undefined) || (data.Data.data.length === 0)) {
				viewModel.endOfList(true);
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
				message = message.replace(/([^\s-]{20})(?=[^\s-])/g, '$1 ');
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
					updatedDate : item.Time_update,
					createdDate : item.Time,
					totalComment : totalComment,
					read : false,
					customerName : name,
					dateString : dateString,
				};
			});
			for (var i = 0; i < result.length; i++)
				viewModel.chatIdsStore().insert(result[i]);

			// for (var i = 0; i < result.length; i++) {
			// viewModel.chatIdsStore().byKey(result[i].id).done(function(dataItem) {
			// if (dataItem !== undefined) {
			// viewModel.chatIdsStore().update(result[i].id, result[i]);
			// } else
			// viewModel.chatIdsStore().insert(result[i]);
			// }).fail(function(error) {
			// viewModel.chatIdsStore().insert(result[i]);
			// });
			// }
			viewModel.endOfList(result.length < LOADSIZE);
			viewModel.chatsDataSource().sort([{
				getter : 'updatedDate',
				desc : true
			}, {
				getter : 'createdDate',
				desc : true
			}]);
			viewModel.chatsDataSource().pageIndex(0);
			viewModel.chatsDataSource().load().done(function() {
				setTimeout(function() {
					DevExpress.ui.notify('Trang ' + (1 + (viewModel.loadFrom() / LOADSIZE)), 'info', 1000);
				}, 500);
				loadChatsImages();
				// DevExpress.ui.dialog.alert(viewModel.nextPageId(), "Sendo.vn");
				if ((viewModel.nextPageId() !== null) && (viewModel.nextPageId() !== undefined) && (viewModel.nextPageId() !== '')) {
					MyApp.app.navigate({
						view : "chatdetails",
						id : viewModel.nextPageId(),
					});
					viewModel.nextPageId(null);
				}
			});
		}).fail(function(jqxhr, textStatus, error) {
			prepareLogout("Lỗi mạng");
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			viewModel.showRefresh(true);
		});
	};

	loadNextChats = function() {
		var page = viewModel.chatsDataSource()._pageIndex;
		var pageSize = viewModel.chatsDataSource()._pageSize;
		var currentView = (page + 1) * pageSize;
		if (currentView >= LOADSIZE) {
			viewModel.loadFrom(viewModel.loadFrom() + LOADSIZE);
			doLoadChatIdsData(false);
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

	scrolled = function(e) {
		/*if (viewModel.isAndroid() === true) {
		 if (e.reachedBottom === true) {
		 if (viewModel.endOfList() === true)
		 if (viewModel.loadPanelVisible() === false)
		 setTimeout(function() {
		 DevExpress.ui.notify('Hết danh sách', 'info', 1000);
		 }, 500);
		 }
		 }*/
	};

	return viewModel;
};
