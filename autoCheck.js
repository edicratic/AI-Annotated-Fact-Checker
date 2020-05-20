DEFAULT_WHITELIST = [
    'www.fox',
    'www.foxnews',
    'www.cnn',
    'www.npr', 
    'www.msnbc',
    'medium',
    'www.inc',
    'www.forbes',
    'www.yahoo',
    'www.huffpost',
    'www.nytimes',
    'www.nbcnews',
    'www.dailymail',
    'www.washingtonpost',
    'www.theguardian',
    'www.wsj',
    'www.bbc',
    'www.usatoday',
    'www.latimes',
    'www.engadget',
    'moz',
    'mashable',
    'techcrunch',
    'www.nerdwallet',
    'news.yahoo',
    
]

setInterval(() => {
    if (typeof currentWebCheckedUrl !== 'undefined') {
        if (window.location.href !== currentWebCheckedUrl) {
            makePostRequest(true);
        }
    }

}, 1000)

if (window.location.hostname.includes('yahoo')) {
    //specific domain stuff
    window.addEventListener('scroll', clearYahooTags);
}

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
                if(!copyOfVal) chrome.storage.local.set({'whitelisted-edicratic': DEFAULT_WHITELIST});
                let host = getDomain(window.location.href);
                if (val.includes(host)){
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

function clearYahooTags() {
    let badTags = document.getElementsByClassName('StretchedBox');
    for (var i = 0; i < badTags.length; i++) {
        badTags[i].style.position = 'relative';
    }
}

function getDomain(url) {
    let anchor = document.createElement('a');
    anchor.href = url;
    var re = new RegExp('.(com|co.uk|net|org|gov|de|edu)')
    var secondLevelDomain = anchor.hostname.replace(re, '');
    return secondLevelDomain;
}