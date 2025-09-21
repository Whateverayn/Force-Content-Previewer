function rewriteHeader(details) {
  // manifest.jsonとユーザーの許可設定により、このリスナーは
  // 許可されたドメインの通信に対してのみ発火する。

  for (let header of details.responseHeaders) {
    if (header.name.toLowerCase() === 'content-disposition') {
      if (header.value.toLowerCase().startsWith('attachment')) {
        console.log(`Rewriting header for: ${details.url}`);
        // 'attachment' を 'inline' に書き換える
        header.value = 'inline' + header.value.substring('attachment'.length);
      }
      break;
    }
  }
  return { responseHeaders: details.responseHeaders };
}

// 通信ヘッダーを受け取った時にリスナーを発火
browser.webRequest.onHeadersReceived.addListener(
  rewriteHeader,
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);