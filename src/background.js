function rewriteHeader(details) {
    for (let header of details.responseHeaders) {
        const headerName = header.name.toLowerCase();
        const headerValue = header.value.toLowerCase();

        if (headerName === 'content-disposition' && headerValue.startsWith('attachment')) {
            header.value = 'inline' + header.value.substring('attachment'.length);
            break;
        }
    }
    return { responseHeaders: details.responseHeaders };
}

browser.webRequest.onHeadersReceived.addListener(
    rewriteHeader,
    { urls: ["<all_urls>"] },
    ["blocking", "responseHeaders"]
);

// webリクエストが完了したときに発火するリスナー
browser.webRequest.onCompleted.addListener(
    (details) => {
        // ページ全体の読み込み（main_frame）に限定し、サブコンテンツ（画像等）は無視
        if (details.type === "main_frame") {

            // このリクエストのURLが、許可されたオリジンに含まれているかチェック
            browser.permissions.contains({
                origins: [details.url]
            }).then(hasPermission => {

                // 権限がある場合のみcontent_script.jsを注入
                if (hasPermission) {
                    browser.tabs.executeScript(details.tabId, {
                        file: "content_script.js"
                    });
                }
            });
        }
    },
    {
        urls: ["<all_urls>"] // 権限のあるページだけに絞られる
    }
);