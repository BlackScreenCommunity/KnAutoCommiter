define("KnGitGuiMixin", [
	"ext-base",
	"ServiceHelper",
	"KnGitGuiMessageBox",
], function (Ext, ServiceHelper) {
	Ext.define("BPMSoft.configuration.mixins.KnGitGuiMixin", {
		alternateClassName: "BPMSoft.KnGitGuiMixin",

		collection: null,
		messageBoxInstance: null,

		changeStatusEnum: Object.freeze({
			M: "Изменен",
			T: "Изменен тип файла",
			A: "Добавлен",
			D: "Удален",
			R: "Переименован",
			C: "Скопирован",
			U: "Обновлен, но есть конфликт",
			"??": "Добавлен",
		}),

		showModalBox: function () {
			var callback = function (data) {
				if (data && data.getCount() >= 0) {
					var gridConfig = this.getGridConfig();

					var handler = function (
						returnCode,
						rejectingReason,
						scope,
					) {
						scope.onDestroy();
						//next(returnCode, rejectingReason);
					};

					if (!this.messageBoxInstance) {
						this.messageBoxInstance = Ext.create(
							"BPMSoft.KnGitGuiMessageBox",
							{
								id: "KnGitGuiMessageBox",
								handler: handler,
								handlerScope: this,
								gridData: data,
								gridConfig: gridConfig,
							},
						);
					}

					this.messageBoxInstance.show();
				}
			};

			this.prepareCollection(callback);
		},

		prepareCollection: function (callback) {
			var changesData = [];

			ServiceHelper.callService(
				"KnCommiterService",
				"GetRepoStatus",
				function (response) {
					let data = {};
					if (response && response.GetRepoStatusResult) {
						data = response.GetRepoStatusResult.split("\r\n")
							.map((x) => x.trim())
							.filter((x) => x.length > 0)
							.map((x) => this.splitStrinngByStatusAndFile(x))
							.map((x) => ({
								Status: this.changeStatusEnum[x.Status],
								Name: x.Name,
							}));
					}

					console.table(data);

					var results = Ext.create("BPMSoft.BaseViewModelCollection");

					data.forEach(function (changeItem) {
						var diffItem = Ext.create(
							"BPMSoft.BaseGridRowViewModel",
							{
								columns: {
									Status: {
										name: "Status",
										dataValueType:
											BPMSoft.DataValueType.TEXT,
									},
									Name: {
										name: "Name",
										dataValueType:
											BPMSoft.DataValueType.TEXT,
									},
								},
							},
						);
						diffItem.set("Status", changeItem.Status);
						diffItem.set("Name", changeItem.Name);

						results.add(BPMSoft.generateGUID(), diffItem);
					}, this);

					Ext.callback(callback, this, [results]);
				},
				{},
				this,
			);
		},

		/**
		 * Формирует настройки реестра изменений
		 * Настройки колонок реестра
		 */
		getGridConfig: function () {
			var listedConfig = {
				captionsConfig: [],
				columnsConfig: [],
			};

			var statusColumn = {
				cols: 6,
				key: [
					{
						name: {
							bindTo: "Status",
						},
						type: "text",
					},
				],
			};
			var nameColumn = {
				cols: 18,
				key: [
					{
						name: {
							bindTo: "Name",
						},
						type: "text",
					},
				],
			};

			listedConfig.columnsConfig.push(statusColumn);
			listedConfig.columnsConfig.push(nameColumn);

			var gridConfig = {
				type: "listed",
				id: "kn-git-gui-client",
				listedConfig: listedConfig,
			};

			return gridConfig;
		},

		splitStrinngByStatusAndFile: function (statusLine) {
			let position = statusLine.indexOf(" ");
			return {
				Status: statusLine.substr(0, position),
				Name: statusLine.substr(position + 1),
			};
		},
	});

	return BPMSoft.KnGitGuiMixin;
});
