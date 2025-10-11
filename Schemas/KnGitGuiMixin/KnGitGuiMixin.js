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
					} else {
						this.messageBoxInstance.gridData = data;
					}

					this.messageBoxInstance.on(
						"commitPrepared",
						this.applyCommit,
						this,
					);
					if (this.messageBoxInstance.visible) {
						this.messageBoxInstance.initgrid();
					} else {
						this.messageBoxInstance.show();
					}
				}
			};

			this.prepareCollection(callback);
		},

		applyCommit: function (commit) {
			console.log(commit);
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

		prepareGridData: function (gitStatusInfo) {
			let data = gitStatusInfo
				.split("\r\n")
				.map((x) => x.trim())
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
					if (response && response.GetRepoStatusResult) {
						let gridContent = this.prepareGridData(
							response.GetRepoStatusResult,
						);
						Ext.callback(callback, this, [gridContent]);
					}
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
			let position = statusLine.indexOf(" ");
			return {
				Status: statusLine.substr(0, position),
				Name: statusLine.substr(position + 1),
			};
		},
	});

	return BPMSoft.KnGitGuiMixin;
});
