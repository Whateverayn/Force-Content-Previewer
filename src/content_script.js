// download属性を持つ全ての<a>タグを探して、属性を削除する関数
function removeDownloadAttribute() {
    const links = document.querySelectorAll('a[download]');

    if (links.length > 0) {
        links.forEach(link => {
            link.removeAttribute('download');
        });
    }
}

// ページが読み込まれたとき、およびページ内容が動的に変更されたときに処理を実行
removeDownloadAttribute();

// 後からコンテンツが読み込まれる場合に対応するため、
// DOMの変更を監視して再度処理を実行する
const observer = new MutationObserver(removeDownloadAttribute);
observer.observe(document.body, {
    childList: true,
    subtree: true
});