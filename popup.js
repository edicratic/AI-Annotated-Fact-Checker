// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const VALID_PAGE_HTML = 'validPage.html';
const INVALID_PAGE_HTML = 'invalidPage.html';

const INVALID_SEARCH_URLS = [
    'www.google.com/search', 
    'www.bing.com/search', 
    'duckduckgo.com/',
    'www.facebook.com/',
]

checkCurrentPage();


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
    console.log(isValidPage)
    document.body.innerHTML = `<object type="text/html" data="${isValidPage ? VALID_PAGE_HTML : INVALID_PAGE_HTML}"></object>`;
}
