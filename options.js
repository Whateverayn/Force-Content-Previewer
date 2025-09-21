const listElement = document.getElementById('permitted-list');
const newOriginInput = document.getElementById('new-origin');
const addButton = document.getElementById('add');
const statusElement = document.getElementById('status');

// --- デバッグ用 ---
console.log('options.js が読み込まれました。');

// 現在許可されているドメインを表示する関数
function updateUI() {
    console.log('updateUI() が呼び出されました。');
    listElement.innerHTML = '';
    browser.permissions.getAll().then(permissions => {
        console.log('現在の権限:', permissions.origins); // 現在の権限をログに出力
        for (const origin of permissions.origins) {
            // ... (この部分は変更なし)
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = origin;
            const removeButton = document.createElement('button');
            removeButton.textContent = '削除';
            removeButton.onclick = () => {
                browser.permissions.remove({ origins: [origin] }).then(removed => {
                    if (removed) updateUI();
                });
            };
            li.appendChild(span);
            li.appendChild(removeButton);
            listElement.appendChild(li);
        }
    });
}

// 新しいドメインの権限を要求する関数
addButton.addEventListener('click', () => {
    const newOrigin = newOriginInput.value.trim();
    if (!newOrigin) return;

    // try...catchブロックで同期的なエラーを捕まえる
    try {
        browser.permissions.request({ origins: [newOrigin] })
            .then(granted => {
                // この部分は非同期処理の結果を扱う
                if (granted) {
                    statusElement.textContent = `「${newOrigin}」への権限が許可されました。`;
                    newOriginInput.value = '';
                    updateUI();
                } else {
                    statusElement.textContent = `「${neworigin}」への権限が拒否されました。`;
                }
            });
    } catch (error) {
        // 同期的なエラー（書式間違いなど）はこちらでキャッチされる
        console.error(error); // 自分のデバッグ用にエラー内容はコンソールに出しておく
        statusElement.textContent = `エラー: 書式が正しくありません。例: *://*.example.com/*`;
    }

    setTimeout(() => { statusElement.textContent = ''; }, 60000);
});

document.addEventListener('DOMContentLoaded', updateUI);