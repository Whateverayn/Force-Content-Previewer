const listElement = document.getElementById('permitted-list');
const newOriginInput = document.getElementById('new-origin');
const addButton = document.getElementById('add');
const statusElement = document.getElementById('status');

// ルールIDを管理するためのストレージキー
const RULE_ID_PREFIX = 'rule_id_for_';

// --- デバッグ用 ---
console.log('options.js が読み込まれました。');

// 現在許可されているドメインを表示する関数
async function updateUI() {
    listElement.innerHTML = '';
    const permissions = await browser.permissions.getAll();
    for (const origin of permissions.origins) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = origin;
        const removeButton = document.createElement('button');
        removeButton.textContent = '削除';

        // 削除ボタンのクリック処理
        removeButton.onclick = async () => {
            const removed = await browser.permissions.remove({ origins: [origin] });
            if (removed) {
                // declarativeNetRequest のルールを削除
                const storageKey = RULE_ID_PREFIX + origin;
                const data = await browser.storage.local.get(storageKey);
                if (data[storageKey]) {
                    await browser.declarativeNetRequest.updateDynamicRules({
                        removeRuleIds: [data[storageKey]]
                    });
                    await browser.storage.local.remove(storageKey);
                }
                updateUI();
            }
        };

        li.appendChild(span);
        li.appendChild(removeButton);
        listElement.appendChild(li);
    }
}

// 新しいドメインの権限を要求する関数
addButton.addEventListener('click', async () => {
    const newOrigin = newOriginInput.value.trim();
    if (!newOrigin) return;

    try {
        const granted = await browser.permissions.request({ origins: [newOrigin] });

        if (granted) {
            // ★ declarativeNetRequest のルールを追加 ★
            const newRuleId = Math.floor(Math.random() * 100000); // シンプルなID生成
            const domain = newOrigin.split('://')[1].split('/')[0].replace('*.', '');
            
            await browser.declarativeNetRequest.updateDynamicRules({
                addRules: [{
                    id: newRuleId,
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
                }]
            });
            
            // ★ 作成したルールIDを保存 ★
            await browser.storage.local.set({ [RULE_ID_PREFIX + newOrigin]: newRuleId });

            statusElement.textContent = `「${newOrigin}」への権限が許可されました。`;
            newOriginInput.value = '';
            updateUI();
        } else {
            statusElement.textContent = `「${newOrigin}」への権限が拒否されました。`;
        }
    } catch (error) {
        console.error(error);
        statusElement.textContent = `エラー: 書式が正しくありません。例: *://*.example.com/*`;
    }

    setTimeout(() => { statusElement.textContent = ''; }, 60000);
});

document.addEventListener('DOMContentLoaded', updateUI);
