define("KnGitGuiMixin",
	["KnGitGuiMessageBox"],
	function () {

		Ext.define("BPMSoft.configuration.mixins.KnGitGuiMixin", {
			alternateClassName: "BPMSoft.KnGitGuiMixin",

			collection: null,
			
			showModalBox: function (next, data) {
				data = Ext.create("BPMSoft.BaseViewModelCollection");
				
				if (data && data.getCount() >= 0) {
					var gridConfig = this.getGridConfig();

					var handler = function (returnCode, rejectingReason, scope) {
						scope.onDestroy();
						next(returnCode, rejectingReason);
					};

					var messageBox = Ext.create("BPMSoft.KnGitGuiMessageBox", {
						id: "KnGitGuiMessageBox",
						handler: handler,
						handlerScope: this,
						gridData: data,
						gridConfig: gridConfig
					});

					messageBox.show();

					//this.sandbox.registerMessages({"HistoryStateChanged": { "direction": "subscribe", "mode": "broadcast" }})
					//this.sandbox.subscribe("HistoryStateChanged", messageBox.onDestroy.bind(messageBox), this);
				}
			},

			/**
			 * Формирует настройки реестра изменений
			 * Настройки колонок реестра
			 */
			getGridConfig: function () {
				var listedConfig = {
					captionsConfig: [],
					columnsConfig: []
				};

				var statusColumn = {
					cols: 5,
					key: [{
						name: {
							bindTo: "Status"
						},
						type: "text"
					}]
				};
				var arrowValueColumn = {
					cols: 1,
					key: [{
						name: {
							bindTo: "ArrowValue"
						},
						type: "text"
					}]
				};
				var nameColumn = {
					cols: 8,
					key: [{
						name: {
							bindTo: "Name"
						},
						type: "text"
					}]
				};

				listedConfig.columnsConfig.push(arrowValueColumn);
				listedConfig.columnsConfig.push(statusColumn);
				listedConfig.columnsConfig.push(nameColumn);				

				var gridConfig = {
					type: "listed",
					id: "kn-git-gui-client",
					listedConfig: listedConfig
				};

				return gridConfig;
			}
		});

		return BPMSoft.KnGitGuiMixin;
	});
