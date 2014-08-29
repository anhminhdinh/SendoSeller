MyApp.productedit = function(params) {
	var viewModel = {
		viewShown : function() {
			window.sessionStorage.setItem("mustNotRefreshProduct", true);
			viewModel.loadPanelVisible(true);
			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/Products/ProductInfoById";
			return $.ajax({
				type : 'POST',
				dataType : "json",
				contentType : "application/json",
				url : url,
				data : JSON.stringify({
					Id : params.id,
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
				console.log(JSON.stringify(data));
				viewModel.editName(data.Data.Name);
				viewModel.editPrice(numberWithCommas(data.Data.Price));
				viewModel.editWeight(numberWithCommas(data.Data.Weight));
				viewModel.showEditName(data.Data.Name);
				viewModel.showEditPrice(numberWithCommas(data.Data.Price));
				viewModel.showEditWeight(numberWithCommas(data.Data.Weight));
				viewModel.showEditThumb(data.Data.Thumnail);
			}).fail(function(jqxhr, textStatus, error) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				prepareLogout("Lỗi mạng");
			});

		},
		loadPanelVisible : ko.observable(false),
		editName : ko.observable(''),
		editPrice : ko.observable(0),
		editWeight : ko.observable(0),

		showEditName : ko.observable(''),
		showEditPrice : ko.observable(0),
		showEditWeight : ko.observable(0),
		showEditThumb : ko.observable(''),
	};

	changeProductProperties = function() {
		setTimeout(function() {
			if (viewModel.editName() === '') {
				DevExpress.ui.notify('Tên sản phẩm không được để trống', 'error', 2000);
				$("#nameBox").dxTextBox("instance").focus();
				return;
			}
			if (viewModel.editPrice() === '') {
				DevExpress.ui.notify('Giá sản phẩm không được để trống', 'error', 2000);
				$("#priceBox").dxTextBox("instance").focus();
				return;
			}
			if (!isNumber(viewModel.editPrice())) {
				DevExpress.ui.notify('Giá sản phẩm phải là dạng số', 'error', 2000);
				$("#priceBox").dxTextBox("instance").focus();
				return;
			}
			if (viewModel.editWeight() === '') {
				DevExpress.ui.notify('Khối lượng sản phẩm không được để trống', 'error', 2000);
				$("#weightBox").dxTextBox("instance").focus();
				return;
			}
			if (!isNumber(viewModel.editWeight())) {
				DevExpress.ui.notify('Khối lượng sản phẩm phải là dạng số', 'error', 2000);
				$("#weightBox").dxTextBox("instance").focus();
				return;
			}
			if ((viewModel.editName() === viewModel.showEditName()) && (viewModel.editPrice() === viewModel.showEditPrice()) && (viewModel.editWeight() === viewModel.showEditWeight())) {
				DevExpress.ui.notify('Chưa có thay đổi thông tin của sản phẩm', 'error', 2000);
				$("#nameBox").dxTextBox("instance").focus();
				return;
			}

			var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn sửa thông tin sản phẩm?", "Sendo");
			result.done(function(dialogResult) {
				viewModel.loadPanelVisible(true);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.showBusyIndicator();
				if (!dialogResult) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					return;
				}
				var newPrice = Number(viewModel.editPrice().toString().replace(/,/g, ''));
				var newWeight = Number(viewModel.editWeight().toString().replace(/,/g, ''));
				var domain = window.sessionStorage.getItem("domain");
				var url = domain + "/api/Products/UpdateProduct";
				return $.ajax({
					type : 'POST',
					dataType : "json",
					contentType : "application/json",
					url : url,
					data : JSON.stringify({
						Id : params.id,
						Name : viewModel.editName(),
						Weight : newWeight,
						Price : newPrice,
					}),
					beforeSend : function(xhr) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + window.sessionStorage.getItem("access_token"));
					},
				}).done(function(data) {
					// window.sessionStorage.removeItem("mustNotRefreshProduct");
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					if (data.Flag !== true) {
						prepareLogout(data.Message);
						return;
					}
					window.sessionStorage.setItem("editedProduct", params.id);
					window.sessionStorage.setItem("editedProductName", viewModel.editName());
					window.sessionStorage.setItem("editedProductPrice", viewModel.editPrice());
					window.sessionStorage.setItem("editedProductWeight", viewModel.editWeight());
					backToProduct();
				}).fail(function(jqxhr, textStatus, error) {
					viewModel.loadPanelVisible(false);
					if ( typeof AppMobi === 'object')
						AppMobi.notification.hideBusyIndicator();
					prepareLogout("Lỗi mạng");
				});

			});
		}, 500);

	};

	backToProduct = function() {
		MyApp.app.back();
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

	checkNameEmpty = function() {
		if (viewModel.editName().length === 0) {
			$("#nameBox").dxTextBox("instance").focus();
			return;
		}
	};
	checkPriceEmpty = function() {
		if (viewModel.editPrice().length === 0) {
			$("#priceBox").dxTextBox("instance").focus();
			return;
		}
	};
	checkWeightEmpty = function() {
		if (viewModel.editWeight().length === 0) {
			$("#weightBox").dxTextBox("instance").focus();
			return;
		}
	};

	return viewModel;
};
