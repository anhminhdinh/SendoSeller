MyApp.orders = function(params) {
	var LOADSIZE = 30;
	var NEW_ORDER = "New", PROCESSING_ORDER = "Processing", DELAYED_ORDER = "Delayed", DELAYING_ORDER = "Delaying", SHIPPING_ORDER = "Shipping", SPLITTED_ORDER = "Splitted", CANCELLED_ORDER = "Cancelled", TOTAL_ORDER = "Total";
	var myUserName = "";

	// ordersStore = new DevExpress.data.LocalStore({
	// type : "local",
	// name : myUserName + "OrdersStore",
	// key : "orderNumber",
	// flushInterval : 1000,
	// // immediate : true,
	// });
	var viewModel = {
		nextPageId : ko.observable(params.id),
		viewShowing : function() {
			var platform = DevExpress.devices.real().platform;
			viewModel.isAndroid(platform === 'android' || platform === 'generic');

			myUserName = window.localStorage.getItem("UserName");
			if (window.sessionStorage.getItem("access_token") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined
				}, {
					root : true
				});
			} else {
			}
		},
		loadFrom : ko.observable(1),
		isAndroid : ko.observable(false),
		showRefresh : ko.observable(false),
		viewShown : function() {
			// DevExpress.ui.notify(params.id, 'info', 1000);
			var obj = $("#ordersList");
			var typeBar = $("#typeBar");
			var searchBar = $("#pvordersearchbar");
			var content = $("#content");
			var height = content.height();
			var heightTB = typeBar.outerHeight(true);
			var heightSB = searchBar.outerHeight(true);
			var objHeight = height - heightTB - heightSB;
			obj.height(objHeight);

			var mustNotRefresh = window.sessionStorage.getItem("ViewDetails");
			if (mustNotRefresh === null) {
				viewModel.selectedOrder(NEW_ORDER);
				viewModel.searchString('');
				if ((params.id !== null) && (params.id !== undefined) && (params.id !== '')) {
					var dataString = params.id;
					if (dataString.indexOf("splittedOrder") === 0) {
						dataString = dataString.replace("splittedOrder", "");
						dataString = dataString.replace("_", "");
						viewModel.selectedOrder(SPLITTED_ORDER);
					} else if (dataString.indexOf("delayOrder") === 0) {
						dataString = dataString.replace("delayOrder", "");
						dataString = dataString.replace("_", "");
						viewModel.selectedOrder(DELAYED_ORDER);
					} else if (dataString.indexOf("shippingOrder") === 0) {
						dataString = dataString.replace("shippingOrder", "");
						dataString = dataString.replace("_", "");
						viewModel.selectedOrder(SHIPPING_ORDER);
					} else if (dataString.indexOf("newOrder") === 0) {
						dataString = dataString.replace("newOrder", "");
						dataString = dataString.replace("_", "");
						viewModel.selectedOrder(NEW_ORDER);
					}
					viewModel.nextPageId(dataString);
				}
				doLoadDataByOrderStatus(viewModel.selectedOrder(), true);
			} else {
				window.sessionStorage.removeItem("ViewDetails");
				refreshList();
			}
			// refreshList(NEW_ORDER);
		},
		selectedOrder : ko.observable(NEW_ORDER),
		selectedOrderName : ko.observable('Đơn hàng mới'),
		selectNewOrder : function(orderType) {
			viewModel.selectedOrder(orderType);
			viewModel.searchString('');
			doLoadDataByOrderStatus(orderType, true);
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
		}, {
			text : "Đơn hàng huỷ",
			clickAction : function() {
				viewModel.selectNewOrder(CANCELLED_ORDER);
			}
		}, {
			text : "Tất cả đơn hàng",
			clickAction : function() {
				viewModel.selectNewOrder(TOTAL_ORDER);
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
			ordersStore.byKey(orderNumber).done(function(dataItem) {
				var idOrderNumber = "#" + orderNumber;
				var actionSheet = $("#actionsheet").dxActionSheet("instance");
				actionSheet.option('title', '#' + orderNumber);
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
		endOfList : ko.observable(false),
		searchString : ko.observable(''),
		doSearchOrders : function() {
			var searchString = viewModel.searchString().trim();
			if (searchString.length < 4) {
				DevExpress.ui.notify('Số điện thoại phải có ít nhất 4 chữ số', 'error', 2000);
				$("#searchOrderBox").dxTextBox("instance").focus();
				return;
			}
			if (!isNumber(searchString)) {
				DevExpress.ui.notify('Số điện thoại phải là dạng số', 'error', 2000);
				$("#searchOrderBox").dxTextBox("instance").focus();
				return;
			}
			doSearchOrdersByPhoneNumber();
		},
	};

	ordersStore = new DevExpress.data.ArrayStore({
		data : [],
		key : "orderNumber",
	});
	ordersDataSource = new DevExpress.data.DataSource({
		store : ordersStore,
		pageSize : LOADSIZE,

		// sort : {
		// getter : 'orderDate',
		// desc : true
		// },

		// postProcess : groupByDate,
	});

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

	refreshList = function() {
		// ordersDataSource.sort({
		// getter : 'orderNumber',
		// desc : false
		// });
		ordersDataSource.pageIndex(0);
		ordersDataSource.load().done(function(results) {
			setTimeout(function() {
				DevExpress.ui.notify('Trang ' + (1 + (viewModel.loadFrom() - 1 ) / LOADSIZE), 'info', 1000);
			}, 500);

			loadNextImages();
			// DevExpress.ui.notify(viewModel.nextPageId(), 'info', 1000);
			if ((viewModel.nextPageId() !== null) && (viewModel.nextPageId() !== undefined) && (viewModel.nextPageId() !== '')) {
				MyApp.app.navigate({
					view : "orderdetails",
					id : viewModel.nextPageId(),
				});
				viewModel.nextPageId(null);
			}
		});
		// if (viewModel.loadFrom() === 0)
		// ordersStore.totalCount().done(function(count) {
		// var page = (Math.floor(count / LOADSIZE) - 1) * (LOADSIZE / ordersDataSource._pageSize);
		// ordersDataSource.pageIndex(page);
		// });
	};

	doCancelOrder = function() {
		var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn báo hết hàng?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
				showLoading(true);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.showBusyIndicator();
				var postOrderNumber = Number(viewModel.dataItem().orderId);
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/Orders/ProcessOrder";
				return $.ajax({
					type : 'POST',
					dataType : "json",
					contentType : "application/json",
					url : url,
					data : JSON.stringify({
						OrderId : postOrderNumber,
						Action : "Cancel"
					}),
					beforeSend : function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
					},
				}).done(function(data) {
					showLoading(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						prepareLogout(data.Message);
						return;
					}
					DevExpress.ui.notify('Huỷ đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(viewModel.selectedOrder(), false);
				}).fail(function(jqxhr, textStatus, error) {
					showLoading(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					prepareLogout("Lỗi mạng");
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
				var postOrderNumber = Number(viewModel.dataItem().orderId);
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/Orders/ProcessOrder";
				return $.ajax({
					type : 'POST',
					dataType : "json",
					contentType : "application/json",
					url : url,
					data : JSON.stringify({
						OrderId : postOrderNumber,
						Action : PROCESSING_ORDER,
					}),
					beforeSend : function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
					},
				}).done(function(data) {
					showLoading(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						prepareLogout(data.Message);
						return;
					}
					DevExpress.ui.notify('Xử lý đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(viewModel.selectedOrder(), false);
				}).fail(function(jqxhr, textStatus, error) {
					showLoading(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					prepareLogout("Lỗi mạng");
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
					if (viewModel.productsToSplit()[i].selected() === true)
						splitIDs.push(viewModel.productsToSplit()[i].id);
				}
				var postOrderNumber = Number(viewModel.dataItem().orderId);
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/Orders/ProcessOrder";
				return $.ajax({
					type : 'POST',
					dataType : "json",
					contentType : "application/json",
					url : url,
					data : JSON.stringify({
						OrderId : postOrderNumber,
						Action : "Splitting",
						ProductSplits : splitIDs
					}),
					beforeSend : function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
					},
				}).done(function(data) {
					hideSplitPopUp();
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						prepareLogout(data.Message);
						return;
					}
					DevExpress.ui.notify('Hoãn một phần đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(viewModel.selectedOrder(), false);
				}).fail(function(jqxhr, textStatus, error) {
					hideSplitPopUp();
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					prepareLogout("Lỗi mạng");
				});
			}
		});
	};

	doDelayOrder = function() {
		var newDelayDate = new Date(viewModel.dateBoxValue());
		var today = new Date();

		if (newDelayDate.getTime() < today.getTime()) {
			DevExpress.ui.dialog.alert("Ngày hoãn không thể nhỏ hơn ngày đơn hàng!", "Sendo.vn");
			return;
		}

		var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn muốn hoãn đơn hàng?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
				showLoading(true);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.showBusyIndicator();
				var postOrderNumber = Number(viewModel.dataItem().orderId);
				var delayDate = Number(newDelayDate.getTime() / 1000);
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/Orders/ProcessOrder";
				return $.ajax({
					type : 'POST',
					dataType : "json",
					contentType : "application/json",
					url : url,
					data : JSON.stringify({
						OrderId : postOrderNumber,
						Action : DELAYED_ORDER,
						DelayDate : delayDate
					}),
					beforeSend : function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
					},
				}).done(function(data) {
					hideDelayPopUp();
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						prepareLogout(data.Message);
						return;
					}
					DevExpress.ui.notify('Hoãn đơn hàng thành công', 'success', 2000);
					doLoadDataByOrderStatus(viewModel.selectedOrder(), false);
				}).fail(function(jqxhr, textStatus, error) {
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					hideDelayPopUp();
					prepareLogout("Lỗi mạng");
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
			var newDate = new Date();
			var time = newDate.getTime();
			var newTime = time + 24 * 60 * 60 * 1000;
			newDate.setTime(newTime);
			viewModel.dateBoxValue(newDate);
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

			// $("#popupSplitList").dxList('instance').option('dataSource', viewModel.productsToSplit());
			viewModel.cantSplitCurrentItem(true);
			viewModel.popupSplitVisible(true);
			var content = $("#popupSplitContent").parent();
			var totalHeight = content.height();
			var footer = $("#popupSplitFooter");
			var footerHeight = footer.outerHeight(true);
			var newHeight = totalHeight - footerHeight - 20;
			var obj = $("#popupSplitList");
			obj.height(newHeight);
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

	doProcessData = function(data) {
		var obj = $("#ordersList");
		var list = obj.dxList("instance");
		list.option('noDataText', '');
		if (data.Flag !== true) {
			prepareLogout(data.Message);
			return;
		}

		viewModel.showRefresh(data.Data === null || data.Data.length === 0 || viewModel.isAndroid());

		if ((data.Data === null) || (data.Data.length === 0)) {
			list.option('noDataText', 'Chưa có đơn hàng nào ở mục này');
			viewModel.endOfList(true);
			refreshList();
			return;
		}
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
			var orderStatus = "Mới";
			var color = "#000";
			switch (item.OrderStatus) {
			case 2:
				color = "#04a89f";
				break;
			case 3:
				orderStatus = "Đang xử lý";
				color = "#00b5d0";
				break;
			case 6:
				orderStatus = "Đang vận chuyển";
				color = "#006599";
				break;
			case 7:
				orderStatus = "Đã giao hàng";
				color = "#669965";
				break;
			case 8:
				orderStatus = "Hoàn tất";
				color = "#019934";
				break;
			case 10:
				orderStatus = "Đóng";
				color = "#380001";
				break;
			case 11:
				orderStatus = "Đang chờ hoãn";
				color = "#595959";
				break;
			case 12:
				orderStatus = "Đang hoãn";
				color = "#999999";
				break;
			case 13:
				orderStatus = "Huỷ";
				break;
			case 14:
				orderStatus = "Hết hàng một phần";
				break;
			case 15:
				orderStatus = "Đang chờ tách";
				color = "#cd6e02";
				break;
			}
			return {
				status : orderStatus,
				orderTypeColor : color,
				orderId : Number(item.Id),
				orderNumber : item.OrderNumber,
				orderDate : item.OrderDate,
				delayDate : item.DelayDate,
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
			ordersStore.byKey(result[i].orderNumber).done(function(dataItem) {
				if (dataItem === undefined)
					ordersStore.insert(result[i]);
				else
					ordersStore.update(result[i].orderNumber, result[i]);
			});
		}
		viewModel.endOfList(result.length < LOADSIZE);
		refreshList();

	};

	doSearchOrdersByPhoneNumber = function(previous) {
		viewModel.selectedOrderName('Số điện thoại ' + viewModel.searchString().trim());
		ordersStore.clear();
		ordersDataSource.load();

		var obj = $("#ordersList");
		var list = obj.dxList("instance");
		list.option('noDataText', '');

		DevExpress.ui.notify("Đang tải dữ liệu", "info", 100);
		viewModel.loadPanelVisible(true);
		var myUserName = window.localStorage.getItem("UserName");

		if (previous === true) {
			viewModel.loadFrom(viewModel.loadFrom() - LOADSIZE);
			if (viewModel.loadFrom() < 1)
				viewModel.loadFrom(1);
		}
		var from = viewModel.loadFrom();
		var to = viewModel.loadFrom() + LOADSIZE - 1;
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/Orders/SearchSalesOrderByPhone";
		var searchString = viewModel.searchString();
		if (searchString.length < 3)
			searchString = '111';
		return $.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : JSON.stringify({
				Phone : searchString,
				TimeStamp : 0,
				From : from,
				To : to
			}),
			beforeSend : function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
			},
		}).done(function(data) {
			viewModel.loadPanelVisible(false);
			doProcessData(data);
		}).fail(function(jqxhr, textStatus, error) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			prepareLogout("Lỗi mạng");
			viewModel.showRefresh(true);
		});

	};
	doLoadDataByOrderStatus = function(orderstatus, restart, previous) {
		if (viewModel.searchString().trim().length >= 4) {
			doSearchOrdersByPhoneNumber(previous);
			return;
		}
		switch (orderstatus) {
		case NEW_ORDER:
			viewModel.selectedOrderName("Đơn hàng mới");
			break;
		case PROCESSING_ORDER:
			viewModel.selectedOrderName("Đơn hàng đang xử lý");
			break;
		case DELAYING_ORDER:
			viewModel.selectedOrderName("Đơn hàng yêu cầu hoãn");
			break;
		case DELAYED_ORDER:
			viewModel.selectedOrderName("Đơn hàng đang hoãn");
			break;
		case SHIPPING_ORDER:
			viewModel.selectedOrderName("Đơn hàng đang vận chuyển");
			break;
		case SPLITTED_ORDER:
			viewModel.selectedOrderName("Đơn hàng chờ tách");
			break;
		case CANCELLED_ORDER:
			viewModel.selectedOrderName("Đơn hàng huỷ");
			break;
		case TOTAL_ORDER:
			viewModel.selectedOrderName("Tất cả đơn hàng");
			break;
		}

		ordersStore.clear();
		ordersDataSource.load();
		if (restart === true) {
			viewModel.loadFrom(1);
		}
		if (previous === true) {
			var previousFrom = viewModel.loadFrom() - LOADSIZE;
			if (previousFrom < 1)
				previousFrom = 1;
			viewModel.loadFrom(previousFrom);
		}
		var listStatus = orderstatus;
		if ( typeof listStatus === 'function')
			listStatus = orderstatus();

		var obj = $("#ordersList");
		var list = obj.dxList("instance");
		list.option('noDataText', '');

		DevExpress.ui.notify("Đang tải dữ liệu", "info", 100);
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var myUserName = window.localStorage.getItem("UserName");
		// var timeStamp = Number(window.sessionStorage.getItem(myUserName + "OrdersTimeStamp" + status));
		// if (timeStamp === null)
		// timeStamp = 0;
		var from = viewModel.loadFrom();
		var to = viewModel.loadFrom() + LOADSIZE - 1;
		// if (viewModel.loadFrom() > 0)
		// timeStamp = 0;

		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/Orders/ListSalesOrderByStatus";
		return $.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : JSON.stringify({
				Status : listStatus,
				TimeStamp : 0,
				From : from,
				To : to
			}),
			beforeSend : function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
			},
		}).done(function(data) {
			viewModel.loadPanelVisible(false);
			doProcessData(data);
		}).fail(function(jqxhr, textStatus, error) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			prepareLogout("Lỗi mạng");
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
		doLoadDataByOrderStatus(viewModel.selectedOrder(), true);
	};

	loadNextOrders = function() {
		var page = 0;
		var pageSize = 0;
		page = ordersDataSource._pageIndex;
		pageSize = ordersDataSource._pageSize;
		var currentView = (page + 1) * pageSize;
		if (currentView >= LOADSIZE - 1) {
			viewModel.loadFrom(viewModel.loadFrom() + LOADSIZE);
			if (viewModel.searchString().trim().length >= 4)
				doSearchOrdersByPhoneNumber();
			else
				doLoadDataByOrderStatus(viewModel.selectedOrder(), false);
		}
		loadNextImages();
	};

	loadNextImages = function() {
		jQuery("img.product-thumbnail.lazy").lazy({
			effect : "fadeIn",
			effectTime : 1500
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

	checkSearchEmpty = function() {
		viewModel.searchString(viewModel.searchString().trim());
		if (viewModel.searchString().length === 0) {
			$("#searchOrderBox").dxTextBox("instance").focus();
			return;
		} else
			viewModel.doSearchOrders();
	};
	return viewModel;
};
