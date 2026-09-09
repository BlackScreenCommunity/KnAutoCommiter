## Why

При пустой или невалидной (не git-репозиторий) настройке `KnAutocommiterRepoPath` нажатие кнопки открытия Git GUI не открывает окно и не показывает пользователю никакой ошибки: `prepareCollection` в `KnGitGuiMixin.js` пропускает колбэк, если в ответе сервиса нет `Log`, а при ошибке сервер возвращает только `Status`. Пользователь не понимает, что нужно скорректировать настройку.

## What Changes

- В `prepareCollection` (`KnGitGuiMixin.js`) добавляется обработка ответа `GetRepoStatusWithSchemas` без `Log`: вызывается `BPMSoft.showErrorMessage(...)` с единым универсальным текстом-подсказкой проверить настройку пути до репозитория.
- Текст сообщения фиксируется как строковый литерал в JS (без вынесения в resource-ресурсы), по аналогии с существующими сообщениями `showErrorMessage`/`showInformation` в этом же файле.
- Сообщение не различает причину ошибки (пустой путь, несуществующий каталог, каталог не является репозиторием) — во всех случаях показывается одно и то же сообщение.

## Capabilities

### New Capabilities
- `git-gui-open-error`: поведение при ошибке получения статуса репозитория во время открытия диалога Git GUI.

### Modified Capabilities
(нет)

## Impact

- `Schemas\KnGitGuiMixin\KnGitGuiMixin.js` (`prepareCollection`).
- Поведение открытия диалога Git GUI кнопкой в `MainHeaderSchema`.
