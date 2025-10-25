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
			" M": "Изменен",
			"M ": "Изменен и готов к фиксации",
			MM: "Часть изменений зафиксирована",
			"A ": "Добавлен",
			AM: "Новый файл, часть изменений зафиксирована",
			" D": "Удален и готов к фиксации",
			"D ": "Удален",
			"R ": "Переименован",
			"C ": "Скопирован",
			"??": "Создан",
			UU: "Конфликт",
		}),

		showModalBox: function () {
			var callback = function (data, log, countOfCommitsToPush) {
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
								log: log,
								countOfCommitsToPush: countOfCommitsToPush,
								handlerScope: this,
								gridData: data,
								gridConfig: gridConfig,
							},
						);
					} else {
						this.messageBoxInstance.gridData = data;
						this.messageBoxInstance.log = log;
						this.messageBoxInstance.countOfCommitsToPush =
							countOfCommitsToPush;
					}

					this.messageBoxInstance.on(
						"commitPrepared",
						this.applyCommit,
						this,
					);
					this.messageBoxInstance.on("push", this.pushChanges, this);

					if (this.messageBoxInstance.visible) {
						this.messageBoxInstance.initgrid();
						this.messageBoxInstance.initGitLogLabels();
					} else {
						this.messageBoxInstance.show();
					}
				}
			};

			this.prepareCollection(callback);
		},

		applyCommit: function (commit) {
			ServiceHelper.callService(
				"KnCommiterService",
				"AddAndCommitChanges",
				function () {
					this.showModalBox();
				},
				commit,
				this,
			);
		},

		pushChanges: function () {
			ServiceHelper.callService(
				"KnCommiterService",
				"Push",
				function () {
					this.showModalBox();
				},
				{},
				this,
			);
		},

		prepareGridData: function (gitStatusInfo) {
			let data = gitStatusInfo
				.split("\r\n")
				.filter((x) => x.length > 0)
				.map((x) => this.splitStrinngByStatusAndFile(x))
				.map((x) => ({
					Status: this.changeStatusEnum[x.Status],
					Name: x.Name,
				}));

			var results = Ext.create("BPMSoft.BaseViewModelCollection");

			data.forEach(function (changeItem) {
				var diffItem = Ext.create("BPMSoft.BaseGridRowViewModel", {
					columns: {
						Status: {
							name: "Status",
							dataValueType: BPMSoft.DataValueType.TEXT,
						},
						Name: {
							name: "Name",
							dataValueType: BPMSoft.DataValueType.TEXT,
						},
					},
				});
				diffItem.set("Status", changeItem.Status);
				diffItem.set("Name", changeItem.Name);

				results.add(BPMSoft.generateGUID(), diffItem);
			});

			return results;
		},

		prepareCollection: function (callback) {
			ServiceHelper.callService(
				"KnCommiterService",
				"GetRepoStatus",
				function (response) {
					if (
						response &&
						response.GetRepoStatusResult &&
						response.GetRepoStatusResult.Status &&
						response.GetRepoStatusResult.Log
					) {
						let gridContent = this.prepareGridData(
							response.GetRepoStatusResult.Status,
						);

						let formattedLog = this.formatLog(
							response.GetRepoStatusResult.Log,
						);
						Ext.callback(callback, this, [
							gridContent,
							formattedLog,
						]);
					}
				},
				{},
				this,
			);
		},

		formatLog: function (logLines) {
			let result = logLines
				.map((x) => x.replaceAll("seconds ago", "секунд назад"))
				.map((x) => x.replaceAll("minutes ago", "минут назад"))
				.map((x) => x.replaceAll("hours ago", "часов назад"))
				.map((x) => x.replaceAll("days ago", "дней назад"))
				.map((x) => x.replaceAll("weeks ago", "недель назад"))
				.map((x) => x.replaceAll("months ago", "месяцев назад"))
				.map((x) => x.replaceAll("years ago", "лет назад"));
			return result;
		},

		/**
		 * Формирует настройки реестра изменений
		 * Настройки колонок реестра
		 */
		getGridConfig: function () {
			var listedConfig = {
				captionsConfig: [
					{
						cols: 4,
						name: "Фиксировать?",
					},
					{
						cols: 3,
						name: "Статус",
					},
					{
						cols: 17,
						name: "Название файла",
					},
				],

				columnsConfig: [],
			};

			var isNeedToAddColumn = {
				cols: 4,
				key: [
					{
						type: "text",
					},
				],
			};
			var statusColumn = {
				cols: 3,
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
				cols: 17,
				key: [
					{
						name: {
							bindTo: "Name",
						},
						type: "text",
					},
				],
			};

			listedConfig.columnsConfig.push(isNeedToAddColumn);
			listedConfig.columnsConfig.push(statusColumn);
			listedConfig.columnsConfig.push(nameColumn);

			var gridConfig = {
				type: "listed",
				id: "kn-git-gui-client",
				listedConfig: listedConfig,
				multiSelect: true,
			};

			return gridConfig;
		},

		splitStrinngByStatusAndFile: function (statusLine) {
			let position = 2;
			return {
				Status: statusLine.substr(0, position),
				Name: statusLine.substr(position + 1),
			};
		},
	});

	return BPMSoft.KnGitGuiMixin;
});
