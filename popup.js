// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const VALID_PAGE_HTML = 'extensionbox.html';
const DATA_LOADED = 'DATA_LOADED';
const BUTTON_PRESSED = 'BUTTON_PRESSED';
const ALREADY_CHECKED = 'ALREADY_CHECKED';
localStorage['isLoadedEdicratic'] = false;

const INVALID_SEARCH_URLS = [
    // 'www.facebook.com/',
]

evaluatePageForChecked();
checkCurrentPage();

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if(message.data === DATA_LOADED) {
        localStorage['isLoadedEdicratic'] = true;
        window.close();
    } else if (message.data === ALREADY_CHECKED) {
        localStorage['isLoadedEdicratic'] = true;
        load(true);
    }
});


function checkCurrentPage() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url;
        var isValidPage = true;
        INVALID_SEARCH_URLS.forEach(invalid => {
            if (url.includes(invalid)) isValidPage = false;
        })
        load(isValidPage);

    });
}

function load(isValidPage) {
    localStorage['validEdicratic'] = isValidPage;
    document.body.innerHTML = `<object type="text/html" data="${VALID_PAGE_HTML}"></object>`;
}

function evaluatePageForChecked() {
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
        var activeTab = arrayOfTabs[0];
        chrome.tabs.executeScript(activeTab.id, {file: "checker.js"});
    });
}
