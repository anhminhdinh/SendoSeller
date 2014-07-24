MyApp.orders = function(id, params) {
	var LOADSIZE = 50;
	var NEW_ORDER = "New", PROCESSING_ORDER = "Processing", DELAYED_ORDER = "Delayed", DELAYING_ORDER = "Delaying", SHIPPING_ORDER = "Shipping", SPLITTED_ORDER = "Splitted";
	var myUserName = "";

	// ordersStore = new DevExpress.data.LocalStore({
	// type : "local",
	// name : myUserName + "OrdersStore",
	// key : "orderNumber",
	// flushInterval : 1000,
	// // immediate : true,
	// });
	var viewModel = {
		viewShowing : function() {
			myUserName = window.localStorage.getItem("UserName");
			viewModel.ordersStore(new DevExpress.data.LocalStore({
				type : "local",
				name : myUserName + "OrdersStore",
				key : "orderNumber",
				// flushInterval : 1000,
				immediate : true,
			}));
			viewModel.ordersDataSource(new DevExpress.data.DataSource({
				store : viewModel.ordersStore(),
				pageSize : 50,
				sort : {
					getter : 'orderDate',
					desc : true
				},
				// group : 'orderDate',
				postProcess : groupByDate,
			}));
			if (window.sessionStorage.getItem("MyTokenId") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined
				}, {
					root : true
				});
			} else {
			}
		},
		loadFrom : ko.observable(0),
		isAndroid : ko.observable(false),
		showRefresh : ko.observable(false),
		viewShown : function() {
			var platform = DevExpress.devices.real().platform;
			viewModel.isAndroid(platform === 'android' || platform === 'generic');
			var obj = null;
			obj = $("#ordersList");
			var list = obj.dxList("instance");
			if (viewModel.isAndroid())
				list.option('useNativeScrolling', false);
			// list.option('showNextButton', viewModel.isAndroid());
			// list.option('pullRefreshEnabled', !isAndroid);
			var contentObj = $("#content");
			var contentHeight = contentObj.height();
			var typeBar = $("#typeBar");
			var typeBarHeight = typeBar.outerHeight();
			obj.height(contentHeight - typeBarHeight);
			if (window.sessionStorage.getItem("firstloadorder") === null) {
				window.sessionStorage.setItem("firstloadorder", true);
				doLoadDataByOrderStatus(viewModel.selectedOrder());
			} else {
				refreshList(viewModel.selectedOrder());
			}
			// refreshList(NEW_ORDER);
		},
		selectedOrder : ko.observable(NEW_ORDER),
		selectedOrderName : ko.observable('Đơn hàng mới'),
		selectNewOrder : function(orderType) {
			viewModel.selectedOrder(orderType);
			doLoadDataByOrderStatus(orderType);
		},
		username : ko.observable(),
		pass : ko.observable(),

		actionSheetVisible : ko.observable(false),
		actionSheetData : [{
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
			text : "Hết hàng một phần",
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
		switchOrdersData : [{
			text : "Đơn hàng mới",
			clickAction : function() {
				viewModel.selectNewOrder(NEW_ORDER);
			}
		}, {
			text : "Đơn hàng đang xử lý",
			clickAction : function() {
				viewModel.selectNewOrder(PROCESSING_ORDER);
			}
		}, {
			text : "Đơn hàng yêu cầu hoãn",
			clickAction : function() {
				viewModel.selectNewOrder(DELAYING_ORDER);
			}
		}, {
			text : "Đơn hàng đang hoãn",
			clickAction : function() {
				viewModel.selectNewOrder(DELAYED_ORDER);
			}
		}, {
			text : "Đơn hàng đang vận chuyển",
			clickAction : function() {
				viewModel.selectNewOrder(SHIPPING_ORDER);
			}
		}, {
			text : "Đơn hàng chờ tách",
			clickAction : function() {
				viewModel.selectNewOrder(SPLITTED_ORDER);
			}
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
			viewModel.ordersStore().byKey(orderNumber).done(function(dataItem) {
				var idOrderNumber = "#" + orderNumber;
				var actionSheet = $("#actionsheet").dxActionSheet("instance");
				// actionSheet.option('target', idOrderNumber);
				// actionSheet.option('target', "#bottom");
				var ObjPopOver = actionSheet._popup;
				ObjPopOver.option('shading', true);

				viewModel.dataItem(dataItem);
				viewModel.products(dataItem.products);
				viewModel.actionSheetData[0].disabled(!dataItem.canProcess);
				viewModel.actionSheetData[1].disabled(!dataItem.canDelay);
				viewModel.actionSheetData[2].disabled(!dataItem.canSplit);
				viewModel.actionSheetData[3].disabled(!dataItem.canCancel);
				viewModel.actionSheetData[4].disabled(dataItem.buyerPhone === null);
				viewModel.actionSheetVisible(true);
			});
			e.jQueryEvent.stopPropagation();
		},
		switchOrdersVisible : ko.observable(false),
		showOrders : function() {
			var ordersSheet = $("#switchOrdersSheet").dxActionSheet("instance");
			var ordersSheetPopOver = ordersSheet._popup;
			ordersSheetPopOver.option('shading', true);
			viewModel.switchOrdersVisible(true);
		},
		// dataStore : ordersStore,
		ordersStore : ko.observable(),
		ordersDataSource : ko.observable(),
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

	refreshList = function(status) {
		var typeBar = $("#typeBar");
		switch (status) {
			case NEW_ORDER:
				viewModel.selectedOrderName('Đơn hàng mới (chưa xử lý)');
				typeBar.css("backgroundColor", "#04a89f");
				break;
			case PROCESSING_ORDER:
				viewModel.selectedOrderName('Đơn hàng đang xử lý');
				typeBar.css("backgroundColor", "#00b5d0");
				break;
			case DELAYING_ORDER:
				viewModel.selectedOrderName('Đơn hàng yêu cầu hoãn');
				typeBar.css("backgroundColor", "#595959");
				break;
			case DELAYED_ORDER:
				viewModel.selectedOrderName('Đơn hàng đang hoãn');
				typeBar.css("backgroundColor", "#999999");
				break;
			case SHIPPING_ORDER:
				viewModel.selectedOrderName('Đơn hàng đang vận chuyển');
				typeBar.css("backgroundColor", "#006599");
				break;
			case SPLITTED_ORDER:
				viewModel.selectedOrderName('Đơn hàng đang chờ tách');
				typeBar.css("backgroundColor", "#cd6e02");
				break;
		}
		viewModel.ordersStore().load().done(function(result) {
			var filter = status;
			viewModel.ordersDataSource().filter("status", filter);
			viewModel.ordersDataSource().pageIndex(0);
			viewModel.ordersDataSource().sort({
				getter : 'orderDate',
				desc : true
			});
			viewModel.ordersDataSource().load().done(function(results) {
				// var obj = $("#ordersList");
				// var list = obj.dxList("instance");
				// list.option('dataSource', results);
				loadNextImages();
			});
		});
	};

	doCancelOrder = function() {
		var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn báo hết hàng?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
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
					viewModel.ordersStore().remove(orderRemove);
					DevExpress.ui.notify('Huỷ đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(oldStatus);
				}).fail(function(jqxhr, textStatus, error) {
					showLoading(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				});
			}
		});
	};

	doProcessOrder = function() {
		var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn là còn hàng?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
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
					viewModel.ordersStore().remove(orderRemove);
					DevExpress.ui.notify('Xử lý đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(oldStatus);
				}).fail(function(jqxhr, textStatus, error) {
					showLoading(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				});
			}
		});
	};

	doSplitOrder = function() {
		var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn muốn hoãn một phần đơn hàng?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
				showLoading(true);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.showBusyIndicator();
				var splitIDs = [];
				for (var i = 0; i < viewModel.productsToSplit().length; i++) {
					// var product = {
					// Id : viewModel.productsToSplit()[i].id
					// };
					// splitIDs.push(product);
					if (viewModel.productsToSplit()[i].selected() === true)
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
					viewModel.ordersStore().remove(orderRemove);
					DevExpress.ui.notify('Hoãn một phần đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(oldStatus);
				}).fail(function(jqxhr, textStatus, error) {
					hideSplitPopUp();
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				});
			}
		});
	};

	doDelayOrder = function() {
		var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn muốn hoãn đơn hàng?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
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
					viewModel.ordersStore().remove(orderRemove);
					DevExpress.ui.notify('Hoãn đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(oldStatus);
				}).fail(function(jqxhr, textStatus, error) {
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					hideDelayPopUp();
					DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				});
			}
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

	processActionSheet = function(text) {
		switch (text) {
			case PROCESSING_ORDER:
				doProcessOrder();
				break;
			case "Delay":
				viewModel.popupDelayVisible(true);
				break;
			case "Split":
				viewModel.productsToSplit.removeAll();
				for (var i = 0; i < viewModel.products().length; i++) {
					var product = {
						name : viewModel.products()[i].name,
						id : viewModel.products()[i].id,
						thumbnail : viewModel.products()[i].thumbnail,
						stockAvailability : viewModel.products()[i].stockAvailabilityDisplay,
						selected : ko.observable(false),
					};
					viewModel.productsToSplit.push(product);
				}
				var totalHeight = $("#popupSplitContent").height();
				var footerHeight = $("#popupSplitFooter").height();
				$("popupSplitList").height(totalHeight - footerHeight);

				// $("#popupSplitList").dxList('instance').option('dataSource', viewModel.productsToSplit());
				viewModel.cantSplitCurrentItem(true);
				viewModel.popupSplitVisible(true);
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
		var obj = $("#ordersList");
		var list = obj.dxList("instance");
		list.option('noDataText', '');

		viewModel.ordersStore().clear();

		DevExpress.ui.notify("Đang tải dữ liệu", "info", 100);
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var myUserName = window.localStorage.getItem("UserName");
		// var timeStamp = Number(window.sessionStorage.getItem(myUserName + "OrdersTimeStamp" + status));
		// if (timeStamp === null)
		// timeStamp = 0;
		var from = viewModel.loadFrom();
		var to = viewModel.loadFrom() + LOADSIZE - 1;
		// if (viewModel.loadFrom() > 0)
		// timeStamp = 0;

		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ListSalesOrderByStatus";
		return $.post(url, {
			TokenId : tokenId,
			Status : status,
			TimeStamp : 0,
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

			viewModel.showRefresh(data.Data === null || data.Data.length === 0 || viewModel.isAndroid());

			if ((data.Data === null) || (data.Data.length === 0)) {
				list.option('noDataText', 'Chưa có đơn hàng nào ở mục này');
				refreshList(status);
				return;
			}
			// if (viewModel.loadFrom() === 0)
			// window.sessionStorage.setItem(myUserName + "OrdersTimeStamp" + status, data.TimeStamp);
			var result = $.map(data.Data, function(item) {
				var itemOrderDate = convertDate(item.OrderDate);
				var today = new Date();
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
					sendoShippingSupport : item.SendoSupportFeeToBuyer,
					shopShippingSupport : item.SellerShippingFee,
					paymentStatus : item.PaymentStatus,
					carrierName : item.CarrierName,
					trackingNumber : item.TrackingNumber,
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
				viewModel.ordersStore().byKey(result[i].orderNumber).done(function(dataItem) {
					if (dataItem !== undefined)
						viewModel.ordersStore().update(result[i].orderNumber, result[i]);
					else
						viewModel.ordersStore().insert(result[i]);
				});
			}
			var listStatus = status;
			if ( typeof listStatus === 'function')
				listStatus = status();
			refreshList(listStatus);
		}).fail(function(jqxhr, textStatus, error) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.showRefresh(true);
		});

	};

	itemDeleted = function() {
		viewModel.cantSplitCurrentItem(viewModel.productsToSplit().length === 0);
	};

	splitCheckChanged = function() {
		var len = viewModel.productsToSplit().length;
		var checkedCount = 0;
		for ( i = 0; i < len; i++) {
			var product = viewModel.productsToSplit()[i];
			if (product.selected() === true) {
				checkedCount++;
			}
		}
		viewModel.cantSplitCurrentItem((checkedCount === 0) || (checkedCount === len));
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

	refresh = function() {
		doLoadDataByOrderStatus(viewModel.selectedOrder);
	};

	loadNextOrders = function() {
		var page = 0;
		var pageSize = 0;
		page = viewModel.ordersDataSource()._pageIndex;
		pageSize = viewModel.ordersDataSource()._pageSize;
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
