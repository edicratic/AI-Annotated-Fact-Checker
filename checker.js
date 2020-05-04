ALREADY_CHECKED = 'ALREADY_CHECKED';
spinner = document.getElementsByClassName('loading-edicratic')[0];
if (spinner && spinner.style.display !== 'none') {
    chrome.runtime.sendMessage({
        data: ALREADY_CHECKED
    });
}