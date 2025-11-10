define("KnGitGuiMixin", [
	"ext-base",
	"ServiceHelper",
	"KnGitGuiMessageBox",
	"BaseGridRowViewModel",
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

					var handler = function (scope) {
						scope.onDestroy();
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
						this.messageBoxInstance.refreshCommitMessageBox();
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
			var results = Ext.create("BPMSoft.BaseViewModelCollection");

			gitStatusInfo.forEach(function (changeItem) {
				var diffItem = Ext.create("BPMSoft.BaseGridRowViewModel", {
					columns: {
						SchemaName: {
							name: "SchemaName",
							dataValueType: BPMSoft.DataValueType.TEXT,
						},
						Files: {
							name: "Files",
							dataValueType: BPMSoft.DataValueType.TEXT,
						},
					},
				});
				diffItem.set(
					"SchemaName",
					Ext.String.format(
						"{0} ({1})",
						changeItem.Name,
						changeItem.Caption,
					),
				);
				diffItem.set("Files", changeItem.Files);

				results.add(BPMSoft.generateGUID(), diffItem);
			});

			return results;
		},

		prepareCollection: function (callback) {
			ServiceHelper.callService(
				"KnCommiterService",
				"GetRepoStatusWithSchemas",
				function (response) {
					if (
						response &&
						response.GetRepoStatusWithSchemasResult &&
						response.GetRepoStatusWithSchemasResult.Log
					) {
						let gridContent = this.prepareGridData(
							response.GetRepoStatusWithSchemasResult.Schemas,
						);

						let formattedLog = this.formatLog(
							response.GetRepoStatusWithSchemasResult.Log,
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
						cols: 3,
						name: "Фиксировать?",
					},
					{
						cols: 6,
						name: "Название схемы",
					},
					{
						cols: 15,
						name: "Список файлов схемы",
					},
				],

				columnsConfig: [],
			};

			var isNeedToAddColumn = {
				cols: 3,
				key: [
					{
						type: "text",
					},
				],
			};
			var schemaNameColumn = {
				cols: 6,
				key: [
					{
						name: {
							bindTo: "SchemaName",
						},
						type: "text",
					},
				],
			};
			var filesColumn = {
				cols: 15,
				key: [
					{
						name: {
							bindTo: "Files",
						},
						type: "text",
					},
				],
			};

			listedConfig.columnsConfig.push(isNeedToAddColumn);
			listedConfig.columnsConfig.push(schemaNameColumn);
			listedConfig.columnsConfig.push(filesColumn);

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
