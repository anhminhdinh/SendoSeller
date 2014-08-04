﻿MyApp.products = function(params) {
	var LOADSIZE = 100;
	var viewModel = {
		totalscore : ko.observable(0),
		score : ko.observable(0),
		autoscore : ko.observable(0),
		isAndroid : ko.observable(false),
		viewShowing : function() {
			var platform = DevExpress.devices.real().platform;
			viewModel.isAndroid(platform === 'android' || platform === 'generic');
			if (window.sessionStorage.getItem("MyTokenId") === null) {
				MyApp.app.navigate({
					view : "user",
					id : undefined,
				}, {
					root : true
				});
			} else {
			}
		},
		viewShown : function() {
			var topbar = $("#pvtopbar");
			var topbarHeight = topbar.outerHeight(true);
			var searchbar = $("#pvsearchbar");
			var searchbarHeight = searchbar.outerHeight(true);
			var contentview = $("#contentview");
			var contentHeight = contentview.outerHeight(true);
			var obj = null;
			obj = $("#productsList");
			var listHeight = contentHeight - topbarHeight - searchbarHeight;
			obj.height(listHeight);
			currentLoadStart = 0;
			doLoadProducts();
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
		dataItem : ko.observable(),
	};

	var currentLoadStart = 0;

	edit = function(e, itemData) {
		MyApp.app.navigate({
			view : "productedit",
			id : itemData.id,
		});
	};

	changeStockStatus = function(e, itemData) {
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
						prepareLogout(data.Message);
						return;
					}
					viewModel.loadPanelVisible(true);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.showBusyIndicator();
					var domain = window.sessionStorage.getItem("domain");
					var url = domain + "/api/mobile/ProductInfoById";
					$.post(url, {
						TokenId : tokenId,
						Id : itemData.id,
					}, "json").done(function(data) {
						viewModel.loadPanelVisible(false);
						if ( typeof AppMobi === 'object')
							AppMobi.notification.hideBusyIndicator();
						if (data.Flag !== true) {
							prepareLogout(data.Message);
							return;
						}
						if (true) {
							doLoadProducts();
						} else {
							var UpProductDate = convertDate(data.Data.UpProductDate);
							var today = new Date();
							var UpProductDateDisplay = DateDiff.showDiff(today, UpProductDate);

							var UpdatedDate = convertDate(data.Data.UpdatedDate);
							UpdatedDateDisplay = Globalize.format(UpdatedDate, 'dd/MM/yyyy');

							productsStore.byKey(itemData.id).done(function(dataItem) {
								dataItem.upProductDate = data.Data.UpProductDate;
								dataItem.upProductDateDisplay = UpProductDateDisplay;
								dataItem.updatedDate = data.Data.UpdatedDate;
								dataItem.updatedDateDisplay = UpdatedDateDisplay;
								dataItem.displayUpProductDate = UpProductDate.getFullYear() > 1;
								dataItem.stockAvailability = data.Data.StockAvailability;
								dataItem.stockAvailabilityDisplay = data.Data.StockAvailability ? 'Còn hàng' : 'Hết hàng';
								dataItem.noEdit = !data.Data.CanEdit;
								dataItem.noUp = !data.Data.CanUp || !data.Data.StockAvailability;
								productsStore.remove(itemData.id);
								productsStore.insert(dataItem);
							});
							doReload(true);
						}
					});
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


	var dataArray = [];

	var productsStore = new DevExpress.data.ArrayStore({
		data : dataArray,
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
		var listObj = $("#productsList");
		var List = listObj.dxList('instance');
		List.option('noDataText', '');
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
				viewModel.totalscore(viewModel.score() + viewModel.autoscore());
			}
		}).fail(function() {
		});

		var searchString = viewModel.searchString();
		if (searchString === "")
			searchString = "#";
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/mobile/SearchProductByName";
		return $.post(url, {
			TokenId : tokenId,
			Name : searchString,
			From : currentLoadStart,
			To : currentLoadStart + LOADSIZE - 1,
			TimeStamp : 0,
		}, "json").done(function(data) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				prepareLogout(data.Message);
				return;
			}

			if ((data.Data === null) || (data.Data.length === 0)) {
				List.option('noDataText', 'Không tìm thấy sản phẩm nào phù hợp!');
				doReload(true);
				return;
			}
			// if (viewModel.searchString() === "")
			// if (currentLoadStart === 0)
			// window.localStorage.setItem(myUserName + "ProductsTimeStamp", data.TimeStamp);

			var result = $.map(data.Data, function(item) {
				var UpProductDate = convertDate(item.UpProductDate);
				var today = new Date();
				var UpProductDateDisplay = Globalize.format(UpProductDate, 'HH:mm dd/MM/yyyy');
				//DateDiff.showDiff(today, UpProductDate);
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
					upProductDate : item.UpProductDate,
					updatedDate : item.UpdatedDate,
					displayUpProductDate : showUpProductDate,
					upProductDateDisplay : UpProductDateDisplay,
					updatedDateDisplay : UpdatedDateDisplay,
					stockAvailability : item.StockAvailability,
					stockAvailabilityDisplay : item.StockAvailability ? 'Còn hàng' : 'Hết hàng',
					noEdit : !item.CanEdit,
					noUp : !item.CanUp || !item.StockAvailability || (viewModel.totalscore() === 0),
				};
			});
			productsStore.clear();
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
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
		});

	};

	upProduct = function(id) {
		if (viewModel.totalscore() === 0) {
			DevExpress.ui.dialog.alert("Hết lượt up, bạn có thể vào ban.sendo.vn để mua thêm!", "Sendo.vn");
			return;
		}
		/*var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn up sản phẩm?", "Sendo");
		 result.done(function(dialogResult) {
		 if (dialogResult) {*/
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
			if (data.Flag === true) {
				DevExpress.ui.notify('Up sản phẩm thành công', 'success', 1000);
				doLoadProducts();
			} else {
				DevExpress.ui.notify('Up sản phẩm thất bại, xin vui lòng thử lại sau.', 'error', 1000);
			}
		}).fail(function(jqxhr, textStatus, error) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
		});

		/*}
		 );}*/
	};

	doReload = function(sortType) {
		productsDataSource.sort([{
			getter : 'upProductDate',
			desc : true
		}, {
			getter : 'updatedDate',
			desc : true
		}]);
		productsDataSource.pageIndex(0);
		productsDataSource.load().done(function(results) {
			loadImages();
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


	return viewModel;
};
