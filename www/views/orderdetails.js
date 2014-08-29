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
		viewShowing : function() {
			viewModel.displayInfo(false);
			viewModel.displayCarrier(false);
			viewModel.displayTracking(false);
			viewModel.displayNote(false);
			viewModel.displayDelay(false);
			viewModel.displayVoucher(false);
			viewModel.displayShippingFee(false);
			viewModel.displayShippingSendo(false);
			viewModel.displayShippingShop(false);
		},
		viewShown : function(e) {
			//this.title("Đơn hàng " + this.id);
			window.sessionStorage.setItem("ViewDetails", true);

			viewModel.loadPanelVisible(true);
			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/Orders/SalesOrderInfoByOrderNumber";
			return $.ajax({
				type : 'POST',
				dataType : "json",
				contentType : "application/json",
				url : url,
				data : JSON.stringify({
					OrderNumber : params.id,
				}),
				beforeSend : function(xhr) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
				},
			}).done(function(data) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				if (data.Flag !== true) {
					window.sessionStorage.removeItem("ViewDetails");
					prepareLogout(data.Message);
					return;
				}
				viewModel.totalAmount(numberWithCommas(data.Data.TotalAmount));
				viewModel.orderId(data.Data.Id);
				viewModel.orderNumber(data.Data.OrderNumber);
				viewModel.buyerName(data.Data.BuyerName);
				viewModel.buyerAddress(data.Data.BuyerAddress);
				viewModel.buyerPhone(data.Data.BuyerPhone);
				viewModel.orderDate(convertDate(data.Data.OrderDate));
				viewModel.delayDate(convertDate(data.Data.DelayDate));
				viewModel.updatedDate(convertDate(data.Data.UpdatedDate));
				viewModel.orderDateDisplay(Globalize.format(convertDate(data.Data.OrderDate), 'HH:mm dd/MM/yyyy'));
				viewModel.delayDateDisplay(Globalize.format(convertDate(data.Data.DelayDate), 'HH:mm dd/MM/yyyy'));
				viewModel.paymentMethod(data.Data.PaymentMethod === 2 ? 'Senpay' : 'COD');
				viewModel.shippingMethod(data.Data.ShippingType === 1 ? 'Sengo vận chuyển' : (data.Data.shippingMethod === 2 ? 'Tự vận chuyển' : 'Sengo, tự vận chuyển'));
				var orderStatus = "Mới";
				var color = "#000";
				switch (data.Data.OrderStatus) {
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
				viewModel.orderStatus(orderStatus);
				viewModel.orderTypeColor(color);

				viewModel.shippingFee(numberWithCommas(data.Data.ShippingFee));
				viewModel.displayShippingFee(data.Data.ShippingFee > 0);
				viewModel.sendoShippingSupport(numberWithCommas(data.Data.SendoSupportFeeToBuyer));
				viewModel.displayShippingSendo(data.Data.SendoSupportFeeToBuyer > 0);
				viewModel.voucher(numberWithCommas(data.Data.VoucherValue));
				viewModel.displayVoucher(data.Data.VoucherValue > 0);
				viewModel.shopShippingSupport(numberWithCommas(data.Data.SellerShippingFee));
				viewModel.displayShippingShop(data.Data.SellerShippingFee > 0);
				switch (data.Data.PaymentStatus) {
				case 4:
					viewModel.paymentStatus("Đã nhận tiền");
					break;
				case 5:
					viewModel.paymentStatus("Hoàn tiền");
					break;
				case 8:
					viewModel.paymentStatus("Chưa nhận tiền");
					break;
				default:
					viewModel.paymentStatus("Chưa nhận tiền");
					break;
				}

				viewModel.carrierName(data.Data.CarrierName);
				viewModel.displayCarrier((data.Data.CarrierName !== null) && (data.Data.CarrierName !== undefined) && (data.Data.CarrierName !== ''));

				viewModel.trackingNumber(data.Data.TrackingNumber);
				viewModel.displayTracking((data.Data.TrackingNumber !== null) && (data.Data.TrackingNumber !== undefined) && (data.Data.TrackingNumber !== ''));

				viewModel.note(data.Data.Note);
				viewModel.displayNote((data.Data.Note !== null) && (data.Data.Note !== undefined) && (data.Data.Note !== ''));

				var itemProducts = $.map(data.Data.Products, function(product) {
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
				viewModel.products(itemProducts);
				viewModel.canDelay(data.Data.CanDelay);
				viewModel.canCancel(data.Data.CanCancel);
				viewModel.canSplit(data.Data.CanSplit);
				viewModel.canProcess(data.Data.CanProcess);
				var orderStatus = data.Data.OrderStatus;
				viewModel.displayDelay(orderStatus === "Delayed");
				viewModel.confirmRemainingTime(data.Data.ConfirmRemainingTime);
				// viewModel.confirmRemainingTime(4);
				viewModel.displayRemainingTime(viewModel.confirmRemainingTime() > 0);
				viewModel.displayInfo(true);
				// console.log(JSON.stringify(data));
			}).fail(function(jqxhr, textStatus, error) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				prepareLogout("Lỗi mạng");
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
		orderTypeColor : ko.observable(''),
		orderId : ko.observable(0),
		orderNumber : ko.observable(''),
		totalAmount : ko.observable(0),
		buyerName : ko.observable(''),
		buyerAddress : ko.observable(''),
		buyerPhone : ko.observable(''),
		orderDate : ko.observable(),
		delayDate : ko.observable(),
		orderDateDisplay : ko.observable(''),
		delayDateDisplay : ko.observable(''),
		orderStatus : ko.observable(''),
		paymentMethod : ko.observable(''),
		shippingMethod : ko.observable(''),
		shippingFee : ko.observable('0'),
		sendoShippingSupport : ko.observable('0'),
		voucher : ko.observable('0'),
		shopShippingSupport : ko.observable('0'),
		paymentStatus : ko.observable(''),
		carrierName : ko.observable(''),
		trackingNumber : ko.observable('0'),
		confirmRemainingTime : ko.observable(0),
		displayRemainingTime : ko.observable(false),
		canDelay : ko.observable(false),
		canCancel : ko.observable(false),
		canSplit : ko.observable(false),
		canProcess : ko.observable(false),
		displayInfo : ko.observable(false),
		displayCarrier : ko.observable(false),
		displayTracking : ko.observable(false),
		displayNote : ko.observable(false),
		displayDelay : ko.observable(false),
		displayVoucher : ko.observable(false),
		displayShippingFee : ko.observable(false),
		displayShippingShop : ko.observable(false),
		displayShippingSendo : ko.observable(false),
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

			viewModel.cantSplitCurrentItem(true);
			viewModel.popupSplitVisible(true);
			var content = $("#popupSplitContent").parent();
			var totalHeight = content.height();
			var footer = $("#popupSplitFooter");
			var footerHeight = footer.outerHeight(true);
			var newHeight = totalHeight - footerHeight - 20;
			var obj = $("#popupSplitList");
			obj.height(newHeight);
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
			var newDate = new Date();
			var time = newDate.getTime();
			var newTime = time + 24 * 60 * 60 * 1000;
			newDate.setTime(newTime);
			viewModel.dateBoxValue(newDate);
		},

		doCancelOrderByOrderID : function() {
			var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn báo hết hàng?", "Sendo");
			result.done(function(dialogResult) {
				if (dialogResult) {
					viewModel.showLoading(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var postOrderNumber = Number(viewModel.orderId());
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
						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							window.sessionStorage.removeItem("ViewDetails");
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						window.sessionStorage.removeItem("ViewDetails");

						MyApp.app.back();
						DevExpress.ui.notify('Huỷ đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						prepareLogout("Lỗi mạng");
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
					var postOrderNumber = Number(viewModel.orderId());

					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/Orders/ProcessOrder";
					return $.ajax({
						type : 'POST',
						dataType : "json",
						contentType : "application/json",
						url : url,
						data : JSON.stringify({
							OrderId : postOrderNumber,
							Action : "Processing"
						}),
						beforeSend : function(xhr) {
							xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
						},
					}).done(function(data) {

						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							window.sessionStorage.removeItem("ViewDetails");
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						window.sessionStorage.removeItem("ViewDetails");
						MyApp.app.back();
						DevExpress.ui.notify('Xử lý đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.showLoading(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						prepareLogout("Lỗi mạng");
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
						if (viewModel.productsToSplit()[i].selected() === true)
							splitIDs.push(viewModel.productsToSplit()[i].id);
					}
					var postOrderNumber = Number(viewModel.orderId());
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
						viewModel.hideDetailSplitPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							window.sessionStorage.removeItem("ViewDetails");
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						window.sessionStorage.removeItem("ViewDetails");
						MyApp.app.back();
						DevExpress.ui.notify('Hoãn một phần đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.hideDetailSplitPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						prepareLogout("Lỗi mạng");
					});
				}
			});
		},

		doDelayOrderByOrderID : function() {
			var newDelayDate = new Date(viewModel.dateBoxValue());
			var today = new Date();

			if (newDelayDate.getTime() < today.getTime()) {
				DevExpress.ui.dialog.alert("Ngày hoãn không thể nhỏ hơn ngày đơn hàng!", "Sendo.vn");
				return;
			}
			var result = DevExpress.ui.dialog.confirm("Bạn đã chắc chắn muốn hoãn đơn hàng?", "Sendo");
			result.done(function(dialogResult) {
				if (dialogResult) {
					viewModel.showLoading(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var newDelayDate = new Date(viewModel.dateBoxValue());
					var postOrderNumber = Number(viewModel.orderId());
					var domain = window.sessionStorage.getItem("domain");
					var delayDate = Number(newDelayDate.getTime() / 1000);
					var url = domain + "/api/Orders/ProcessOrder";
					return $.ajax({
						type : 'POST',
						dataType : "json",
						contentType : "application/json",
						url : url,
						data : JSON.stringify({
							OrderId : postOrderNumber,
							Action : "Delayed",
							DelayDate : delayDate
						}),
						beforeSend : function(xhr) {
							xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
						},
					}).done(function(data) {
						viewModel.hideDetailDelayPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag != true) {
							window.sessionStorage.removeItem("ViewDetails");
							DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
							return;
						}
						window.sessionStorage.removeItem("ViewDetails");
						MyApp.app.back();
						DevExpress.ui.notify('Hoãn đơn hàng thành công', 'success', 2000);
					}).fail(function(jqxhr, textStatus, error) {
						viewModel.hideDetailDelayPopUp();
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						prepareLogout("Lỗi mạng");
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
