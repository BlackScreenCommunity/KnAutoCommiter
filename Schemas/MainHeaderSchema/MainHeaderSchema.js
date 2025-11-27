define("MainHeaderSchema", ["RightUtilities", "KnGitGuiMixin"], function (
	RightUtilities,
) {
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
				parentName: "InnerRightButtonsContainer",
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
