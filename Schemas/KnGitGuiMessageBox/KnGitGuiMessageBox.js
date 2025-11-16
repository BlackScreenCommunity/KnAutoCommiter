define("KnGitGuiMessageBox", [
	"KnGitGuiMessageBoxResources",
	"css!KnGitGuiMessageBox",
], function (Resources) {
	Ext.define("BPMSoft.controls.KnGitGuiMessageBox", {
		extend: "BPMSoft.controls.Container",
		alternateClassName: "BPMSoft.KnGitGuiMessageBox",

		/**
		 * Журнал изменений git log
		 */
		log: [],

		/**
		 * Количество неотправленных коммитов
		 */
		countOfCommitsToPush: 0,

		/**
		 * Шаблон для отображения уведомления
		 * о количестве неотправленных коммитов
		 **/
		pushButtonCounterCaptionTemplate:
			"Количество коммитов для отправки: {0}",

		/**
		 * Элемент со счетчиком коммитов
		 */
		pushButtonCounterElement: null,

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

			this.selectors = this.getSelectors();

			this.addEvents("commitPrepared");
			this.addEvents("push");
			this.addEvents("downloadToFS");
		},

		/**
		 * Инициализирует элементы на диалоговом окне
		 * Связывает кнопки с обработчиками нажатий на них
		 */
		initItems: function () {
			this.items = this.getButtons();
			this.callParent(arguments);
		},

		/**
		 * Перерисовыает диалоговое окно
		 */
		reRender: function () {
			this.renderTo = Ext.getBody();
			this.removeCoverEl();
			this.getTplData();
			this.callParent(arguments);
		},

		/**
		 * Выполнение действий после первоначальной отрисовки диалогового окна
		 */
		onAfterRender: function () {
			this.callParent(arguments);
			this.initgrid();
			this.initcommitMessageBox();
			this.initGitLogLabels();
			this.adjustDialog();
			this.renderCommitButton();
			this.renderPushButton();
			this.renderDownloadChangesToFSButton();
		},

		/**
		 * Выполнение действий после перерисовки диалогового окна
		 */
		onAfterReRender: function () {
			this.callParent(arguments);
			this.initgrid();
			this.initcommitMessageBox();
			this.initGitLogLabels();
			this.adjustDialog();
			this.renderCommitButton();
			this.renderPushButton();
			this.renderDownloadChangesToFSButton();
		},

		/**
		 * Добавить кнопку создания коммита
		 */
		renderCommitButton: function () {
			let commitButtonContainer = Ext.get("kn-dialog-commit-button");

			Ext.create("BPMSoft.Button", {
				id: "GitGuiMessageBoxCommitButton",
				className: "BPMSoft.Button",
				caption: "Сделать коммит",
				markerValue: "commit",
				returnCode: "commit",
				style: "transparent",
				imageConfig: this.getButtonImageConfig("CommitButtonIcon"),
				handler: this.onCommitMessageBoxButtonClick.bind(this),
				renderTo: commitButtonContainer,
			});
		},

		/**
		 * Обновить счетчик неотправленных коммитов
		 */
		refreshPushButtonCounter: function () {
			debugger;
			Ext.getCmp("GitGuiMessageBoxPushButtonLabel").setCaption(
				Ext.String.format(
					this.pushButtonCounterCaptionTemplate,
					this.countOfCommitsToPush,
				),
			);
		},

		/**
		 * Добавить кнопку отправки изменений (push)
		 */
		renderPushButton: function () {
			let pushButtonContainer = Ext.get("kn-dialog-push-button");
			let pushButtonCounterContainer = Ext.get(
				"kn-dialog-push-button-counter",
			);

			Ext.create("BPMSoft.Button", {
				id: "GitGuiMessageBoxPushButton",
				className: "BPMSoft.Button",
				caption: "Отправить изменения на сервер",
				markerValue: "push",
				returnCode: "push",
				style: "transparent",
				imageConfig: this.getButtonImageConfig("PushButtonIcon"),
				handler: this.onMessageBoxPushButtonClick.bind(this),
				renderTo: pushButtonContainer,
			});

			this.pushButtonCounterElement = Ext.create("BPMSoft.TipLabel", {
				id: "GitGuiMessageBoxPushButtonLabel",
				caption: Ext.String.format(
					this.pushButtonCounterCaptionTemplate,
					this.countOfCommitsToPush,
				),
				renderTo: pushButtonCounterContainer,
			});
		},

		/**
		 * Добавить кнопку обновления
		 * списка незафиксированных изменений
		 * Выгрузка данных в файловую систему
		 */
		renderDownloadChangesToFSButton: function () {
			let downloadChangesToFSContainer = Ext.get(
				"KnGitGuiMessageBox-reload-button",
			);

			Ext.create("BPMSoft.Button", {
				id: "GitGuiDownloadChangesToFSButton",
				className: "BPMSoft.Button",
				markerValue: "downloadToFS",
				returnCode: "downloadToFS",
				style: "transparent",
				imageConfig: this.getButtonImageConfig(
					"DownloadChangesToFSButton",
				),
				handler: this.onDownloadChangesToFSButtonClick.bind(this),
				renderTo: downloadChangesToFSContainer,
			});
		},

		/**
		 * Возвращает html шаблон диалогового окна
		 */
		getTpl: function () {
			return [
				'<div id="{id}-cover" class="{coverClass}"></div>',
				'<div id="{id}-wrap" class="{boxClass}">',
				'<div id="{id}-caption" class="{captionClass}">Фиксация изменений</div>',
				'<div id="{id}-log-container-header" class="{messageClass}">Журнал коммитов</div>',
				'<div id="{id}-log-container" class="{log-container}" data-tour="last"></div>',
				'<div class="header-with-button">',
				'<div id="{id}-message" class="{messageClass}">Незафиксированные изменения</div>',
				'<div id="{id}-reload-button" class="{messageClass}" data-tour="download-changes-button"></div>',
				"</div>",
				'<div id="{id}-grid" class="{gridClass}" data-tour="unstaged"></div>',
				'<div id="{id}-commit-message-text-box" class="{commitMessageTextBox}" data-tour="message"></div>',
				'<div id="kn-dialog-btns" class="{buttonsClass}" data-tour="buttons">',
				'<div id="kn-dialog-commit-button" data-tour="commit-button"></div>',
				'<div class="push-button-container">',
				'<div id="kn-dialog-push-button" data-tour="push-button"></div>',
				'<div id="kn-dialog-push-button-counter" class="push-button-counter" data-tour="push-button-counter"></div>',
				"</dev>",
				"</dev>",
				'<tpl for="items">',
				"<@item>",
				"</tpl>",
				"</div>",
				"</div>",
			];
		},

		/**
		 * Возвращает список селекторов  диалогового окна
		 */
		getSelectors: function () {
			return {
				wrapEl: "#" + this.id + "-wrap",
				captionEl: "#" + this.id + "-caption",
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
				buttonsClass: ["kn-dialog-buttons"],
				commitMessageBoxClass: ["kn-commit-message-text-box"],
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
			Ext.apply(tplData, this.getCssClasses());
			return tplData;
		},

		/**
		 * Инициирует коллекцию кнопок, для расположения их на диалоговом окне
		 */
		getButtons: function () {
			var buttonsArray = [];

			var closeButton = {
				id: "CloseMessageBoxButton",
				className: "BPMSoft.Button",
				markerValue: "close",
				returnCode: "close",
				imageConfig: this.getButtonImageConfig("CloseButtonIcon"),
				handler: this.onCloseMessageBoxButtonClick.bind(this),
			};
			buttonsArray.push(closeButton);

			var helpButton = {
				id: "HelpButton",
				className: "BPMSoft.Button",
				markerValue: "help",
				returnCode: "help",
				imageConfig: this.getButtonImageConfig("HelpButtonIcon"),
				handler: this.onHelpButtonClick.bind(this),
			};
			buttonsArray.push(helpButton);

			return buttonsArray;
		},

		/**
		 * Обработчик нажатия на кнопку "Помощь"
		 *
		 * Запускает интерактивное обучение с подсветкой основных
		 * интрефейсов модального окна.
		 * У каждого блока обучения имеется свое описание
		 */
		onHelpButtonClick: function () {
			const modal = document.getElementById("KnGitGuiMessageBox-wrap");

			const steps = [
				{
					selector: '[data-tour="last"]',
					text: "<b>Отображает список последних зафиксированных изменений</b>. Отображается описание и дата фиксации",
					pos: "bottom",
				},
				{
					selector: '[data-tour="unstaged"]',
					text: "<b>Незафиксированные изменения</b>. Выбери файлы, в которые вносил изменения.",
					pos: "bottom",
				},
				{
					selector: '[data-tour="download-changes-button"]',
					text: "<b>Кнопка выгрузки изменений из BPMSoft</b>. Если не видишь свои изменения, связанные с созданием новых объектов (например, привязки данных или процесса), нажми эту кнопку. <br/> Процесс может занять несколько минут, поэтому он не запускается автоматически при открытии окна.",
					pos: "bottom",
				},
				{
					selector: '[data-tour="message"]',
					text: "<b>Сообщение коммита</b>. Укажи номер задачи, в рамках которой работал и опиши какие изменения вносил. Чем меньше в изменений в одном коммите - тем проще потом с ними работать. Их можно отдельно откатывать, переносить на другие стенды и релизить.",
					pos: "top",
				},
				{
					selector: '[data-tour="commit-button"]',
					text: "<b>Сделать коммит</b> — <i>Упаковывем</i> изменения и готовим их к отправке. <br/> Для того, чтобы сделать коммит обязательно нужно выбрать хотя бы один файл, и указать сообщение коммита. После нажатия на кнопку коммит будет отображен в списке Последних изменений",
					pos: "top",
				},
				{
					selector: '[data-tour="push-button"]',
					text: "<b>Отправить изменения на сервер</b> публикует изменения, после чего они будут доступны для других участников команды. Публикация гарантирует нам, что отправленные изменения не будут потеряны, если с нашим стендом что-то произойдет.",
					pos: "top",
				},
				{
					selector: '[data-tour="push-button-counter"]',
					text: "<b>Количество неотправленных комитов</b>. Если счетчик показывает 0, то все подготовленные коммиты отправлены на сервер и вся команда может забрать эти изменения. Если значение 0, то отправка не будет запущена",
					pos: "top",
				},
			];

			const layer = document.createElement("div");
			layer.className = "tour-layer";
			layer.innerHTML = `
				<div class="tour-backdrop" aria-hidden="true"></div>
				<div class="tour-spotlight" role="presentation"></div>
				<div class="tour-popover pos-bottom" role="dialog" aria-live="polite" aria-modal="false">
				  <div class="tour-content"></div>
				  <div class="tour-controls">
					<button class="secondary" data-act="prev">Назад</button>
					<button class="primary" data-act="next">Далее</button>
				  </div>
				</div>
			  `;

			modal.appendChild(layer);

			const spotlight = layer.querySelector(".tour-spotlight");
			const popover = layer.querySelector(".tour-popover");
			const content = layer.querySelector(".tour-content");
			const btnPrev = layer.querySelector('[data-act="prev"]');
			const btnNext = layer.querySelector('[data-act="next"]');

			let i = 0;

			function clampIntoModal(rect) {
				const m = modal.getBoundingClientRect();
				return {
					top: rect.top - m.top,
					left: rect.left - m.left,
					width: rect.width,
					height: rect.height,
				};
			}

			function place(step) {
				const el = modal.querySelector(step.selector);
				if (!el) {
					next();
					return;
				}

				el.scrollIntoView({ block: "nearest", behavior: "smooth" });

				const r = clampIntoModal(el.getBoundingClientRect());

				spotlight.style.top = r.top - 8 + "px";
				spotlight.style.left = r.left - 8 + "px";
				spotlight.style.width = r.width + 16 + "px";
				spotlight.style.height = r.height + 16 + "px";

				content.innerHTML = step.text;

				popover.classList.remove("pos-top", "pos-bottom");
				popover.classList.add(
					step.pos === "top" ? "pos-top" : "pos-bottom",
				);

				const gap = 10;
				const pv = popover.getBoundingClientRect();
				const top =
					step.pos === "top"
						? r.top - pv.height - 16 - gap
						: r.top + r.height + 16 + gap;
				const left = Math.max(
					8,
					Math.min(r.left, modal.clientWidth - pv.width - 8),
				);

				popover.style.top = top + "px";
				popover.style.left = left + "px";

				btnPrev.disabled = i === 0;
				btnNext.textContent =
					i === steps.length - 1 ? "Готово" : "Далее";
			}

			function next() {
				if (i < steps.length - 1) {
					i++;
					place(steps[i]);
				} else {
					end();
				}
			}
			function prev() {
				if (i > 0) {
					i--;
					place(steps[i]);
				}
			}
			function end() {
				layer.remove();
			}

			btnNext.addEventListener("click", next);
			btnPrev.addEventListener("click", prev);
			layer.addEventListener("click", (e) => {
				if (!popover.contains(e.target)) next();
			});

			place(steps[i]);
		},

		/**
		 * Обработчик нажатия на кнопку "Закрыть"
		 */
		onCloseMessageBoxButtonClick: function () {
			this.hide();
		},

		/**
		 * Обработчик нажатия на кнопку "Сделать коммит"
		 */
		onCommitMessageBoxButtonClick: function () {
			const isComminPrepared =
				this.grid?.selectedRows?.length > 0 &&
				this.commitMessageBox &&
				this.commitMessageBox.value;

			if (!isComminPrepared) {
				BPMSoft.showErrorMessage(
					"Не выбраны файлы для фиксации или не заполнено сообщение коммита",
				);
				return;
			}

			let selectedFiles = this.grid.selectedRows
				.map((x) => this.gridData.getByIndex(x))
				.map((x) => x.get("Files"))
				.flat();
			let commitMessage = this.commitMessageBox.value;

			var commit = {
				message: commitMessage,
				changes: selectedFiles,
			};

			this.fireEvent("commitPrepared", commit);
		},

		/**
		 * Обработчик нажатия на кнопку "Выгрузить изменения
		 * в файловую систему"
		 */
		onDownloadChangesToFSButtonClick: function () {
			this.fireEvent("downloadChangesToFS");
		},

		/**
		 * Обработчик нажатия на кнопку "Отправить изменения на сервер"
		 */
		onMessageBoxPushButtonClick: function () {
			if (this.countOfCommitsToPush == 0) {
				BPMSoft.showErrorMessage(
					"Нет изменений для отправки на сервер",
				);
				return;
			}

			this.fireEvent("push");
		},

		/**
		 * Обрабатывает нажатие на кнопку
		 */
		onButtonClick: function (dialog) {
			return function () {
				dialog.setVisible(false);
			};
		},

		/**
		 * Возвращает компонент по его коду
		 */
		getItem: function (itemCode) {
			var buttons = this.items.items.filter(
				(button) => button.id === itemCode,
			);
			if (buttons.length > 0) {
				return buttons[0];
			}
		},

		/**
		 * Инициализирует компонент реестра изменений
		 */
		initgrid: function () {
			var model = Ext.create("BPMSoft.BaseViewModel");
			model.set(
				"Collection",
				Ext.create("BPMSoft.BaseViewModelCollection"),
			);

			let gridElement = Ext.get("grid-kn-git-gui-client-wrap");
			if (gridElement) {
				gridElement.destroy();
			}

			var gridContainer = Ext.get(this.id + "-grid");
			var gridConfig = Ext.apply(this.gridConfig, {
				collection: {
					bindTo: "Collection",
				},
				renderTo: gridContainer,
			});

			this.grid = Ext.create("BPMSoft.Grid", gridConfig);
			this.grid.bind(model);
			var collection = model.get("Collection");
			collection.loadAll(this.gridData);
		},

		/**
		 * Инициализируе компонент поля для ввода причины отказа
		 */
		initGitLogLabels: function () {
			var textBoxContainer = Ext.get(this.id + "-log-container");

			textBoxContainer.setHTML("");

			this.log.forEach(function (gitLogItem) {
				Ext.create("BPMSoft.Label", {
					caption: gitLogItem,
					renderTo: textBoxContainer,
					classes: {
						labelClass: ["kn-log-status-item"],
					},
				});
			});
		},

		/**
		 * Инициализируе компонент поля для ввода причины отказа
		 */
		initcommitMessageBox: function () {
			var textBoxContainer = Ext.get(
				this.id + "-commit-message-text-box",
			);

			Ext.create("BPMSoft.Label", {
				caption: "Опишите изменения и укажите номер задачи",
				renderTo: textBoxContainer,
				classes: {
					labelClass: ["kn-dialog-message", "an-display-contents"],
				},
			});

			this.commitMessageBox = Ext.create("BPMSoft.MemoEdit", {
				id: "commit-message-memo-edit",
				renderTo: textBoxContainer,
			});
		},

		/**
		 * Очищает текстовое поле сообщения
		 * коммита после формирования коммита
		 */
		refreshCommitMessageBox: function () {
			commitMessageBox = Ext.getCmp("commit-message-memo-edit");

			if (commitMessageBox) {
				commitMessageBox.setValue("");
			}
		},

		/**
		 * Обработчик уничтожения диалогового окна
		 */
		onDestroy: function () {
			this.destroyGrid();
			this.removeCoverEl();
			this.callParent(arguments);
		},

		/**
		 * Уничтожает реестр на диалоговом окне
		 */
		destroyGrid: function () {
			this.grid.destroy();
			this.grid = null;
		},

		/**
		 * Отображает диалогового окно
		 */
		show: function () {
			this.setVisible(true);
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
				source: BPMSoft.ImageSources.URL,
				url: BPMSoft.ImageUrlBuilder.getUrl(image),
			};
		},
	});

	return BPMSoft.KnGitGuiMessageBox;
});
