const listElement = document.getElementById('permitted-list');
const newOriginInput = document.getElementById('new-origin');
const addButton = document.getElementById('add');
const statusElement = document.getElementById('status');

// 現在許可されているドメインを表示する関数
function updateUI() {
  listElement.innerHTML = ''; // リストをクリア
  browser.permissions.getAll().then(permissions => {
    for (const origin of permissions.origins) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = origin;
      const removeButton = document.createElement('button');
      removeButton.textContent = '削除';
      
      removeButton.onclick = () => {
        browser.permissions.remove({ origins: [origin] }).then(removed => {
          if (removed) updateUI(); // 成功したらUIを更新
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

  browser.permissions.request({ origins: [newOrigin] }).then(granted => {
    if (granted) {
      statusElement.textContent = `「${newOrigin}」への権限が許可されました。`;
      newOriginInput.value = ''; // 入力欄をクリア
      updateUI(); // UIを更新
    } else {
      statusElement.textContent = `「${newOrigin}」への権限が拒否されました。`;
    }
    setTimeout(() => { statusElement.textContent = ''; }, 3000);
  });
});

// 初期表示
document.addEventListener('DOMContentLoaded', updateUI);