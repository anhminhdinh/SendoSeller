MyApp.orders = function(params) {
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
				// ordersStore.clear();
				refresh();
			}
		},
		viewShown : function() {
			var isAndroid = DevExpress.devices.real().platform === 'android';
			var obj = null;
			obj = $("#listNew");
			var list = obj.dxList("instance");
			// list.option('autoPagingEnabled', !isAndroid);
			list.option('showNextButton', isAndroid);
			list.option('pullRefreshEnabled', !isAndroid);
			loadImages();
			var objPivot = $("#pivot").dxPivot("instance");
			objPivot.option('selectedIndex', 0);
		},
		selectNewTab : function(input) {
			var isAndroid = DevExpress.devices.real().platform === 'android';
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
				processValueChange("Processing");
			},
			disabled : ko.observable(true),
		}, {
			text : "Hoãn",
			clickAction : function() {
				processValueChange("Delay");
			},
			disabled : ko.observable(true),
		}, {
			text : "Tách đơn hàng",
			clickAction : function() {
				processValueChange("Split");
			},
			disabled : ko.observable(true),
		}, {
			text : "Hết hàng",
			clickAction : function() {
				processValueChange("Cancel");
			},
			disabled : ko.observable(true),
		}, {
			text : "Xem chi tiết",
			clickAction : function() {
				processValueChange("Details");
			},
			// disabled : ko.observable(false),
		}],
		products : ko.observableArray([]),
		productsToSplit : ko.observableArray([]),
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
		ordersStore.load();
		switch (status) {
			case "New":
				newDataSource.filter("status", status);
				newDataSource.pageIndex(0);
				newDataSource.load();
				break;
			case "Processing":
				processingDataSource.filter("status", status);
				processingDataSource.pageIndex(0);
				processingDataSource.load();
				break;
			case "Delayed":
				delayedDataSource.filter("status", status);
				delayedDataSource.pageIndex(0);
				delayedDataSource.load();
				break;
		}
	};

	doCancelOrderByOrderID = function() {
		// showLoading(true);
		AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderNumber : viewModel.dataItem().orderNumber,
			Action : "Cancel",
		}, "json").done(function(data) {
			// showLoading(false);
			AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			item.status = "Cancel";
			ordersStore.update(item.orderNumber, item);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus("Cancel");
		}).fail(function(jqxhr, textStatus, error) {
			// showLoading(false);
			AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});
	};

	doProcessOrderByOrderID = function() {
		// showLoading(true);
		AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderNumber : viewModel.dataItem().orderNumber,
			Action : "Processing",
		}, "json").done(function(data, textStatus) {
			// showLoading(false);
			AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			item.status = "Processing";
			ordersStore.update(item.orderNumber, item);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus("Processing");
		}).fail(function(jqxhr, textStatus, error) {
			// showLoading(false);
			AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	doSplitOrderByOrderID = function() {
		// showLoading(true);
		AppMobi.notification.showBusyIndicator();
		var splitIDs = [];
		for (var i = 0; i < viewModel.productsToSplit().length; i++) {
			var product = {
				Id : viewModel.productsToSplit()[i].id
			};
			splitIDs.push(product);
		}
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderNumber : viewModel.dataItem().orderNumber,
			Action : "Split",
			Products : splitIDs
		}, "json").done(function(data) {
			hideSplitPopUp();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			item.status = "Splitting";
			ordersStore.update(item.orderNumber, item);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus("Splitting");
			//TODO modify local data here
		}).fail(function(jqxhr, textStatus, error) {
			hideSplitPopUp();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	doDelayOrderByOrderID = function() {
		// showLoading(true);
		AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var newDelayDate = new Date(viewModel.dateBoxValue());
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderNumber : viewModel.dataItem().orderNumber,
			Action : "Delay",
			DelayDate : Globalize.format(newDelayDate, 'yyyy-MM-dd')
		}, "json").done(function(data, textStatus) {
			hideDelayPopUp();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}
			var item = viewModel.dataItem();
			var oldStatus = item.status;
			item.status = "Delayed";
			ordersStore.update(item.orderNumber, item);
			doLoadDataByOrderStatus(oldStatus);
			doLoadDataByOrderStatus("Delayed");
		}).fail(function(jqxhr, textStatus, error) {
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

	newDataSource = new DevExpress.data.DataSource({
		store : ordersStore,
		pageSize : 10,
		sort : "orderNumber",
		filter : ["status", "=", "New"]
	});

	processingDataSource = new DevExpress.data.DataSource({
		store : ordersStore,
		pageSize : 10,
		sort : "orderNumber",
		filter : ["status", "=", "Processing"]
	});

	delayedDataSource = new DevExpress.data.DataSource({
		store : ordersStore,
		pageSize : 10,
		sort : "orderNumber",
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

	processValueChange = function(text) {
		switch (text) {
			case "Processing":
				doProcessOrderByOrderID();
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
				$("#splitList").dxList('instance').option('dataSource', viewModel.productsToSplit());
				break;
			case "New":
				doNewOrderByOrderID();
				break;
			case "Cancel":
				doCancelOrderByOrderID();
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
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ListSalesOrderByStatus", {
			TokenId : tokenId,
			Status : status,
			TimeStamp : timeStamp
		}, "json").done(function(data, textStatus) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}
			if ((data.Data === null) || (data.Data.length === 0)) {
				return;
			}
			window.localStorage.setItem(myUserName + "OrdersTimeStamp" + status, data.TimeStamp);
			var result = $.map(data.Data, function(item) {
				var itemOrderDate = convertDate(item.OrderDate);
				var orderDateString = Globalize.format(itemOrderDate, 'dd/MM/yyyy');
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
						upProductDate : product.UpProductDate + 'Z',
						updatedDate : product.UpdatedDate + 'Z',
						description : product.Description,
					};
				});
				var totalAmount = numberWithCommas(item.TotalAmount);
				return {
					status : status,
					orderNumber : item.OrderNumber,
					orderDate : itemOrderDate,
					delayDate : itemDelayDate,
					paymentMethod : item.PaymentMethod,
					shippingMethod : item.ShippingType,
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

	showDetailsData = function(e) {
		MyApp.app.navigate({
			view : 'order-details',
			id : e.itemData.orderNumber
		});
	};

	showDetail = function() {
		MyApp.app.navigate({
			view : 'order-details',
			id : viewModel.dataItem().orderNumber
		});
	};

	refresh = function() {
		doLoadDataByOrderStatus("New");
		doLoadDataByOrderStatus("Delayed");
		doLoadDataByOrderStatus("Processing");
	};

	loadImages = function() {
		jQuery("img.product-thumbnail.lazy").lazy({
			effect : "fadeIn",
			effectTime : 1500
		});
	};
	return viewModel;
};
