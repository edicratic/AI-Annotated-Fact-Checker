window.onload = () => {
    chrome.storage.local.get(['auto-webcheck-enabled'], function(result) {
        let enabled = result['auto-webcheck-enabled'];
        if (enabled !== false) {
            runAutoCheck();
        }

    });
}

function runAutoCheck() {
    chrome.storage.local.get(['whitelisted-edicratic'], function (result) {
        let val = result['whitelisted-edicratic'];
        if(val === undefined) {
            createDefaultBlackList();
        } else {
            let host = window.location.host.split('.')[1];
            if (val.includes(host)) makePostRequest(true);
        }
    });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if(!changes['auto-webcheck-enabled']) return;
    let change = changes['auto-webcheck-enabled']['newValue'];
    if(change) makePostRequest(true);
});

function createDefaultBlackList() {
    //makePostRequest(true);

}