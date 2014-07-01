MyApp.products = function(params) {
	var LOADSIZE = 100;
	var viewModel = {
		// dataSource : ko.observableArray(),
		score : ko.observable(0),
		autoscore : ko.observable(0),
		viewShowing : function() {
			if (window.sessionStorage.getItem("MyTokenId") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined,
				}, {
					root : true
				});
			} else {
				doLoadProducts();
			}
		},
		viewShown : function() {
			var platform = DevExpress.devices.real().platform;
			var isAndroid = platform === 'android' || platform === 'generic';
			var topbar = $("#topbar");
			var barHeight = topbar.height();
			var contentview = $("#contentview");
			var contentHeight = contentview.height();
			var obj = null;
			obj = $("#productsList");
			var listHeight = contentHeight - barHeight;
			obj.height(listHeight);
			var list = obj.dxList("instance");
			list.option('showNextButton', isAndroid);
			list.option('pullRefreshEnabled', !isAndroid);
			currentLoadStart = 0;
			loadImages();
		},
		loadPanelVisible : ko.observable(false),
		searchString : ko.observable(''),
		find : function() {
			viewModel.showSearch(!viewModel.showSearch());
			viewModel.searchString('');
			if (viewModel.showSearch())
				$('#searchBox').dxTextBox('instance').focus();

		},
		showSearch : ko.observable(false),
		rowClick : function(e, itemData) {
			MyApp.app.navigate({
				view : 'product-details',
				id : itemData.id,
			});
		},
		selectedType : ko.observable('updatedDate'),

		processSortTypeChange : function() {
			doReload(true);
		},
		showSortOptions : function() {
			this.actionSheetVisible(true);
		},
		actionSheetVisible : ko.observable(false),
		dropDownMenuData : [{
			text : "Mới nhất",
			clickAction : function() {
				// viewModel.selectedType("updatedDate");
				doReload(true);
			}
		}, {
			text : "Cũ nhất",
			clickAction : function() {
				// viewModel.selectedType("upProductDate");
				doReload(false);
			}
		}],
		dataItem : ko.observable(),
		popupEditVisible : ko.observable(false),
		editName : ko.observable(''),
		editPrice : ko.observable(0),
		editWeight : ko.observable(0),
		hideEditPopup : function(e) {
			this.popupEditVisible(false);
		},
	};
	var currentLoadStart = 0;
	edit = function(e, itemData) {
		viewModel.popupEditVisible(true);
		productsStore.byKey(itemData.id).done(function(dataItem) {
			viewModel.dataItem(dataItem);
			viewModel.editName(dataItem.name);
			viewModel.editPrice(dataItem.price);
			viewModel.editWeight(dataItem.weight);
		});
	};

	changeStockStatus = function(e, itemData) {
		// e.jQueryEvent.stopPropagation();
		var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn thay đổi trạng thái còn / hết hàng?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
				viewModel.loadPanelVisible(true);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.showBusyIndicator();
				var tokenId = window.sessionStorage.getItem("MyTokenId");
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/mobile/UpdateProductStock";
				return $.post(url, {
					TokenId : tokenId,
					Id : itemData.id,
					StockAvailability : !itemData.stockAvailability,
				}, "json").done(function(data) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
						return;
					}

					productsStore.byKey(itemData.id).done(function(dataItem) {
						dataItem.stockAvailability = !itemData.stockAvailability;
						dataItem.stockAvailabilityDisplay = itemData.stockAvailability ? 'Còn hàng' : 'Hết hàng';
						productsStore.remove(itemData.id);
						productsStore.insert(dataItem);
					});
					doReload(true);
					// doLoadDataByProductID();
					//textStatus contains the status: success, error, etc
				}).fail(function(jqxhr, textStatus, error) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				});
			} else {
				doReload(true);
			}
		});
	};

	changeProductProperties = function() {
		var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn sửa thông tin sản phẩm?", "Sendo");
		result.done(function(dialogResult) {
			viewModel.loadPanelVisible(true);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.showBusyIndicator();
			if (!dialogResult) {
				return;
			}
			var tokenId = window.sessionStorage.getItem("MyTokenId");
			var newPrice = Number(viewModel.editPrice().toString().replace(/,/g, ''));
			var newWeight = Number(viewModel.editWeight().toString().replace(/,/g, ''));
			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/mobile/UpdateProduct";
			return $.post(url, {
				TokenId : tokenId,
				Id : viewModel.dataItem().id,
				Name : viewModel.editName(),
				Weight : newWeight,
				Price : newPrice,
			}, "json").done(function(data) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				viewModel.popupEditVisible(false);
				if (data.Flag !== true) {
					DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
					return;
				}

				productsStore.byKey(viewModel.dataItem().id).done(function(dataItem) {
					dataItem.name = viewModel.editName();
					dataItem.price = viewModel.editPrice();
					dataItem.weight = viewModel.editWeight();
					productsStore.remove(dataItem.id);
					productsStore.insert(dataItem);
				});
				doReload(true);
			}).fail(function(jqxhr, textStatus, error) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				viewModel.popupEditVisible(false);
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			});

		});
	};

	var myUserName = window.localStorage.getItem("UserName");
	productsStore = new DevExpress.data.LocalStore({
		name : myUserName + "productsStore",
		key : "id",
	});
	productsDataSource = new DevExpress.data.DataSource({
		store : productsStore,
		sort : [{
			getter : 'upProductDate',
			desc : true
		}, {
			getter : 'updatedDate',
			desc : true
		}],
		pageSize : 10
	});

	doLoadProducts = function() {
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var myUserName = window.localStorage.getItem("UserName");
		var tokenId = window.sessionStorage.getItem("MyTokenId");
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/ListUpProduct";
		$.post(url, {
			TokenId : tokenId,
		}, "json").done(function(data) {
			if (data.Flag === true) {
				viewModel.score(data.Data.Score);
				viewModel.autoscore(data.Data.AutoScore);
			}
		}).fail(function() {
		});

		var timeStamp = Number(window.localStorage.getItem(myUserName + "ProductsTimeStamp"));
		if (timeStamp === null)
			timeStamp = 0;

		if (viewModel.searchString() !== "")
			timeStamp = 0;
		if (currentLoadStart > 0)
			timeStamp = 0;
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/SearchProductByName";
		return $.post(url, {
			TokenId : tokenId,
			Name : viewModel.searchString(),
			From : currentLoadStart,
			To : currentLoadStart + LOADSIZE - 1,
			TimeStamp : timeStamp,
		}, "json").done(function(data) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
				return;
			}

			if (data.Data === null) {
				doReload(true);
				return;
			}
			if (viewModel.searchString() === "")
				if (currentLoadStart === 0)
					window.localStorage.setItem(myUserName + "ProductsTimeStamp", data.TimeStamp);

			var result = $.map(data.Data, function(item) {
				var UpProductDate = convertDate(item.UpProductDate);
				var today = new Date();
				var UpProductDateDisplay = DateDiff.showDiff(today, UpProductDate);
				var UpdatedDate = convertDate(item.UpdatedDate);
				UpdatedDateDisplay = Globalize.format(UpdatedDate, 'dd/MM/yyyy');
				var price = numberWithCommas(item.Price);
				var showUpProductDate = UpProductDate.getFullYear() > 1;
				return {
					id : item.Id,
					name : item.Name,
					thumbnail : item.Thumnail,
					price : price,
					storeSKU : item.StoreSku,
					quantity : item.Quantity,
					weight : item.Weight,
					storeSKU : item.StoreSku,
					upProductDate : UpProductDate,
					updatedDate : UpdatedDate,
					displayUpProductDate : showUpProductDate,
					upProductDateDisplay : UpProductDateDisplay,
					updatedDateDisplay : UpdatedDateDisplay,
					stockAvailability : item.StockAvailability,
					stockAvailabilityDisplay : item.StockAvailability ? 'Còn hàng' : 'Hết hàng',
					noEdit : !item.CanEdit,
					noUp : !item.CanUp,
				};
			});
			for (var i = 0; i < result.length; i++) {
				productsStore.byKey(result[i].id).done(function(dataItem) {
					if (dataItem !== undefined)
						productsStore.update(result[i].id, result[i]);
					else
						productsStore.insert(result[i]);
				}).fail(function(error) {
					productsStore.insert(result[i]);
				});
			}
			doReload(true);

		}).fail(function(jqxhr, textStatus, error) {
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			viewModel.loadPanelVisible(false);
			AppMobi.notification.hideBusyIndicator();
		});

	};

	upProduct = function(id) {
		var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn up sản phẩm?", "Sendo");
		result.done(function(dialogResult) {
			if (dialogResult) {
				viewModel.loadPanelVisible(true);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.showBusyIndicator();
				var tokenId = window.sessionStorage.getItem("MyTokenId");
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/mobile/UpProduct";
				return $.post(url, {
					TokenId : tokenId,
					ProductId : id,
				}, "json").done(function(upData, upTextStatus) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (upData.Flag !== true) {
						DevExpress.ui.dialog.alert(data.Message, "Sendo.vn");
						return;
					}
					viewModel.loadPanelVisible(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/mobile/ProductInfoById";
					$.post(url, {
						TokenId : tokenId,
						Id : id,
					}, "json").done(function(data) {
						viewModel.loadPanelVisible(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag !== true) {
							DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
							return;
						}
						var UpProductDate = convertDate(data.Data.UpProductDate);
						var today = new Date();
						var UpProductDateDisplay = DateDiff.showDiff(today, UpProductDate);

						var UpdatedDate = convertDate(data.Data.UpdatedDate);
						UpdatedDateDisplay = Globalize.format(UpdatedDate, 'dd/MM/yyyy');

						productsStore.byKey(id).done(function(dataItem) {
							dataItem.upProductDate = UpProductDate;
							dataItem.upProductDateDisplay = UpProductDateDisplay;
							dataItem.updatedDate = UpdatedDate;
							dataItem.updatedDateDisplay = UpdatedDateDisplay;
							dataItem.displayUpProductDate = true;
							productsStore.remove(id);
							productsStore.insert(dataItem);
						});
						doReload(true);
					});
				}).fail(function(jqxhr, textStatus, error) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				});
			}
		});
	};

	doReload = function(sortType) {
		productsDataSource.filter("name", "contains", viewModel.searchString());
		productsDataSource.pageIndex(0);
		productsDataSource.sort([{
			getter : 'upProductDate',
			desc : sortType
		}, {
			getter : 'updatedDate',
			desc : sortType
		}]);
		productsDataSource.load().done(function(results) {
		});

	};

	loadImages = function() {
		jQuery("img.product-thumbnail.lazy").lazy({
			effect : "fadeIn",
			effectTime : 1500
		});
	};

	loadNextProducts = function() {
		var page = productsDataSource._pageIndex;
		var pageSize = productsDataSource._pageSize;
		var currentView = (page + 2) * pageSize;
		if (currentView >= currentLoadStart + LOADSIZE - 1) {
			currentLoadStart += LOADSIZE;
			doLoadProducts();
		}
		loadImages();
	};

	updatePriceFormat = function() {
		var priceBox = $("#priceBox").dxTextBox("instance");
		priceBox.endUpdate();
		var price = priceBox.option('value');
		price = price.toString().replace(/,/g, '');
		var newprice = numberWithCommas(price);
		priceBox.option('value', newprice);
		// viewModel.editPrice(newPrice);
	};

	updateWeightFormat = function() {
		var weightBox = $("#weightBox").dxTextBox("instance");
		weightBox.endUpdate();
		var weight = weightBox.option('value');
		weight = weight.toString().replace(/,/g, '');
		var newweight = numberWithCommas(weight);
		weightBox.option('value', newweight);
	};
	return viewModel;
};
