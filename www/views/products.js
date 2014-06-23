MyApp.products = function(params) {
	var viewModel = {
		// dataSource : ko.observableArray(),
		viewShowing : function() {
			if (window.sessionStorage.getItem("MyTokenId") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined
				}, {
					root : true
				});
			} else {
				// productsStore.clear();
				doLoadProducts();
			}
		},
		viewShown : function() {
			var isAndroid = DevExpress.devices.real().platform === 'android';
			var obj = null;
			obj = $("#productsList");
			var list = obj.dxList("instance");
			list.option('showNextButton', isAndroid);
			list.option('pullRefreshEnabled', !isAndroid);
			var _dataSource = list._dataSource;
			if (_dataSource !== undefined) {
				var _items = _dataSource._items;
				if (_items !== undefined) {
					var length = _items.length;
					currentView = length;
				}
			}
			// list.option('autoPagingEnabled', !isAndroid);
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
				id : itemData.id
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
	var currentLoadSize = 100;
	var currentView = 0;
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
				return $.post("http://180.148.138.140/sellerTest2/api/mobile/UpdateProductStock", {
					TokenId : tokenId,
					Id : itemData.id,
					StockAvailability : !itemData.stockAvailability,
				}, "json").done(function(data) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
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

			return $.post("http://180.148.138.140/sellerTest2/api/mobile/UpdateProduct", {
				TokenId : tokenId,
				Id : viewModel.dataItem().id,
				Name : viewModel.editName(),
				Weight : viewModel.editWeight(),
				Price : viewModel.editPrice(),
			}, "json").done(function(data) {
				viewModel.loadPanelVisible(false);
				AppMobi.notification.hideBusyIndicator();
				viewModel.popupEditVisible(false);
				if (data.Flag !== true) {
					DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
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
		var timeStamp = Number(window.localStorage.getItem(myUserName + "ProductsTimeStamp"));
		if (timeStamp === null)
			timeStamp = 0;

		if (viewModel.searchString() !== '')
			timeStamp = 0;
		return $.post("http://180.148.138.140/sellerTest2/api/mobile/SearchProductByName", {
			TokenId : tokenId,
			Name : viewModel.searchString(),
			From : currentLoadStart,
			To : currentLoadStart + currentLoadSize - 1,
			TimeStamp : timeStamp,
		}, "json").done(function(data) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
				return;
			}

			if (data.Data === null) {
				return;
			}
			if (viewModel.searchString() !== '')
				window.localStorage.setItem(myUserName + "ProductsTimeStamp", data.TimeStamp);
			var result = $.map(data.Data, function(item) {
				var UpProductDate = convertDate(item.UpProductDate);
				UpProductDateDisplay = Globalize.format(UpProductDate, 'dd/MM/yyyy');
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
			var err = textStatus + ", " + jqxhr.responseText;
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

				return $.post("http://180.148.138.140/sellerTest2/api/mobile/UpProduct", {
					TokenId : tokenId,
					ProductId : id,
				}, "json").done(function(upData, upTextStatus) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
						return;
					}
					viewModel.loadPanelVisible(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					$.post("http://180.148.138.140/sellerTest2/api/mobile/ProductInfoById", {
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
						UpProductDateDisplay = Globalize.format(UpProductDate, 'dd/MM/yyyy');

						var UpdatedDate = convertDate(data.Data.UpdatedDate);
						UpdatedDateDisplay = Globalize.format(UpdatedDate, 'dd/MM/yyyy');

						productsStore.byKey(id).done(function(dataItem) {
							dataItem.upProductDate = UpProductDate;
							dataItem.upProductDateDisplay = UpProductDateDisplay;
							dataItem.updatedDate = UpdatedDate;
							dataItem.updatedDateDisplay = UpdatedDateDisplay;
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
		productsStore.load();
		productsDataSource.sort([{
			getter : 'upProductDate',
			desc : sortType
		}, {
			getter : 'updatedDate',
			desc : sortType
		}]);

		// if (viewModel.searchString() !== '') {
		// DevExpress.ui.notify("search by " + viewModel.searchString(), "info", 3000);
		productsDataSource.filter("name", "contains", viewModel.searchString());
		// }

		productsDataSource.pageIndex(0);
		productsDataSource.load();

		var _items = productsDataSource._items;
		if (_items !== undefined) {
			var length = _items.length;
			currentView = length;
		}
	};

	loadImages = function() {
		jQuery("img.product-thumbnail.lazy").lazy({
			effect : "fadeIn",
			effectTime : 1500
		});
	};

	loadNext = function() {
		var _items = productsDataSource._items;
		if (_items !== undefined) {
			var length = _items.length;
			currentView = length;
		}
		currentView += 10;
		if (currentView >= currentLoadStart + currentLoadSize - 1) {
			currentLoadStart += currentLoadSize;
			doLoadProducts();
		}
		loadImages();
	};

	return viewModel;
};
