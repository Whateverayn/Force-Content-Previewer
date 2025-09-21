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