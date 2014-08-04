MyApp.productedit = function(params) {
	var viewModel = {
		viewShown : function() {
			viewModel.loadPanelVisible(true);
			var tokenId = window.sessionStorage.getItem("MyTokenId");
			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/mobile/ProductInfoById";
			return $.post(url, {
				TokenId : tokenId,
				Id : params.id,
			}, "json").done(function(data) {
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
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
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
		if (viewModel.editWeight() === '') {
			DevExpress.ui.notify('Khối lượng sản phẩm không được để trống', 'error', 2000);
			$("#weightBox").dxTextBox("instance").focus();
			return;
		}
		var result = DevExpress.ui.dialog.confirm("Bạn có chắc muốn sửa thông tin sản phẩm?", "Sendo");
		result.done(function(dialogResult) {
			viewModel.loadPanelVisible(true);
			if ( typeof AppMobi === 'object')
				AppMobi.notification.showBusyIndicator();
			if (!dialogResult) {
				viewModel.loadPanelVisible(false);
				AppMobi.notification.hideBusyIndicator();
				return;
			}
			var tokenId = window.sessionStorage.getItem("MyTokenId");
			var newPrice = Number(viewModel.editPrice().toString().replace(/,/g, ''));
			var newWeight = Number(viewModel.editWeight().toString().replace(/,/g, ''));
			var domain = window.sessionStorage.getItem("domain");
			var url = domain + "/api/mobile/UpdateProduct";
			return $.post(url, {
				TokenId : tokenId,
				Id : params.id,
				Name : viewModel.editName(),
				Weight : newWeight,
				Price : newPrice,
			}, "json").done(function(data) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				if (data.Flag !== true) {
					prepareLogout(data.Message);
					return;
				}
				backToProduct();
			}).fail(function(jqxhr, textStatus, error) {
				viewModel.loadPanelVisible(false);
				if ( typeof AppMobi === 'object')
					AppMobi.notification.hideBusyIndicator();
				DevExpress.ui.dialog.alert("Lỗi mạng, thử lại sau!", "Sendo.vn");
			});

		});
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

	return viewModel;
};
