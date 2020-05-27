ALREADY_CHECKED = 'ALREADY_CHECKED';
spinner = document.getElementsByClassName('loading-edicratic')[0];
tags = document.getElementsByClassName('edicratic-anchor-tag-style');
if (spinner && spinner.style.display !== 'none') {
    chrome.runtime.sendMessage({
        data: ALREADY_CHECKED
    });
}
if (tags.length !== 0) chrome.runtime.sendMessage({data: 'hasHTML'});