MyApp['order-details'] = function(params) {

	var viewModel = {
		title : ko.observable('Orders'),
		dropDownMenuData : [{
			text : "Còn hàng",
			clickAction : function() {
				processValueChange("Processing");
			},
			disabled : ko.observable(true),
		}, {
			text : "Hoãn đơn hàng",
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
		}],
		viewShown : function(e) {
			this.title("Đơn hàng " + this.id);
			listDataStore.byKey(this.id).done(function(dataItem) {
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
						viewModel.orderStatus("Đang giao hàng");
						break;
					case "Delayed":
						viewModel.orderStatus("Đang hoãn");
						break;
				}

				viewModel.note(dataItem.note);
				if ((dataItem.note === null) || (dataItem.note === undefined) || (dataItem.note === '')) {
					$("#noteField").hide();
				}
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
				viewModel.loadPanelVisible(false);
			}).fail(function(error) {
				alert(JSON.stringify(error));
				viewModel.loadPanelVisible(false);
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
		showActionSheet : function() {
			var canProcess = !viewModel.canProcess();
			var canDelay = !viewModel.canDelay();
			var canSplit = !viewModel.canSplit();
			var canCancel = !viewModel.canCancel();
			viewModel.dropDownMenuData[0].disabled(canProcess);
			viewModel.dropDownMenuData[1].disabled(canDelay);
			viewModel.dropDownMenuData[2].disabled(canSplit);
			viewModel.dropDownMenuData[3].disabled(canCancel);
			viewModel.actionSheetVisible(true);
		},
		dateBoxValue : ko.observable(new Date()),
		popupDelayVisible : ko.observable(false),
		popupSplitVisible : ko.observable(false),
		loadPanelVisible : ko.observable(true),
	};

	var myUserName = window.localStorage.getItem("UserName");
	listDataStore = new DevExpress.data.LocalStore({
		type : "local",
		name : myUserName + "OrdersStore",
		key : "orderNumber",
		flushInterval : 1000,
		// immediate : true,
	});

	deleted = function() {
		viewModel.cantSplitCurrentItem(viewModel.productsToSplit().length === 0);
	};

	showLoading = function(show) {
		viewModel.loadPanelVisible(show);
	};

	hideSplitPopUp = function() {
		viewModel.loadPanelVisible(false);
		viewModel.popupSplitVisible(false);
	};

	hideDelayPopUp = function() {
		viewModel.loadPanelVisible(false);
		viewModel.popupDelayVisible(false);
	};

	processValueChange = function(text) {
		switch (text) {
			case "Processing":
				doSwitchProcessOrderByOrderID();
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
					};
					viewModel.productsToSplit().push(product);
				}

				viewModel.popupSplitVisible(true);
				var splitObj = $("#popupSplitList");
				var splitList = splitObj.dxList('instance');
				splitList.option('dataSource', viewModel.productsToSplit());

				var totalHeight = $("#popupSplitContent").height();
				var footerHeight = $("#popupSplitFooter").height();
				$("popupSplitList").height(totalHeight - footerHeight);
				viewModel.cantSplitCurrentItem(true);
				break;
			case "New":
				doNewOrderByOrderID();
				break;
			case "Cancel":
				doCancelOrderByOrderID();
				break;
		}
	};

	doCancelOrderByOrderID = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var postOrderNumber = Number(viewModel.orderId);
		return $.post("http://ban.sendo.vn/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : "Cancel",
		}, "json").done(function(data, textStatus) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag != true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}

			listDataStore.remove(viewModel.dataItem().orderNumber);
			MyApp.app.back();
		}).fail(function(jqxhr, textStatus, error) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	doProcessOrderByOrderID = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var postOrderNumber = Number(viewModel.orderId);

		var dataToSend = {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : "Processing",
		};
		var jsonData = JSON.stringify(dataToSend);
		return $.post("http://ban.sendo.vn/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderNumber : viewModel.dataItem().orderNumber,
			Action : "Processing",
		}, "json").done(function(data, textStatus) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag != true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			viewModel.dataItem().status = "Processing";
			listDataStore.update(viewModel.dataItem().orderNumber, viewModel.dataItem());
			MyApp.app.back();
		}).fail(function(jqxhr, textStatus, error) {
			showLoading(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	doSplitOrderByOrderID = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var splitIDs = [];
		for (var i = 0; i < viewModel.productsToSplit().length; i++) {
			splitIDs.push(viewModel.productsToSplit()[i].id);
		}
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var postOrderNumber = Number(viewModel.dataItem().orderId);
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : "Splitting",
			ProductSplits : splitIDs
		}, "json").done(function(data, textStatus) {
			hideSplitPopUp();
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag != true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			listDataStore.remove(viewModel.dataItem().orderNumber);
			MyApp.app.back();
			//TODO modify local data here
		}).fail(function(jqxhr, textStatus, error) {
			hideSplitPopUp();
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	doDelayOrderByOrderID = function() {
		showLoading(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var newDelayDate = new Date(viewModel.dateBoxValue());
		var postOrderNumber = Number(viewModel.orderId);
		return $.post("http://ban.sendo.vn/api/mobile/ProcessOrder", {
			TokenId : tokenId,
			OrderId : postOrderNumber,
			Action : "Delay",
			DelayDate : Globalize.format(newDelayDate, 'yyyy-MM-dd')
		}, "json").done(function(data, textStatus) {
			hideDelayPopUp();
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag != true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}
			viewModel.dataItem().status = "Delayed";
			listDataStore.update(viewModel.dataItem().orderNumber, viewModel.dataItem());
			MyApp.app.back();
		}).fail(function(jqxhr, textStatus, error) {
			hideDelayPopUp();
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

	};

	return viewModel;
};
