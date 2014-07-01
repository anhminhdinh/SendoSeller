MyApp.orders = function(id, params) {
	var LOADSIZE = 50;
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
					ordersStore.clear();
					doReloadPivot("New");
					doReloadPivot("Processing");
					doReloadPivot("Delayed");
				}
				refreshAll();
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
			switch (input.selectedIndex) {
				case 0:
					obj = $("#listNew");
					break;
				case 1:
					obj = $("#listProcessing");
					break;
				case 2:
					obj = $("#listDelayed");
					break;
			}
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
				processActionSheet("Processing");
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
			ordersStore.byKey(orderNumber).done(function(dataItem) {
				var idOrderNumber = "#" + orderNumber;
				var actionSheet = $("#actionsheet").dxActionSheet("instance");
				actionSheet.option('target', idOrderNumber);
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
		switch (status) {
			case "New":
				newDataSource.filter("status", status);
				newDataSource.pageIndex(0);
				newDataSource.sort({
					getter : 'orderDate',
					desc : true
				});
				newDataSource.load().done(function(results) {
				});
				break;
			case "Processing":
				processingDataSource.filter("status", status);
				processingDataSource.pageIndex(0);
				processingDataSource.sort({
					getter : 'orderDate',
					desc : true
				});
				processingDataSource.load().done(function(results) {
				});
				break;
			case "Delayed":
				delayedDataSource.filter("status", status);
				delayedDataSource.pageIndex(0);
				delayedDataSource.sort({
					getter : 'orderDate',
					desc : true
				});
				delayedDataSource.load().done(function(results) {
				});
				break;
		}
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
			ordersStore.remove(orderRemove);
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
			Action : "Processing",
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
			ordersStore.remove(orderRemove);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus("Processing");
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
			ordersStore.remove(orderRemove);
			doLoadDataByOrderStatus(oldStatus);
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
			Action : "Delayed",
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
			ordersStore.remove(orderRemove);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus("Delayed");
		}).fail(function(jqxhr, textStatus, error) {
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			hideDelayPopUp();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	var myUserName = window.localStorage.getItem("UserName");

	ordersStore = new DevExpress.data.LocalStore({
		type : "local",
		name : myUserName + "OrdersStore",
		key : "orderNumber",
		flushInterval : 1000,
		// immediate : true,
	});

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
		store : ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", "New"],
	});

	processingDataSource = new DevExpress.data.DataSource({
		store : ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", "Processing"]
	});

	delayedDataSource = new DevExpress.data.DataSource({
		store : ordersStore,
		pageSize : 50,
		sort : {
			getter : 'orderDate',
			desc : true
		},
		// group : 'orderDate',
		postProcess : groupByDate,
		filter : ["status", "=", "Delayed"]
	});

	items = [{
		title : "Mới",
		dataName : "New",
		listItems : newDataSource
	}, {
		title : "Đang giao",
		dataName : "Processing",
		listItems : processingDataSource
	}, {
		title : "Đang hoãn",
		dataName : "Delayed",
		listItems : delayedDataSource
	}];

	processActionSheet = function(text) {
		switch (text) {
			case "Processing":
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
			case "New":
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
				ordersStore.byKey(result[i].orderNumber).done(function(dataItem) {
					if (dataItem !== undefined)
						ordersStore.update(result[i].orderNumber, result[i]);
					else
						ordersStore.insert(result[i]);
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
		doLoadDataByOrderStatus("New");
		doLoadDataByOrderStatus("Delayed");
		doLoadDataByOrderStatus("Processing");
	};

	refresh = function() {
		var objPivot = $("#pivot").dxPivot("instance");
		var currentIndex = objPivot.option('selectedIndex');
		switch (currentIndex) {
			case 0:
				doLoadDataByOrderStatus("New");
				break;
			case 1:
				doLoadDataByOrderStatus("Delayed");
				break;
			case 2:
				doLoadDataByOrderStatus("Processing");
				break;
		}
	};

	refreshPivot = function() {
		var objPivot = $("#pivot").dxPivot("instance");
		var currentIndex = objPivot.option('selectedIndex');
		switch (currentIndex) {
			case 0:
				doReloadPivot("New");
				break;
			case 1:
				doReloadPivot("Delayed");
				break;
			case 2:
				doReloadPivot("Processing");
				break;
		}
	};

	loadNextOrders = function(dataName) {
		var page = 0;
		var pageSize = 0;
		switch (dataName) {
			case "New":
				page = newDataSource._pageIndex;
				pageSize = newDataSource._pageSize;
				break;
			case "Processing":
				page = processingDataSource._pageIndex;
				pageSize = processingDataSource._pageSize;
				break;
			case "Delayed":
				page = delayedDataSource._pageIndex;
				pageSize = delayedDataSource._pageSize;
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
