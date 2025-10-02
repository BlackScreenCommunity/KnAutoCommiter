define("KnGitGuiMixin", ["KnGitGuiMessageBox"], function () {
  Ext.define("BPMSoft.configuration.mixins.KnGitGuiMixin", {
    alternateClassName: "BPMSoft.KnGitGuiMixin",

    collection: null,

    showModalBox: function (next, data) {
      data = this.prepareCollection();

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
          gridConfig: gridConfig,
        });

        messageBox.show();

        //this.sandbox.registerMessages({"HistoryStateChanged": { "direction": "subscribe", "mode": "broadcast" }})
        //this.sandbox.subscribe("HistoryStateChanged", messageBox.onDestroy.bind(messageBox), this);
      }
    },

    prepareCollection: function () {
      var changesData = [];

      changesData.push({
        Status: "Изменен",
        Name: "MainHeaderSchema.js",
      });
      changesData.push({
        Status: "Изменен",
        Name: "KnGitCliMixin.js",
      });
      changesData.push({
        Status: "Добавлен",
        Name: "AccountPageV2.js",
      });

      var results = Ext.create("BPMSoft.BaseViewModelCollection");

      changesData.forEach(function (changeItem) {
        var diffItem = Ext.create("BPMSoft.BaseGridRowViewModel", {
          columns: {
            Name: {
              name: "Status",
              dataValueType: BPMSoft.DataValueType.TEXT,
            },
            NewValue: {
              name: "Name",
              dataValueType: BPMSoft.DataValueType.TEXT,
            },
          },
        });
        diffItem.set("Status", changeItem.Status);
        diffItem.set("Name", changeItem.Name);

        results.add(BPMSoft.generateGUID(), diffItem);
      }, this);

      return results;
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
        cols: 5,
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
        cols: 8,
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
  });

  return BPMSoft.KnGitGuiMixin;
});
