window.onload = () => {
    chrome.storage.local.get(['auto-webcheck-enabled'], function(result) {
        let enabled = result['auto-webcheck-enabled'];
        if (enabled !== false) {
            runAutoCheck();
        }

    });
}

function runAutoCheck() {
    chrome.storage.local.get(['edicratic-blacklist'], function (result) {
        let val = result['edicratic-blacklist'];
        makePostRequest(true);
    });
}