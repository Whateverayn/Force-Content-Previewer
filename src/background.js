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

// アドオン起動時に状態を初期化・バッジを更新する関数
async function initializeState() {
    const data = await browser.storage.local.get(STATE_KEY);
    // 保存された値がなければ、デフォルトで有効(true)にする
    const currentState = typeof data.enabled === 'undefined' ? true : data.enabled;
    await browser.storage.local.set({ [STATE_KEY]: currentState });
    updateBadge(currentState);
}

// バッジの表示を更新する関数
function updateBadge(isEnabled) {
    if (isEnabled) {
        // 有効な場合はバッジを消す
        browser.action.setBadgeText({ text: '' });
    } else {
        // 無効な場合は "OFF" と表示
        browser.action.setBadgeText({ text: 'OFF' });
        browser.action.setBadgeBackgroundColor({ color: '#F33' });
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
    updateBadge(newState);
});

// 起動時に初期化処理を実行
initializeState();
