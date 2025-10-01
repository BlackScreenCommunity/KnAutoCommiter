 define("KnGitGuiMessageBox", ["KnGitGuiMessageBoxResources"],
	function (Resources) {

		Ext.define("BPMSoft.controls.KnGitGuiMessageBox", {
			extend: "BPMSoft.controls.Container",
			alternateClassName: "BPMSoft.KnGitGuiMessageBox",

			/**
			 * Заголовок модального окна
			 */
			caption: "",

			/**
			 * Сообщение пользователю
			 */
			message: "",

			/**
			 * Признак видимости модального окна
			 */
			visible: false,

			/**
			 * Родительский контейнер
			 */
			renderTo: null,

			/**
			 * Реестр изменений
			 */
			grid: null,

			/**
			 * Данные реестра
			 */
			gridData: null,

			/**
			 * Настройки реестра
			 */
			gridConfig: null,

			/**
			 * Текстовое поле "Сообщение коммита"
			 */
			commitMessageBox: null,

			/**
			 * Подпись текстового поле "Сообщение коммита"
			 */
			commitMessageBoxLabel: null,

			/**
			 * Функция - обработчик нажатия на кнопку модального окна
			 */
			handler: null,

			/**
			 * Контекст функции обработчика нажатия
			 */
			handlerScope: null,

			/**
			 * Конструктор
			*/
			constructor: function () {
				this.callParent(arguments);

				this.caption = "GIT GUI";
				this.selectors = this.getSelectors();

				this.message = "Зафиксируйте изменения";
			},

			/**
			 * Инициализирует элементы на диалоговом окне
			 * Связывает кнопки с обработчиками нажатий на них
			 */
			initItems: function () {
				this.items = this.getButtons();
				this.callParent(arguments);
				this.attachButtonsHandlers();
			},

			/**
			 * Перерисовыает диалоговое окно
			 */
			reRender: function () {
				this.renderTo = Ext.getBody();
				this.removeCoverEl();
				this.callParent(arguments);
			},

			/**
			 * Выполнение действий после первоначальной отрисовки диалогового окна
			 */
			onAfterRender: function () {
				this.callParent(arguments);
				this.initgrid();
				this.initcommitMessageBox();
				this.adjustDialog();
			},

			/**
			 * Выполнение действий после перерисовки диалогового окна
			 */
			onAfterReRender: function () {
				this.callParent(arguments);
				this.initgrid();
				this.initcommitMessageBox();
				this.adjustDialog();
			},

			/**
			 * Возвращает html шаблон диалогового окна
			 */
			getTpl: function () {
				return [
					"<div id=\"{id}-cover\" class=\"{coverClass}\"></div>",
					"<div id=\"{id}-wrap\" class=\"{boxClass}\">",
					"<div id=\"{id}-caption\" class=\"{captionClass}\">{caption}</div>",
					"<div id=\"{id}-message\" class=\"{messageClass} {messageColorClass}\">{message}</div>",
					"<div id=\"{id}-grid\" class=\"{gridClass}\"></div>",
					"<div id=\"kn-dialog-btns\" class=\"{buttonsClass}\">",
					"<div id=\"{id}-commit-message-text-box\" class=\"{commitMessageTextBox}\"></div>",
					"<tpl for=\"items\">",
					"<@item>",
					"</tpl>",
					"</div>",
					"</div>"
				];
			},

			/**
			 * Возвращает список селекторов  диалогового окна
			 */
			getSelectors: function () {
				return {
					wrapEl: "#" + this.id + "-wrap",
					captionEl: "#" + this.id + "-caption"
				};
			},

			/**
			 * Возвращает объект CSS классов, для подстановки их в html шаблон
			 */
			getCssClasses: function () {
				var classes = {
					coverClass: ["kn-dialog-cover"],
					boxClass: ["kn-dialog-box", "kn-dialog-center-left-position"],
					captionClass: ["kn-dialog-caption"],
					gridClass: ["kn-dialog-grid"],
					messageClass: ["kn-dialog-message"],
					messageColorClass: [],
					buttonsClass: ["kn-dialog-buttons"],
					commitMessageBoxClass: ["kn-commit-message-text-box"]
				};
				return classes;
			},

			/**
			 * Размещает диалоговое окно по центру экрана
			 */
			adjustDialog: function () {
				var wrapEl = this.wrapEl;
				var height = wrapEl.getHeight();
				wrapEl.setHeight(height);
				wrapEl.removeCls("kn-dialog-center-left-position");
				wrapEl.addCls("kn-dialog-center-position");
			},

			/**
			 * Формирует html шаблон
			 */
			getTplData: function () {
				var tplData = this.callParent(arguments);
				tplData.caption = this.caption;
				tplData.message = this.message;
				Ext.apply(tplData, this.getCssClasses());
				return tplData;
			},

			/**
			 * Инициирует коллекцию кнопок, для расположения их на диалоговом окне
			 */
			getButtons: function () {
				var buttonsArray = [];

				var commitButtonConfig = {
					id: "GitGuiMessageBoxCommitButton",
					className: "BPMSoft.Button",
					caption: Resources.localizableStrings.CommitButtonCaption,
					markerValue: Resources.localizableStrings.CommitButtonCaption,
					returnCode: "commit",
					style: "transparent",
					imageConfig: this.getButtonImageConfig("CommitButtonIcon"),
				};
				buttonsArray.push(commitButtonConfig);

				var rejectButtonConfig = {
					id: "GitGuiMessageBoxRejectButton",
					className: "BPMSoft.Button",
					caption: Resources.localizableStrings.RejectButtonCaption,
					markerValue: Resources.localizableStrings.RejectButtonCaption,
					returnCode: "reject",
					visible: true,
					style: "transparent",
					imageConfig: this.getButtonImageConfig("CommitButtonIcon"),
					handler: this.onRejectButtonClick.bind(this)
				};
				buttonsArray.push(rejectButtonConfig);

				
				var cancelRejectingButton = {
					id: "GitGuiMessageBoxeCancelRejectingButton",
					className: "BPMSoft.Button",
					caption: Resources.localizableStrings.CancelButtonCaption,
					markerValue: Resources.localizableStrings.CancelButtonCaption,
					returnCode: "cancelRejecting",
					visible: true,
					style: "default",
					handler: this.onCancelRejectingButtonClick.bind(this)
				};
				buttonsArray.push(cancelRejectingButton);

				var closeButton = {
					id: "CloseMessageBoxButton",
					className: "BPMSoft.Button",
					caption: Resources.localizableStrings.CloseButtonCaption,
					markerValue: Resources.localizableStrings.CloseButtonCaption,
					returnCode: "close",
					visible: true,
					handler: this.onCloseMessageBoxButtonClick.bind(this)
				};
				buttonsArray.push(closeButton);

				return buttonsArray;
			},
			
			/**
			 * Обработчик нажатия на кнопку "Закрыть"
			 */
			onCloseMessageBoxButtonClick: function(){
				this.onDestroy();
			},

			/**
			 * Добавляет обработчик нажатия на каждую из кнопок диалоговога окна
			 */
			attachButtonsHandlers: function () {
				var buttons = this.items.items;
				for (var i = 0; i < buttons.length; i++) {
					if (!buttons[i].handler) {
						buttons[i].on("click", this.onButtonClick(this));
					}
				}
			},

			/**
			 * Устанавливает первоначальные значения видимости для элементов диалогового окна
			 */
			setElementsVisibility: function () {
				var confirmRejectingButton = this.getItem("GitGuiMessageBoxConfirmRejectingButton");
				var cancelRejectingButton = this.getItem("GitGuiMessageBoxeCancelRejectingButton");
			},

			/**
			 * Обрабатывает нажатие на кнопку
			 */
			onButtonClick: function (dialog) {
				return function () {
					var returnCode = this.returnCode;
					dialog.setVisible(false);
				};
			},

			/**
			 * Обработчик нажатия на кнопку "Отклонить"
			 */
			onRejectButtonClick: function () {},

			/**
			 * Обработчик нажатия на кнопку "Отмена"
			 */
			onCancelRejectingButtonClick: function () {},

			/**
			 * Обработчик нажатия на кнопку "Сохранить"
			 */
			onConfirmRejectingButton: function() {},

			/**
			 * Возвращает компонент по его коду
			 */
			getItem: function (itemCode) {
				var buttons = this.items.items.filter((button) => (button.id === itemCode));
				if (buttons.length > 0) {
					return buttons[0];
				}
			},


			/**
			 * Инициализирует компонент реестра изменений
			 */
			initgrid: function () {
				var model = Ext.create("BPMSoft.BaseViewModel");
				model.set("Collection", Ext.create("BPMSoft.BaseViewModelCollection"));

				var gridContainer = Ext.get(this.id + "-grid");
				var gridConfig = Ext.apply(this.gridConfig, {
					collection: {
						bindTo: "Collection"
					},
					renderTo: gridContainer
				});

				this.grid = Ext.create("BPMSoft.Grid",
					gridConfig);
				this.grid.bind(model);
				var collection = model.get("Collection");
				collection.loadAll(this.gridData);
			},

			/**
			 * Инициализируе компонент поля для ввода причины отказа
			 */
			initcommitMessageBox: function () {
				var textBoxContainer = Ext.get(this.id + "-reason-text-box");

				this.commitMessageBoxLabel = Ext.create("BPMSoft.Label", {
					caption: Resources.localizableStrings.RejectingReasonCaption,
					renderTo: textBoxContainer,
					classes: {
						labelClass: ["kn-dialog-message", "an-display-contents"]
					}
				});

				this.commitMessageBox = Ext.create("BPMSoft.TextEdit", {
					renderTo: textBoxContainer
				});
			},

			/**
			 * Обработчик уничтожения диалогового окна
			 */
			onDestroy: function () {
				this.destroygrid();
				this.removeCoverEl();
				this.callParent(arguments);
			},

			/**
			 * Уничтожает реестр на диалоговом окне
			 */
			destroygrid: function () {
				this.grid.destroy();
				this.grid = null;
			},

			/**
			 * Отображает диалогового окно
			 */
			show: function () {
				this.setVisible(true);
				this.setElementsVisibility();
			},

			/**
			 * Скрывает диалогового окно
			 */
			hide: function () {
				this.setVisible(false);
			},

			/**
			 * Изменяет видимость диалогового окна
			 */
			setVisible: function (visible) {
				if (this.visible === visible) {
					return;
				}
				if (!this.renderTo) {
					this.renderTo = Ext.getBody();
				}
				this.callParent(arguments);
				if (visible === true) {
					this.showCoverEl();
				}
				if (visible === false) {
					this.hideCoverEl();
				}
			},

			/**
			 * Отображает подложку диалогового окна для
			 * воспрепятствия взаимодействия с элементами страницы под окном
			 */
			showCoverEl: function () {
				this.coverEl = Ext.get(this.id + "-cover");
				this.coverEl.on("wheel", function (event) {
					event.preventDefault();
				});
				this.coverEl.on("click", function (event) {
					event.stopEvent();
				});
				this.coverEl.dom.style.opacity = "0.3";
			},

			/**
			 * Скрывает подложку диалогового окна
			 */
			hideCoverEl: function () {
				this.coverEl.dom.style.display = "none";
			},

			/**
			 * Уничтожает подложку диалогового окна
			 */
			removeCoverEl: function () {
				if (this.coverEl) {
					this.coverEl.destroy();
					this.coverEl = null;
				}
			},

			/**
			 * Формирует объект-конфиг
			 * для отображения кнопки с изображением
			 */
			getButtonImageConfig: function (imageName) {
				var image = Resources.localizableImages[imageName];
				return {
					"source": BPMSoft.ImageSources.URL,
					"url": BPMSoft.ImageUrlBuilder.getUrl(image)
				};
			},

		});

		return BPMSoft.KnGitGuiMessageBox;
	});
