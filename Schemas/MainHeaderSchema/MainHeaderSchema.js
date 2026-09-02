define("MainHeaderSchema", ["RightUtilities", "KnGitGuiMixin"], 
function (RightUtilities,) {
	return {
		attributes: {
			CanUseGitClient: {
				dataValueType: BPMSoft.DataValueType.BOOLEAN,
				value: false,
			},
		},
		mixins: {
			KnGitGuiMixin: "BPMSoft.KnGitGuiMixin",
		},

		methods: {
			init: function () {
				this.callParent(arguments);
				this.getCanUseGitClient();
				this.getCommiterVersion();
			},

			getCanUseGitClient: function () {
				RightUtilities.checkCanExecuteOperations(
					["KnCanUseGitClient"],
					function (result) {
						this.set("CanUseGitClient", result.KnCanUseGitClient);
					},
					this,
				);
			},

			/**
			 * Выводит в консоль версию коммитера
			 */
			getCommiterVersion: function (commit) {
				var bpmsoftUrl = window.location.origin;
				BPMSoft.AjaxProvider.request({
					url: bpmsoftUrl + "/rest/KnCommiterService/Version",
					headers: {
						"Accept": "application/json",
						"Content-Type": "application/json"
					},
					method: "GET",
					callback: function (request, status, result) {
						let response = JSON.parse(result?.responseText);
						console.log("KnCommiter version: " + response?.VersionResult);
					},
					scope: this
				});
			},

			onGitGuiButtonClicked: function () {
				this.mixins.KnGitGuiMixin.showModalBox();
			},
		},
		diff: [
			{
				operation: "remove",
				name: "ContextHelpContainer",
			},
			{
				operation: "insert",
				name: "GitGuiContainer",
				parentName: "RightHeaderContainer",
				propertyName: "items",
				values: {
					id: "header-git-gui-container",
					itemType: BPMSoft.ViewItemType.CONTAINER,
					wrapClass: ["context-git-gui-class"],
					items: [],
					// "visible": {"bindTo": "IsSystemDesignerVisible"}
				},
			},
			{
				operation: "insert",
				name: "GitGuiButton",
				parentName: "GitGuiContainer",
				propertyName: "items",
				values: {
					id: "view-button-system-designer",
					itemType: BPMSoft.ViewItemType.BUTTON,
					selectors: {
						wrapEl: "git-client-open-button",
					},
					classes: {
						wrapperClass: ["system-designer-button"],
						pressedClass: ["pressed-button-view"],
						imageClass: [
							"system-designer-image",
							"view-images-class",
						],
					},
					tips: [],
					click: {
						bindTo: "onGitGuiButtonClicked",
					},
					visible: {
						bindTo: "CanUseGitClient",
					},
					imageConfig: {
						bindTo: "Resources.Images.GitClientIcon",
					},
					style: this.BPMSoft.controls.ButtonEnums.style.TRANSPARENT,
					iconAlign: this.BPMSoft.controls.ButtonEnums.iconAlign.LEFT,
					markerValue: "git-client-open-button",
					tag: "git-client-open-button",
				},
			},
		],
	};
});
