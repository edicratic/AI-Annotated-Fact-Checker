ALREADY_UPDATED = false;
DEFAULT_BLACKLIST = [
    'twitter',
    'www.linkedin',
    'www.amazon',
    'www.facebook',
    'www.linkedin',
    'mail.google',
    'outlook.office',
    'mail.aol',
    'www.google',
    'www.zoho',
    'mail.com',
    'mail.yahoo',
    'www.tiktok',
    'www.facebook',
    'www.whatsapp',
    'www.messenger',
    'www.instagram',
    'www.tiktok',
    'www.ebay',
    'www.walmart',
    'www.target',
    'www.alibaba',
    'www.wayfair',
    'www.wish',
    'www.shopify',
    'www.youtube',
    'www.netflix',
    'docs.google',
    'support.google',
    'vimeo',
    'accounts.google',
    'drive.google',
    'github',
    'www.dropbox',
    'www.paypal',
    'www.dailymotion',
    'news.google',
    'bitly',
    'bit.ly',
  ]
LIST_TYPE = 'blacklisted-edicratic';

checkAndRun();
setInterval(() => {
    if (typeof currentWebCheckedUrl !== 'undefined') {
        if (window.location.href !== currentWebCheckedUrl) {
            currentWebCheckedUrl = window.location.href;
            checkAndRun();
        }
    }

}, 1000)

if (window.location.hostname.includes('yahoo')) {
    //specific domain stuff
    window.addEventListener('scroll', clearYahooTags);
}

function checkAndRun() {
    chrome.storage.local.get(['auto-webcheck-enabled'], function(result) {
        let enabled = result['auto-webcheck-enabled'];
        if (enabled !== false) {
           runAutoCheck();
        }

    });
}


function runAutoCheck() {
    chrome.storage.local.get([LIST_TYPE], function (result) {
        let val = result[LIST_TYPE] || DEFAULT_BLACKLIST;
        let copyOfVal = result[LIST_TYPE];
        chrome.storage.local.get(['authStatus'], function(result) {
            if(chrome.runtime.lastError || result.authStatus === null || result.authStatus === undefined || result.authStatus === "Logged Out") return;
                if(!copyOfVal) {
                    let storage = {};
                    storage[LIST_TYPE] = DEFAULT_BLACKLIST;
                    chrome.storage.local.set(storage);
                    chrome.storage.local.set({'button-change-edicratic': {'time': new Date().getTime(), 'on': true}});
                }
                let host = getDomain(window.location.href);
                if (val.includes(host)){
                    window.removeEventListener('scroll', checkForSizeChange);
                } else {
                    makePostRequest(true);
                }
        });
    });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if(changes['auto-webcheck-enabled']) {
        let change = changes['auto-webcheck-enabled']['newValue'];
        if(change) runAutoCheck();
    } else if (changes['authStatus']) {
        let change = changes['authStatus']['newValue'];
        if (change === 'Authenticated') {

        }
    } else if(changes[LIST_TYPE]) {
        let changeList = changes[LIST_TYPE];
        let oldList = changeList['oldValue'];
        let newList = changeList['newValue'];
        let type = null;
        if (oldList.length > newList.length) {
            type = 'Remove';
        } else {
            type = 'Add';
        }
        whitelistChange(type, newList);
    } else if (changes['button-change-edicratic']) {
        let changeList = changes['button-change-edicratic'];
        if (!changeList['oldValue']) return;
        let oldTime = changeList['oldValue']['time'];
        let newTime = changeList['newValue']['time'];
        let oldPosition = changeList['oldValue']['on'];
        autoWebCheckChange(oldPosition ? 'turnOff' : 'turnOn', newTime - oldTime);
    } else if (changes['dummy-highlight']) {
        analyzeTextForSending();
    }
});

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

function handleUpdate(message) {
    if (ALREADY_UPDATED) return;
    if (message === 'Extension context invalidated.') {
        ALREADY_UPDATED = true;
        alert('Looks like the extension was just updated. Please reload your page :)');
    }
}