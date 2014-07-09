MyApp.orders = function(id, params) {
	var LOADSIZE = 50;
	var NEW_ORDER = "New", PROCESSING_ORDER = "Processing", DELAYED_ORDER = "Delayed", DELAYING_ORDER = "Delaying", SHIPPING_ORDER = "Shipping", SPLITTED_ORDER = "Splitted";
	var myUserName = window.localStorage.getItem("UserName");

	// ordersStore = new DevExpress.data.LocalStore({
	// type : "local",
	// name : myUserName + "OrdersStore",
	// key : "orderNumber",
	// flushInterval : 1000,
	// // immediate : true,
	// });
	var viewModel = {
		viewShowing : function() {
			if (window.sessionStorage.getItem("MyTokenId") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined
				}, {
					root : true
				});
			} else {
				if (window.sessionStorage.getItem("firstloadorder") === null) {
					window.sessionStorage.setItem("firstloadorder", true);
					viewModel.ordersStore.clear();
					var myUserName = window.localStorage.getItem("UserName");
					window.localStorage.removeItem(myUserName + "OrdersTimeStamp" + NEW_ORDER);
					window.localStorage.removeItem(myUserName + "OrdersTimeStamp" + PROCESSING_ORDER);
					window.localStorage.removeItem(myUserName + "OrdersTimeStamp" + DELAYED_ORDER);
					window.localStorage.removeItem(myUserName + "OrdersTimeStamp" + DELAYING_ORDER);
					window.localStorage.removeItem(myUserName + "OrdersTimeStamp" + SHIPPING_ORDER);
					window.localStorage.removeItem(myUserName + "OrdersTimeStamp" + SPLITTED_ORDER);
					// refreshAll();
					doLoadDataByOrderStatus(NEW_ORDER);
				} else {
					doReloadPivot(NEW_ORDER);
					// doReloadPivot(PROCESSING_ORDER);
					// doReloadPivot(DELAYED_ORDER);
					// doReloadPivot(DELAYING_ORDER);
					// doReloadPivot(SHIPPING_ORDER);
					// doReloadPivot(SPLITTED_ORDER);
				}
			}
		},
		loadFrom : ko.observable(0),
		viewShown : function() {
			var platform = DevExpress.devices.real().platform;
			var isAndroid = platform === 'android' || platform === 'generic';
			var obj = null;
			obj = $("#listNew");
			var list = obj.dxList("instance");
			list.option('showNextButton', isAndroid);
			list.option('pullRefreshEnabled', !isAndroid);
			loadNextImages();
			var objPivot = $("#pivot").dxPivot("instance");
			objPivot.option('selectedIndex', 0);
			refreshPivot();
		},
		selectNewTab : function(input) {
			var platform = DevExpress.devices.real().platform;
			var isAndroid = platform === 'android' || platform === 'generic';
			var obj = null;
			var id = "#list";
			var order = null;
			switch (input.selectedIndex) {
				case 0:
					order = NEW_ORDER;
					break;
				case 1:
					order = PROCESSING_ORDER;
					break;
				case 2:
					order = DELAYING_ORDER;
					break;
				case 3:
					order = DELAYED_ORDER;
					break;
				case 4:
					order = SPLITTED_ORDER;
					break;
				case 5:
					order = SHIPPING_ORDER;
					break;
			}
			if (window.sessionStorage.getItem("firstload" + order) === null) {
				window.sessionStorage.setItem("firstload" + order, true);
				doLoadDataByOrderStatus(order);
			}
			obj = $(id + order);
			var list = obj.dxList("instance");
			list.option('showNextButton', isAndroid);
			list.option('pullRefreshEnabled', !isAndroid);
			// list.option('autoPagingEnabled', !isAndroid);
		},
		username : ko.observable(),
		pass : ko.observable(),

		actionSheetVisible : ko.observable(false),
		dropDownMenuData : [{
			text : "Còn hàng",
			clickAction : function() {
				processActionSheet(PROCESSING_ORDER);
			},
			disabled : ko.observable(true),
		}, {
			text : "Hoãn",
			clickAction : function() {
				processActionSheet("Delay");
			},
			disabled : ko.observable(true),
		}, {
			text : "Tách đơn hàng",
			clickAction : function() {
				processActionSheet("Split");
			},
			disabled : ko.observable(true),
		}, {
			text : "Hết hàng",
			clickAction : function() {
				processActionSheet("Cancel");
			},
			disabled : ko.observable(true),
		}, {
			text : "Gọi khách hàng",
			clickAction : function() {
				processActionSheet("Call");
			},
			disabled : ko.observable(true),
		}, {
			text : "Xem chi tiết",
			clickAction : function() {
				processActionSheet("Details");
			},
			// disabled : ko.observable(false),
		}],
		products : ko.observableArray([]),
		productsToSplit : ko.observableArray([]),
		cantSplitCurrentItem : ko.observable(false),
		dataItem : ko.observable(),
		dateBoxValue : ko.observable(new Date()),
		popupDelayVisible : ko.observable(false),
		popupSplitVisible : ko.observable(false),
		loadPanelVisible : ko.observable(false),
		showActionSheet : function(e) {
			var orderNumber = e.model.orderNumber;
			viewModel.ordersStore.byKey(orderNumber).done(function(dataItem) {
				var idOrderNumber = "#" + orderNumber;
				var actionSheet = $("#actionsheet").dxActionSheet("instance");
				// actionSheet.option('target', idOrderNumber);
				actionSheet.option('target', "#bottom");
				viewModel.dataItem(dataItem);
				viewModel.products(dataItem.products);
				viewModel.dropDownMenuData[0].disabled(!dataItem.canProcess);
				viewModel.dropDownMenuData[1].disabled(!dataItem.canDelay);
				viewModel.dropDownMenuData[2].disabled(!dataItem.canSplit);
				viewModel.dropDownMenuData[3].disabled(!dataItem.canCancel);
				viewModel.dropDownMenuData[4].disabled(dataItem.buyerPhone === null);
				viewModel.actionSheetVisible(true);
			});
			e.jQueryEvent.stopPropagation();
		},
		// dataStore : ordersStore,
		ordersStore : new DevExpress.data.LocalStore({
			type : "local",
			name : myUserName + "OrdersStore",
			key : "orderNumber",
			// flushInterval : 1000,
			immediate : true,
		}),
	};

	showLoading = function(show) {
		viewModel.loadPanelVisible(show);
	};

	hideSplitPopUp = function() {
		viewModel.loadPanelVisible(false);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.hideBusyIndicator();
		viewModel.popupSplitVisible(false);
	};

	hideDelayPopUp = function() {
		viewModel.loadPanelVisible(false);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.hideBusyIndicator();
		viewModel.popupDelayVisible(false);
	};

	doReloadPivot = function(status) {
		viewModel.ordersStore.load().done(function(result) {
			switch (status) {
				case NEW_ORDER:
					newDataSource.filter("status", status);
					newDataSource.pageIndex(0);
					newDataSource.sort({
						getter : 'orderDate',
						desc : true
					});
					newDataSource.load().done(function(results) {
						$("#list" + status).dxList("instance").option('dataSource', results);
					});
					break;
				case PROCESSING_ORDER:
					processingDataSource.filter("status", status);
					processingDataSource.pageIndex(0);
					processingDataSource.sort({
						getter : 'orderDate',
						desc : true
					});
					processingDataSource.load().done(function(results) {
						$("#list" + status).dxList("instance").option('dataSource', results);
					});
					break;
				case DELAYED_ORDER:
					delayedDataSource.filter("status", status);
					delayedDataSource.pageIndex(0);
					delayedDataSource.sort({
						getter : 'orderDate',
						desc : true
					});
					delayedDataSource.load().done(function(results) {
						$("#list" + status).dxList("instance").option('dataSource', results);
					});
					break;
				case DELAYING_ORDER:
					delayingDataSource.filter("status", status);
					delayingDataSource.pageIndex(0);
					delayingDataSource.sort({
						getter : 'orderDate',
						desc : true
					});
					delayingDataSource.load().done(function(results) {
						$("#list" + status).dxList("instance").option('dataSource', results);
					});
					break;
				case SHIPPING_ORDER:
					shippingDataSource.filter("status", status);
					shippingDataSource.pageIndex(0);
					shippingDataSource.sort({
						getter : 'orderDate',
						desc : true
					});
					shippingDataSource.load().done(function(results) {
						$("#list" + status).dxList("instance").option('dataSource', results);
					});
					break;
				case SPLITTED_ORDER:
					splittedDataSource.filter("status", status);
					splittedDataSource.pageIndex(0);
					splittedDataSource.sort({
						getter : 'orderDate',
						desc : true
					});
					splittedDataSource.load().done(function(results) {
						$("#list" + status).dxList("instance").option('dataSource', results);
					});
					break;
			}
		});
	};

	doCancelOrder = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var postOrderNumber = Number(viewModel.dataItem().orderId);
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ProcessOrder";
		return $.post(url, {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : "Cancel",
		}, "json").done(function(data) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			var orderRemove = item.orderNumber;
			viewModel.ordersStore.remove(orderRemove);
			doLoadDataByOrderStatus(oldStatus);
			// doLoadDataByOrderStatus("Cancel");
		}).fail(function(jqxhr, textStatus, error) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});
	};

	doProcessOrder = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var postOrderNumber = Number(viewModel.dataItem().orderId);
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ProcessOrder";
		return $.post(url, {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : PROCESSING_ORDER,
		}, "json").done(function(data, textStatus) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			var orderRemove = item.orderNumber;
			viewModel.ordersStore.remove(orderRemove);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus(PROCESSING_ORDER);
		}).fail(function(jqxhr, textStatus, error) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	doSplitOrder = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var splitIDs = [];
		for (var i = 0; i < viewModel.productsToSplit().length; i++) {
			// var product = {
			// Id : viewModel.productsToSplit()[i].id
			// };
			// splitIDs.push(product);
			splitIDs.push(viewModel.productsToSplit()[i].id);
		}
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var postOrderNumber = Number(viewModel.dataItem().orderId);
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ProcessOrder";
		return $.post(url, {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : "Splitting",
			ProductSplits : splitIDs
		}, "json").done(function(data) {
			hideSplitPopUp();
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			var orderRemove = item.orderNumber;
			viewModel.ordersStore.remove(orderRemove);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus(SPLITTED_ORDER);
		}).fail(function(jqxhr, textStatus, error) {
			hideSplitPopUp();
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	doDelayOrder = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var newDelayDate = new Date(viewModel.dateBoxValue());
		var postOrderNumber = Number(viewModel.dataItem().orderId);
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ProcessOrder";
		var delayDate = Number(newDelayDate.getTime() / 1000);
		return $.post(url, {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : DELAYED_ORDER,
			DelayDate : delayDate
		}, "json").done(function(data, textStatus) {
			hideDelayPopUp();
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			var orderRemove = item.orderNumber;
			viewModel.ordersStore.remove(orderRemove);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus(DELAYING_ORDER);
		}).fail(function(jqxhr, textStatus, error) {
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			hideDelayPopUp();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	function groupByDate(data) {
		var MS_PER_DAY = 24 * 60 * 60 * 1000, result = [], todayItems = [], yesterdayItems = [], thisWeekItems = [], otherItems = [];

		// Fill intervals
		$.each(data, function() {
			var today = new Date();
			var now = today.getTime();
			var orderDate = new Date(this.orderDate);
			var orderTime = orderDate.getTime();
			var daysAgo = (now - orderTime) / MS_PER_DAY;
			var sameDay = today.getFullYear() === orderDate.getFullYear();
			sameDay &= today.getMonth() === orderDate.getMonth();
			sameDay &= today.getDate() === orderDate.getDate();
			if (sameDay)
				todayItems.push(this);
			else if (daysAgo < 1)
				yesterdayItems.push(this);
			else if (daysAgo < 7)
				thisWeekItems.push(this);
			else
				otherItems.push(this);
		});

		// Construct final result
		if (todayItems.length)
			result.push({
				key : "Hôm nay",
				items : todayItems
			});

		if (yesterdayItems.length)
			result.push({
				key : "Hôm qua",
				items : yesterdayItems
			});

		if (thisWeekItems.length)
			result.push({
				key : "Tuần này",
				items : thisWeekItems
			});

		if (otherItems.length)
			result.push({
				key : "Đơn hàng cũ",
				items : otherItems
			});

		return result;
	}

	newDataSource = new DevExpress.data.DataSource({
		store : viewModel.ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", NEW_ORDER],
	});

	processingDataSource = new DevExpress.data.DataSource({
		store : viewModel.ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", PROCESSING_ORDER]
	});

	delayedDataSource = new DevExpress.data.DataSource({
		store : viewModel.ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", DELAYED_ORDER]
	});

	delayingDataSource = new DevExpress.data.DataSource({
		store : viewModel.ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", DELAYING_ORDER]
	});

	shippingDataSource = new DevExpress.data.DataSource({
		store : viewModel.ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", SHIPPING_ORDER]
	});

	splittedDataSource = new DevExpress.data.DataSource({
		store : viewModel.ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", SPLITTED_ORDER]
	});

	items = [{
		title : "Mới",
		dataName : NEW_ORDER,
		listItems : newDataSource
	}, {
		title : "Đang xử lý",
		dataName : PROCESSING_ORDER,
		listItems : processingDataSource
	}, {
		title : "Đang chờ hoãn",
		dataName : DELAYING_ORDER,
		listItems : delayingDataSource
	}, {
		title : "Đang hoãn",
		dataName : DELAYED_ORDER,
		listItems : delayedDataSource
	}, {
		title : "Đang chờ tách",
		dataName : SPLITTED_ORDER,
		listItems : splittedDataSource
	}, {
		title : "Đang vận chuyển",
		dataName : SHIPPING_ORDER,
		listItems : shippingDataSource
	}];

	processActionSheet = function(text) {
		switch (text) {
			case PROCESSING_ORDER:
				doProcessOrder();
				break;
			case "Delay":
				viewModel.popupDelayVisible(true);
				break;
			case "Split":
				viewModel.productsToSplit().length = 0;
				for (var i = 0; i < viewModel.products().length; i++) {
					var product = {
						name : viewModel.products()[i].name,
						id : viewModel.products()[i].id,
						thumbnail : viewModel.products()[i].thumbnail,
						stockAvailability : viewModel.products()[i].stockAvailabilityDisplay
					};
					viewModel.productsToSplit().push(product);
				}

				viewModel.popupSplitVisible(true);
				var totalHeight = $("#popupSplitContent").height();
				var footerHeight = $("#popupSplitFooter").height();
				$("popupSplitList").height(totalHeight - footerHeight);

				$("#popupSplitList").dxList('instance').option('dataSource', viewModel.productsToSplit());
				viewModel.cantSplitCurrentItem(true);
				break;
			case NEW_ORDER:
				doNewOrder();
				break;
			case "Cancel":
				doCancelOrder();
				break;
			case "Call":
				window.location = 'tel:' + viewModel.dataItem().buyerPhone;
				break;
			case "Details":
				showDetail();
				break;
		}
	};

	doLoadDataByOrderStatus = function(status) {
		// DevExpress.ui.notify("loading data", "info", 1000);
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var myUserName = window.localStorage.getItem("UserName");
		var timeStamp = Number(window.localStorage.getItem(myUserName + "OrdersTimeStamp" + status));
		if (timeStamp === null)
			timeStamp = 0;
		var from = viewModel.loadFrom();
		var to = viewModel.loadFrom() + LOADSIZE - 1;
		if (viewModel.loadFrom() > 0)
			timeStamp = 0;

		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ListSalesOrderByStatus";
		return $.post(url, {
			TokenId : tokenId,
			Status : status,
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
			if ((data.Data === null) || (data.Data.length === 0)) {
				doReloadPivot(status);
				return;
			}
			if (viewModel.loadFrom() === 0)
				window.localStorage.setItem(myUserName + "OrdersTimeStamp" + status, data.TimeStamp);
			var result = $.map(data.Data, function(item) {
				var itemOrderDate = convertDate(item.OrderDate);
				var today = new Date();
				// var orderDateString = Globalize.format(itemOrderDate, 'dd/MM/yyyy');
				var orderDateString = DateDiff.showDiff(today, itemOrderDate);
				var itemDelayDate = convertDate(item.DelayDate);

				var delayDateString = Globalize.format(itemDelayDate, 'dd/MM/yyyy');
				var itemProducts = $.map(item.Products, function(product) {
					var price = numberWithCommas(product.Price);
					return {
						id : product.Id,
						name : product.Name,
						storeSku : product.StoreSku,
						quantity : product.Quantity,
						thumbnail : product.Thumnail,
						price : price,
						weight : product.Weight,
						upProductDate : product.UpProductDate,
						updatedDate : product.UpdatedDate,
						description : product.Description,
					};
				});
				var totalAmount = numberWithCommas(item.TotalAmount);
				return {
					status : status,
					orderId : Number(item.Id),
					orderNumber : item.OrderNumber,
					orderDate : itemOrderDate,
					delayDate : itemDelayDate,
					paymentMethod : item.PaymentMethod,
					shippingMethod : item.ShippingType,
					shippingFee : item.ShippingFee,
					shippngSupport : item.SendoSupportFeeToBuyer,
					voucher : item.VoucherValue,
					orderDateDisplay : orderDateString,
					delayDateDisplay : delayDateString,
					buyerName : item.BuyerName,
					buyerAddress : item.BuyerAddress,
					buyerPhone : item.BuyerPhone,
					note : item.Note,
					totalAmount : totalAmount,
					updatedDate : item.UpdatedDate,
					canDelay : item.CanDelay,
					canCancel : item.CanCancel,
					canSplit : item.CanSplit,
					canProcess : item.CanProcess,
					products : itemProducts,
				};
			});

			for (var i = 0; i < result.length; i++) {
				viewModel.ordersStore.byKey(result[i].orderNumber).done(function(dataItem) {
					if (dataItem !== undefined)
						viewModel.ordersStore.update(result[i].orderNumber, result[i]);
					else
						viewModel.ordersStore.insert(result[i]);
				});
			}

			doReloadPivot(status);
		}).fail(function(jqxhr, textStatus, error) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	itemDeleted = function() {
		viewModel.cantSplitCurrentItem(viewModel.productsToSplit().length === 0);
	};

	showDetailsData = function(e) {
		MyApp.app.navigate({
			view : 'orderdetails',
			id : e.itemData.orderNumber,
		});
	};

	showDetail = function() {
		var orderId = viewModel.dataItem().orderNumber;
		MyApp.app.navigate({
			view : 'orderdetails',
			id : orderId,
		});
	};

	refreshAll = function() {
		doLoadDataByOrderStatus(NEW_ORDER);
		doLoadDataByOrderStatus(DELAYED_ORDER);
		doLoadDataByOrderStatus(PROCESSING_ORDER);
		doLoadDataByOrderStatus(DELAYING_ORDER);
		doLoadDataByOrderStatus(SHIPPING_ORDER);
		doLoadDataByOrderStatus(SPLITTED_ORDER);
	};

	refresh = function() {
		var objPivot = $("#pivot").dxPivot("instance");
		var currentIndex = objPivot.option('selectedIndex');
		switch (currentIndex) {
			case 0:
				doLoadDataByOrderStatus(NEW_ORDER);
				break;
			case 1:
				doLoadDataByOrderStatus(PROCESSING_ORDER);
				break;
			case 2:
				doLoadDataByOrderStatus(DELAYING_ORDER);
				break;
			case 3:
				doLoadDataByOrderStatus(DELAYED_ORDER);
				break;
			case 4:
				doLoadDataByOrderStatus(SPLITTED_ORDER);
				break;
			case 5:
				doLoadDataByOrderStatus(SHIPPING_ORDER);
				break;
		}
	};

	refreshPivot = function() {
		var objPivot = $("#pivot").dxPivot("instance");
		var currentIndex = objPivot.option('selectedIndex');
		switch (currentIndex) {
			case 0:
				doReloadPivot(NEW_ORDER);
				break;
			case 1:
				doReloadPivot(PROCESSING_ORDERDELAYED_ORDER);
				break;
			case 2:
				doReloadPivot(DELAYING_ORDER);
				break;
			case 3:
				doReloadPivot(DELAYED_ORDER);
				break;
			case 4:
				doReloadPivot(SPLITTED_ORDER);
				break;
			case 5:
				doReloadPivot(SHIPPING_ORDER);
				break;
		}
	};

	loadNextOrders = function(dataName) {
		var page = 0;
		var pageSize = 0;
		switch (dataName) {
			case NEW_ORDER:
				page = newDataSource._pageIndex;
				pageSize = newDataSource._pageSize;
				break;
			case PROCESSING_ORDER:
				page = processingDataSource._pageIndex;
				pageSize = processingDataSource._pageSize;
				break;
			case DELAYED_ORDER:
				page = delayedDataSource._pageIndex;
				pageSize = delayedDataSource._pageSize;
				break;
			case DELAYING_ORDER:
				page = delayingDataSource._pageIndex;
				pageSize = delayingDataSource._pageSize;
				break;
			case SPLITTED_ORDER:
				page = splittedDataSource._pageIndex;
				pageSize = splittedDataSource._pageSize;
				break;
			case SHIPPING_ORDER:
				page = shippingDataSource._pageIndex;
				pageSize = shippingDataSource._pageSize;
				break;
		}
		var currentView = (page + 2) * pageSize;
		if (currentView >= viewModel.loadFrom() + LOADSIZE - 1) {
			doLoadDataByOrderStatus(dataName);
			viewModel.loadFrom(viewModel.loadFrom() + LOADSIZE);
		}
		loadNextImages();
	};

	loadNextImages = function() {
		jQuery("img.product-thumbnail.lazy").lazy({
			effect : "fadeIn",
			effectTime : 1500
		});
	};

	return viewModel;
};
