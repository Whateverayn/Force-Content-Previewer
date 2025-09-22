// function rewriteHeader(details) {
//     for (let header of details.responseHeaders) {
//         const headerName = header.name.toLowerCase();
//         const headerValue = header.value.toLowerCase();

//         if (headerName === 'content-disposition' && headerValue.startsWith('attachment')) {
//             header.value = 'inline' + header.value.substring('attachment'.length);
//             break;
//         }
//     }
//     return { responseHeaders: details.responseHeaders };
// }

// browser.webRequest.onHeadersReceived.addListener(
//     rewriteHeader,
//     { urls: ["<all_urls>"] },
//     ["blocking", "responseHeaders"]
// );

// webリクエストが完了したときに発火するリスナー
browser.webRequest.onCompleted.addListener(
    async (details) => {
        // 0. アドオンが有効かチェック
        const state = await browser.storage.local.get('enabled');
        // enabledがfalseの場合(オフの場合)、何もしない
        if (state.enabled === false) {
            return;
        }

        // 1. 最低限のチェック：メインフレームで、URLがHTTP/HTTPSであること
        if (details.type !== "main_frame" || !details.url.startsWith('http')) {
            return;
        }

        // 2. 権限があるかチェック
        const hasPermission = await browser.permissions.contains({
            origins: [details.url]
        });

        // 権限がなければ何もしない
        if (!hasPermission) {
            return;
        }

        // 3. スクリプト注入を試み、失敗してもエラーを出さずに握りつぶす
        try {
            await browser.scripting.executeScript({
                target: { tabId: details.tabId },
                files: ["content_script.js"]
            });
            // 成功した場合は特に何も出力しない

        } catch (error) {
            // 失敗した場合、これは「保護されたページ」であると判断する。
            // 通常のログとして出力し、処理を正常に終了させる。
            console.log(
                `This is a protected page, skipping script injection: ${details.url}`
            );
        }
    },
    {
        urls: ["<all_urls>"]
    }
);

// 状態のキー
const STATE_KEY = 'enabled';
const RULE_ID_PREFIX = 'rule_id_for_'; // options.jsと共有

// アドオン起動時に状態を初期化・バッジを更新する関数
async function initializeState() {
    const data = await browser.storage.local.get(STATE_KEY);
    // 保存された値がなければ、デフォルトで有効(true)にする
    const currentState = typeof data.enabled === 'undefined' ? true : data.enabled;
    await browser.storage.local.set({ [STATE_KEY]: currentState });
    // updateBadge(currentState);
    updateIcon();

    // 起動時にONだったら、ルールを再登録する
    if (currentState) {
        await registerAllRules();
    }
}

// バッジの表示を更新する関数
function updateBadge(isEnabled) {
    // if (isEnabled) {
    //     // 有効な場合はバッジを消す
    //     browser.action.setBadgeText({ text: '' });
    // } else {
    //     // 無効な場合は "OFF" と表示
    //     browser.action.setBadgeText({ text: 'OFF' });
    //     browser.action.setBadgeBackgroundColor({ color: '#F33' });
    // }
    console.warn('updateIcon() を呼び出します. updateBadge() は非推奨です.');
    updateIcon();
}

// アイコンの表示を、アドオンの状態と現在のタブに応じて更新する関数
async function updateIcon() {
    const stateData = await browser.storage.local.get('enabled');
    const isEnabled = stateData.enabled ?? true;

    // 1. 最優先：アドオンがオフの場合
    if (!isEnabled) {
        browser.action.setBadgeText({ text: 'OFF' });
        browser.action.setBadgeBackgroundColor({ color: '#6e6e6e' });
        return; // ここで処理を終了
    }

    // 2. アドオンがオンの場合：アクティブなタブをチェック
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        browser.action.setBadgeText({ text: '' }); // タブがなければバッジを消す
        return;
    }

    const currentTab = tabs[0];
    // URLがない、またはhttp/httpsでない場合は権限チェックできないので終了
    if (!currentTab.url || !currentTab.url.startsWith('http')) {
        browser.action.setBadgeText({ text: '' });
        return;
    }

    const hasPermission = await browser.permissions.contains({
        origins: [currentTab.url]
    });

    if (hasPermission) {
        // 権限があれば緑の点を表示
        browser.action.setBadgeText({ text: ' ' }); // 半角スペース
        browser.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // 緑色
    } else {
        // 権限がなければバッジを消す
        browser.action.setBadgeText({ text: '' });
    }
}

