DEFAULT_WHITELIST = [
    'fox',
    'foxnews',
    'cnn',
    'npr', 
    'msnbc',
    'medium',
    'inc',
    'forbes',
    'yahoo',
    'huffpost',
    'nytimes',
    'nbcnews',
    'dailymail',
    'washingtonpost',
    'theguardian',
    'wsj',
    'bbc',
    'usatoday',
    'latimes',
    'engadget',
    'moz',
    'mashable',
    'techcrunch',
    'nerdwallet',
]


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
        let val = result['whitelisted-edicratic'] || DEFAULT_WHITELIST;
        let copyOfVal = result['whitelisted-edicratic'];
        chrome.storage.local.get(['authStatus'], function(result) {
            if(chrome.runtime.lastError || result.authStatus === null || result.authStatus === undefined || result.authStatus === "Logged Out") return;
                if(!copyOfVal) chrome.storage.local.set({'whitelisted-edicratic': DEFAULT_WHITELIST})
                let original = window.location.host;
                let host = original.split('.')[1];
                let hostTwo = original.split('.')[0];
                if (val.includes(host) || val.includes(hostTwo)){
                    makePostRequest(true);
                } 
        });
    });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if(changes['auto-webcheck-enabled']) {
        let change = changes['auto-webcheck-enabled']['newValue'];
        if(change) makePostRequest(true);
    } else if (changes['authStatus']) {
        let change = changes['authStatus']['newValue'];
        if (change === 'Authenticated') {
            //gonna add menu

        }
    }
});

function createDefaultBlackList() {
    //makePostRequest(true);

}