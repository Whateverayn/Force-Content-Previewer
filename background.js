console.log('Background script loaded successfully.'); // スクリプト起動確認用

function rewriteHeader(details) {
  // --- デバッグ用ログ ---
  console.log(`[EVENT FIRED] URL: ${details.url}`);
  console.log('[HEADERS RECEIVED]', details.responseHeaders);

  for (let header of details.responseHeaders) {
    const headerName = header.name.toLowerCase();
    const headerValue = header.value.toLowerCase();

    if (headerName === 'content-disposition' && headerValue.startsWith('attachment')) {
      // --- デバッグ用ログ ---
      console.log(`[ACTION] Found 'Content-Disposition: attachment'. Rewriting to 'inline'.`);
      
      header.value = 'inline' + header.value.substring('attachment'.length);
      
      // --- デバッグ用ログ ---
      console.log(`[RESULT] Header modified. New value: ${header.value}`);
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

console.log('webRequest listener has been added.'); // リスナー登録確認用