MyApp.orderdetails = function(params) {
	var myUserName = window.localStorage.getItem("UserName");

	var viewModel = {
		//title : ko.observable('Orders'),
		ordersStore : new DevExpress.data.LocalStore({
			type : "local",
			name : myUserName + "OrdersStore",
			key : "orderNumber",
			// flushInterval : 1000,
			immediate : true,
		}),
		viewShown : function(e) {
			//this.title("Đơn hàng " + this.id);
			window.sessionStorage.setItem("ViewDetails", true);
			viewModel.ordersStore.byKey(this.id).done(function(dataItem) {
				viewModel.totalAmount(dataItem.totalAmount);
				viewModel.orderId(dataItem.orderId);
				viewModel.orderNumber(dataItem.orderNumber);
				viewModel.buyerName(dataItem.buyerName);
				viewModel.buyerAddress(dataItem.buyerAddress);
				viewModel.buyerPhone(dataItem.buyerPhone);
				viewModel.orderDate(dataItem.orderDate);
				viewModel.delayDate(dataItem.delayDate);
				viewModel.updatedDate(dataItem.updatedDate);
				viewModel.orderDateDisplay(dataItem.orderDateDisplay);
				viewModel.delayDateDisplay(dataItem.delayDateDisplay);
				viewModel.paymentMethod(dataItem.paymentMethod === 2 ? 'Senpay' : 'COD');
				viewModel.shippingMethod(dataItem.shippingMethod === 1 ? 'Sengo vận chuyển' : (dataItem.shippingMethod === 2 ? 'Tự vận chuyển' : 'Sengo, tự vận chuyển'));
				switch (dataItem.status) {
					case "New":
						viewModel.orderStatus("Mới");
						break;
					case "Processing":
						viewModel.orderStatus("Đang xử lý");
						break;
					case "Delayed":
						viewModel.orderStatus("Đang hoãn");
						break;
					case "Delaying":
						viewModel.orderStatus("Yêu cầu hoãn");
						break;
					case "Splitted":
						viewModel.orderStatus("Đang chờ tách");
						break;
					case "Shipping":
						viewModel.orderStatus("Đang vận chuyển");
						break;
				}
				viewModel.shippingFee(numberWithCommas(dataItem.shippingFee));
				viewModel.sendoShippingSupport(numberWithCommas(dataItem.sendoShippingSupport));
				viewModel.voucher(numberWithCommas(dataItem.voucher));
				viewModel.shopShippingSupport(numberWithCommas(dataItem.shopShippingSupport));
				switch (dataItem.paymentStatus) {
					case 2:
						viewModel.paymentStatus("Đã thanh toán COD");
						break;
					case 3:
						viewModel.paymentStatus("Đã thanh toán");
						break;
					case 4:
						viewModel.paymentStatus("Hoàn tất");
						break;
					case 5:
						viewModel.paymentStatus("Đã hoàn tiền");
						break;
					case 6:
						viewModel.paymentStatus("Đợi xác nhận");
						break;
					case 7:
						viewModel.paymentStatus("Từ chối");
						break;
					case 1:
					default:
						viewModel.paymentStatus("Chưa thanh toán");
						break;
				}

				viewModel.carrierName(dataItem.carrierName);
				if ((dataItem.carrierName === null) || (dataItem.carrierName === undefined) || (dataItem.carrierName === '')) {
					$("#carrierField").hide();
				} else
					$("#carrierField").show();

				viewModel.trackingNumber(dataItem.trackingNumber);
				if ((dataItem.trackingNumber === null) || (dataItem.trackingNumber === undefined) || (dataItem.trackingNumber === '')) {
					$("#trackingField").hide();
				} else
					$("#trackingField").show();

				viewModel.note(dataItem.note);
				if ((dataItem.note === null) || (dataItem.note === undefined) || (dataItem.note === '')) {
					$("#noteField").hide();
				} else
					$("#noteField").show();

				viewModel.products(dataItem.products);
				viewModel.canDelay(dataItem.canDelay);
				viewModel.canCancel(dataItem.canCancel);
				viewModel.canSplit(dataItem.canSplit);
				viewModel.canProcess(dataItem.canProcess);
				var orderStatus = dataItem.status;
				if (orderStatus !== "Delayed")
					$("#delayField").hide();
				else
					$("#delayField").show();

				viewModel.dataItem(dataItem);
			}).fail(function(error) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			});
			viewModel.loadImages();
		},
		loadImages : function() {
			jQuery("img.product-thumbnail.lazy").lazy({
				effect : "fadeIn",
				effectTime : 1500
			});
		},
		id : params.id,
		dataItem : ko.observable(),
		orderId : ko.observable(0),
		orderNumber : ko.observable(''),
		totalAmount : ko.observable(0),
		buyerName : ko.observable('Minh'),
		buyerAddress : ko.observable('HCM'),
		buyerPhone : ko.observable(''),
		orderDate : ko.observable(),
		delayDate : ko.observable(),
		orderDateDisplay : ko.observable(''),
		delayDateDisplay : ko.observable(''),
		orderStatus : ko.observable(false),
		paymentMethod : ko.observable(''),
		shippingMethod : ko.observable(''),
		shippingFee : ko.observable('0'),
		sendoShippingSupport : ko.observable('0'),
		voucher : ko.observable('0'),
		shopShippingSupport : ko.observable('0'),
		paymentStatus : ko.observable(8),
		carrierName : ko.observable(''),
		trackingNumber : ko.observable('0'),
		canDelay : ko.observable(false),
		canCancel : ko.observable(false),
		canSplit : ko.observable(false),
		canProcess : ko.observable(false),
		updatedDate : ko.observable(),
		note : ko.observable(''),
		products : ko.observableArray([]),
		productsToSplit : ko.observableArray([]),
		cantSplitCurrentItem : ko.observable(false),
		disabled : ko.observable(false),
		selectedType : ko.observable(''),
		actionSheetVisible : ko.observable(false),
		dateBoxValue : ko.observable(new Date()),
		popupDelayVisible : ko.observable(false),
		popupSplitVisible : ko.observable(false),
		loadPanelVisible : ko.observable(false),
		deleted : function() {
			viewModel.cantSplitCurrentItem(viewModel.productsToSplit().length === 0);
		},

		showLoading : function(show) {
			viewModel.loadPanelVisible(show);
		},

		showSplitPopUp : function() {
			viewModel.productsToSplit.removeAll();
			for (var i = 0; i < viewModel.products().length; i++) {
				var product = {
					name : viewModel.products()[i].name,
					id : viewModel.products()[i].id,
					thumbnail : viewModel.products()[i].thumbnail,
					selected : ko.observable(false),
				};
				viewModel.productsToSplit.push(product);
			}

			var splitObj = $("#popupSplitList");
			// var splitList = splitObj.dxList('instance');
			// splitList.option('dataSource', viewModel.productsToSplit());

			var totalHeight = $("#popupSplitContent").height();
			var footerHeight = $("#popupSplitFooter").height();
			splitObj.height(totalHeight - footerHeight);
			viewModel.cantSplitCurrentItem(true);
			viewModel.popupSplitVisible(true);
		},

		hideDetailSplitPopUp : function() {
			viewModel.loadPanelVisible(false);
			viewModel.popupSplitVisible(false);
		},

		hideDetailDelayPopUp : function() {
			viewModel.loadPanelVisible(false);
			viewModel.popupDelayVisible(false);
		},

		showDelayPopUp : function() {
			viewModel.popupDelayVisible(true);
		},

		doCancelOrderByOrderID : function() {
			var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn báo hết hàng?", "Sendo");
			result.done(function(dialogResult) {
				if (dialogResult) {
					viewModel.showLoading(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var tokenId = window.sessionStorage.getItem("MyTokenId");
					var postOrderNumber = Number(viewModel.orderId());
					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/mobile/ProcessOrder";
					return $.post(url, {
						TokenId : tokenId,
						OrderId : postOrderNumber,
						Action : "Cancel",
					}, "json").done(function(data, textStatus) {
						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}

						var orderRemove = viewModel.orderNumber();
						viewModel.ordersStore.remove(orderRemove);
						MyApp.app.back();
						DevExpress.ui.notify('Huỷ đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
					});
				}
			});
		},

		doSwitchProcessOrderByOrderID : function() {
			var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn là còn hàng?", "Sendo");
			result.done(function(dialogResult) {
				if (dialogResult) {
					viewModel.showLoading(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var tokenId = window.sessionStorage.getItem("MyTokenId");
					var postOrderNumber = Number(viewModel.orderId());

					var dataToSend = {
						TokenId : tokenId,
						OrderId : postOrderNumber,
						Action : "Processing",
					};
					var jsonData = JSON.stringify(dataToSend);
					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/mobile/ProcessOrder";
					return $.post(url, {
						TokenId : tokenId,
						OrderNumber : viewModel.dataItem().orderNumber,
						Action : "Processing",
					}, "json").done(function(data, textStatus) {
						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						var orderRemove = viewModel.orderNumber();
						viewModel.ordersStore.remove(orderRemove);
						MyApp.app.back();
						DevExpress.ui.notify('Xử lý đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
					});
				}
			});
		},

		doSplitOrderByOrderID : function() {
			var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn muốn hoãn một phần đơn hàng?", "Sendo");
			result.done(function(dialogResult) {
				if (dialogResult) {
					viewModel.showLoading(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var splitIDs = [];
					for (var i = 0; i < viewModel.productsToSplit().length; i++) {
						splitIDs.push(viewModel.productsToSplit()[i].id);
					}
					var tokenId = window.sessionStorage.getItem("MyTokenId");
					var postOrderNumber = Number(viewModel.orderId());
					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/mobile/ProcessOrder";
					return $.post(url, {
						TokenId : tokenId,
						OrderId : postOrderNumber,
						Action : "Splitting",
						ProductSplits : splitIDs
					}, "json").done(function(data, textStatus) {
						viewModel.hideDetailSplitPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						var orderRemove = viewModel.orderNumber();
						viewModel.ordersStore.remove(orderRemove);
						MyApp.app.back();
						DevExpress.ui.notify('Hoãn một phần đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.hideDetailSplitPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
					});
				}
			});
		},

		doDelayOrderByOrderID : function() {
			var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn muốn hoãn đơn hàng?", "Sendo");
			result.done(function(dialogResult) {
				if (dialogResult) {
					viewModel.showLoading(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var tokenId = window.sessionStorage.getItem("MyTokenId");
					var newDelayDate = new Date(viewModel.dateBoxValue());
					var postOrderNumber = Number(viewModel.orderId());
					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/mobile/ProcessOrder";
					var delayDate = Number(newDelayDate.getTime() / 1000);
					return $.post(url, {
						TokenId : tokenId,
						OrderId : postOrderNumber,
						Action : "Delayed",
						DelayDate : delayDate
					}, "json").done(function(data, textStatus) {
						viewModel.hideDetailDelayPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						var orderRemove = viewModel.orderNumber();
						viewModel.ordersStore.remove(orderRemove);
						MyApp.app.back();
						DevExpress.ui.notify('Hoãn đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.hideDetailDelayPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
					});
				}
			});
		},
	};
	splitDetailCheckChanged = function() {
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

	return viewModel;
};
