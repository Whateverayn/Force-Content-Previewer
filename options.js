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
  // --- デバッグ用 ---
  console.log('「追加」ボタンがクリックされました。');
  
  const newOrigin = newOriginInput.value.trim();
  if (!newOrigin) {
    console.error('入力が空です。');
    return;
  }
  
  // --- デバッグ用 ---
  console.log(`権限を要求します: "${newOrigin}"`);

  browser.permissions.request({ origins: [newOrigin] }).then(granted => {
    // --- デバッグ用 ---
    console.log(`権限の付与が完了しました。結果: ${granted}`);
    
    if (granted) {
      statusElement.textContent = `「${newOrigin}」への権限が許可されました。`;
      newOriginInput.value = '';
      updateUI();
    } else {
      statusElement.textContent = `「${newOrigin}」への権限が拒否されました。`;
    }
    setTimeout(() => { statusElement.textContent = ''; }, 3000);
  });
});

document.addEventListener('DOMContentLoaded', updateUI);