ALREADY_CHECKED = 'ALREADY_CHECKED';
console.log(document.getElementsByClassName('edicratic-anchor-tag-style').length);
console.log(document.getElementsByClassName('loading-edicratic').length);
if (document.getElementsByClassName('edicratic-anchor-tag-style').length !== 0 || document.getElementsByClassName('loading-edicratic').length !== 0) {
    console.log('in here');
    chrome.runtime.sendMessage({
        data: ALREADY_CHECKED
    });
}