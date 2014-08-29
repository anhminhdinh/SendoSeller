MyApp.products = function(params) {
	var LOADSIZE = 30;
	var viewModel = {
		totalscore : ko.observable(0),
		score : ko.observable(0),
		autoscore : ko.observable(0),
		isAndroid : ko.observable(false),
		viewShowing : function() {
			if (window.sessionStorage.getItem("mustNotRefreshProduct") === null) {
				productsStore.clear();
				productsDataSource.load();
				viewModel.totalscore(0);
				viewModel.score(0);
				viewModel.autoscore(0);
			} else {
				var id = window.sessionStorage.getItem("editedProduct");

				if (id !== null) {
					productsStore.byKey(id).done(function(dataItem) {
						var name = window.sessionStorage.getItem("editedProductName");
						var price = window.sessionStorage.getItem("editedProductPrice");
						var weight = window.sessionStorage.getItem("editedProductWeight");

						dataItem.noUp = true;
						dataItem.noEdit = true;
						dataItem.name = name;
						dataItem.price = price;
						dataItem.weight = weight;
						productsStore.update(id, dataItem);
						productsDataSource.load();
						viewModel.loadPanelVisible(false);
						window.sessionStorage.removeItem("editedProduct");
						window.sessionStorage.removeItem("editedProductName");
						window.sessionStorage.removeItem("editedProductPrice");
						window.sessionStorage.removeItem("editedProductWeight");

					});
				}
			}
			var platform = DevExpress.devices.real().platform;
			viewModel.isAndroid(platform === 'android' || platform === 'generic');
			if (window.sessionStorage.getItem("access_token") === null) {
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
			if (window.sessionStorage.getItem("mustNotRefreshProduct") === null)
				doLoadProducts(true);
			else
				window.sessionStorage.removeItem("mustNotRefreshProduct");
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
		endOfList : ko.observable(false),

	};

	var currentLoadStart = 1;

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
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/Products/UpdateProductStock";
				return $.ajax({
					type : 'POST',
					dataType : "json",
					contentType : "application/json",
					url : url,
					data : JSON.stringify({
						Id : itemData.id,
						StockAvailability : !itemData.stockAvailability,
					}),
					beforeSend : function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
					},
				}).done(function(data) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag === true) {
						productsStore.byKey(itemData.id).done(function(dataItem) {
							dataItem.stockAvailability = !itemData.stockAvailability;
							dataItem.noUp = !dataItem.stockAvailability || dataItem.noEdit || (viewModel.totalscore() === 0);
							productsStore.update(itemData.id, dataItem);
							productsDataSource.sort({
								getter : 'upProductDate',
								desc : true
							});
							productsDataSource.load();
							viewModel.loadPanelVisible(false);
						});
						// doLoadProducts(false);
						DevExpress.ui.notify('Báo trạng thái sản phẩm thành công', 'success', 1000);
					} else {
						prepareLogout(data.Message);
						return;
					}
					// doLoadDataByProductID();
					//textStatus contains the status: success, error, etc
				}).fail(function(jqxhr, textStatus, error) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					prepareLogout("Lỗi mạng");
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
		}],
		pageSize : LOADSIZE
	});

	doLoadUpCount = function(callback) {
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/Products/ListUpProduct";
		$.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : {
			},
			beforeSend : function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
			},
		}).done(function(data) {
			if (data.Flag === true) {
				viewModel.score(data.Data.Score);
				viewModel.autoscore(data.Data.AutoScore);
				viewModel.totalscore(viewModel.score() + viewModel.autoscore());
				if (callback !== null && callback !== undefined)
					callback();
			}
		}).fail(function() {
		});
	};
	doLoadProducts = function(refresh, previous) {
		viewModel.searchString(viewModel.searchString().trim());
		if (refresh === true) {
			currentLoadStart = 1;
		}
		if (previous === true) {
			var oldStart = currentLoadStart - LOADSIZE;
			if (oldStart < 1)
				oldStart = 1;
			currentLoadStart = oldStart;
		}
		productsStore.clear();
		productsDataSource.load();
		var listObj = $("#productsList");
		var List = listObj.dxList('instance');
		List.option('noDataText', '');
		viewModel.loadPanelVisible(true);
		if ( typeof AppMobi === 'object')
			AppMobi.notification.showBusyIndicator();
		var myUserName = window.localStorage.getItem("UserName");
		doLoadUpCount();
		var searchString = viewModel.searchString().trim();
		if (searchString === "")
			searchString = "#";
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/Products/SearchProductByName";
		return $.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : JSON.stringify({
				Name : searchString,
				From : currentLoadStart,
				To : currentLoadStart + LOADSIZE - 1,
				TimeStamp : 0,
			}),
			beforeSend : function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
			},
		}).done(function(data) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			if (data.Flag !== true) {
				prepareLogout(data.Message);
				return;
			}

			if ((data.Data === null) || (data.Data.length === 0)) {
				viewModel.endOfList(true);
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
					upProductDate : UpProductDate.getTime(),
					updatedDate : item.UpdatedDate,
					displayUpProductDate : showUpProductDate,
					upProductDateDisplay : UpProductDateDisplay,
					updatedDateDisplay : UpdatedDateDisplay,
					stockAvailability : item.StockAvailability,
					stockAvailabilityDisplay : item.StockAvailability ? 'Còn hàng' : 'Hết hàng',
					noEdit : !item.CanEdit,
					noUp : !item.CanUp || !item.StockAvailability || (viewModel.totalscore() === 0) || !item.CanEdit,
				};
			});
			// productsStore.clear();
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
			viewModel.endOfList(result.length < LOADSIZE);
			doReload(true);

		}).fail(function(jqxhr, textStatus, error) {
			prepareLogout("Lỗi mạng");
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
		var domain = window.sessionStorage.getItem("domain");
		var url = domain + "/api/Products/UpProduct";
		return $.ajax({
			type : 'POST',
			dataType : "json",
			contentType : "application/json",
			url : url,
			data : JSON.stringify({
				ProductId : id,
			}),
			beforeSend : function(xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
			},
		}).done(function(data) {
			if (data.Flag === true) {
				if (data.Data.Warning !== '')
					DevExpress.ui.notify("Up sản phẩm thành công - " + data.Data.Warning, 'success', 3000);
				else
					DevExpress.ui.notify("Up sản phẩm thành công", 'success', 1000);
				viewModel.score(data.Data.Score);
				viewModel.autoscore(data.Data.AutoScore);
				viewModel.totalscore(viewModel.score() + viewModel.autoscore());
				if (viewModel.totalscore() === 0)
					doLoadProducts();
				else
					productsStore.byKey(id).done(function(dataItem) {
						var today = new Date();
						dataItem.upProductDate = today.getTime();
						var UpProductDateDisplay = Globalize.format(today, 'HH:mm dd/MM/yyyy');
						dataItem.upProductDateDisplay = UpProductDateDisplay;
						dataItem.displayUpProductDate = true;
						dataItem.noUp = dataItem.noUp || (viewModel.totalscore() === 0);
						productsStore.update(id, dataItem);
						productsDataSource.sort({
							getter : 'upProductDate',
							desc : true
						});
						productsDataSource.load();
						viewModel.loadPanelVisible(false);
					});
				//
			} else {
				viewModel.loadPanelVisible(false);
				DevExpress.ui.notify(data.Message + ' - Xin vui lòng thử lại sau.', 'error', 1000);
			}
		}).fail(function(jqxhr, textStatus, error) {
			viewModel.loadPanelVisible(false);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.hideBusyIndicator();
			prepareLogout("Lỗi mạng");
		});

		/*}
		 );}*/
	};

	doReload = function(sortType) {
		productsDataSource.sort([{
			getter : 'upProductDate',
			desc : true
		}]);
		productsDataSource.pageIndex(0);
		productsDataSource.load().done(function(results) {
			loadImages();
			setTimeout(function() {
				DevExpress.ui.notify('Trang ' + (1 + (currentLoadStart - 1 ) / LOADSIZE), 'info', 1000);
			}, 500);
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
		var currentView = (page + 1) * pageSize;
		if (currentView >= LOADSIZE - 1) {
			currentLoadStart += LOADSIZE;
			doLoadProducts(false);
		}
		loadImages();
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

	return viewModel;
};