// 現在許可されている全てのドメインルールを再登録する関数
async function registerAllRules() {
    // 既存のルールを一度全て削除
    const existingRules = await browser.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);
    if (ruleIdsToRemove.length > 0) {
        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove
        });
    }

    // ストレージから、options.jsで保存したルール定義を取得
    const items = await browser.storage.local.get(null); // 全てのデータを取得
    const rulesToAdd = [];

    for (const key in items) {
        if (key.startsWith(RULE_ID_PREFIX)) {
            const origin = key.substring(RULE_ID_PREFIX.length);
            const domain = origin.split('://')[1].split('/')[0].replace('*.', '');

            rulesToAdd.push({
                id: items[key], // 保存されているIDを使用
                priority: 1,
                action: {
                    type: 'modifyHeaders',
                    responseHeaders: [{
                        header: 'Content-Disposition',
                        operation: 'set',
                        value: 'inline'
                    }]
                },
                condition: {
                    requestDomains: [domain],
                    resourceTypes: ["main_frame", "sub_frame"]
                }
            });
        }
    }

    if (rulesToAdd.length > 0) {
        await browser.declarativeNetRequest.updateDynamicRules({
            addRules: rulesToAdd
        });
        console.log(`${rulesToAdd.length}件のルールを再登録しました。`);
    }
}

// 全ての動的ルールを削除する関数
async function removeAllRules() {
    const existingRules = await browser.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);
    if (ruleIdsToRemove.length > 0) {
        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove
        });
        console.log(`${ruleIdsToRemove.length}件のルールを削除しました。`);
    }
}

// アイコンがクリックされたときの処理
browser.action.onClicked.addListener(async (tab) => {
    // 現在の状態を取得
    const data = await browser.storage.local.get(STATE_KEY);
    // 状態を反転させる
    const newState = !data.enabled;
    // 新しい状態を保存
    await browser.storage.local.set({ [STATE_KEY]: newState });
    // バッジ表示を更新
    // updateBadge(newState);
    updateIcon();

    // 状態に応じてルールの有効/無効を切り替える
    if (newState) {
        // --- アドオンがONになった時の処理 ---
        await registerAllRules(); // ONになったらルールを再登録

        // 開いているタブにコンテンツスクリプトを注入する
        try {
            const tabs = await browser.tabs.query({
                url: ["http://*/*", "https://*/*"] // httpとhttpsのURLを持つタブのみ対象
            });

            for (const tab of tabs) {
                // タブごとに権限を確認
                const hasPermission = await browser.permissions.contains({
                    origins: [tab.url]
                });

                if (hasPermission) {
                    // 権限があればスクリプトを注入
                    try {
                        await browser.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ["content_script.js"]
                        });
                    } catch (e) {
                        console.log(
                            `スクリプトを注入できませんでした。保護されたページかもしれません: ${tab.url}`,
                            e
                        );
                    }
                }
            }
        } catch (e) {
            console.error("タブへのスクリプト注入中にエラーが発生しました:", e);
        }
    } else {
        // --- アドオンがOFFになった時の処理 ---
        await removeAllRules(); // OFFになったらルールを全削除
    }
});

// 起動時に初期化処理を実行
initializeState();

// タブの切り替え、更新、ウィンドウの変更時にアイコン表示を更新する
browser.tabs.onActivated.addListener(updateIcon);
browser.tabs.onUpdated.addListener(updateIcon);
browser.windows.onFocusChanged.addListener(updateIcon);
