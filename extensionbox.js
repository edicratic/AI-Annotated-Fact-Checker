QUICK_LOOK_UP_ENABLED = 'edicratic-quick-look-up-enabled';
let changeColor = document.getElementById('changeColor');
let check = document.getElementById('edicratic-check');
let invalidMessage = document.getElementById('edicratic-invalid');
let icon = document.getElementById('info-icon-edicratic');
let checkBox = document.getElementById("enable-quick-look-up");
let isQuickLookUpEnabled = localStorage[QUICK_LOOK_UP_ENABLED];
let sendVal = isQuickLookUpEnabled === 'true' || isQuickLookUpEnabled === undefined;
updateBox(checkBox);
checkBox.onclick = () => handleCheckBoxClick();
icon.addEventListener("mouseover", (e) => {
    let popup = document.getElementById("myPopup");
    popup.classList.toggle("show");
});
if (localStorage['isLoadedEdicratic'] === 'true') {
    check.style.display = "";
    changeColor.style.display = "none";
} else {
    check.style.display = "none";
}
var isValid = localStorage['validEdicratic'];
if (isValid === 'true') {
    invalidMessage.style.display = 'none';
} else {
    changeColor.style.display = 'none';
}
changeColor.onclick = function(element) {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
        var specTab = tabs[0];;
        chrome.tabs.insertCSS(specTab.id, {file: 'tags.css'});
        chrome.tabs.insertCSS(specTab.id, {file: 'fontawesome.css'});
        chrome.tabs.insertCSS(specTab.id, {file: 'expandLibrary.css'});
        chrome.tabs.executeScript(specTab.id, {file: 'fontawesome.js'}, () => console.log("DONE"));
        chrome.tabs.executeScript(specTab.id, {file: 'expandLibrary.js'}, () => console.log("DONE"));
        chrome.tabs.executeScript(specTab.id, {
            code: 'var sendVal = ' + JSON.stringify(sendVal)
        }, function() {
            chrome.tabs.executeScript(specTab.id, {file: 'tags.js'});
        });
        changeColor.style.display = "none"
        check.style.display = "";
        window.close();
    });
};

function handleCheckBoxClick() {
    let val = localStorage['edicratic-quick-look-up-enabled'];
    let enable = undefined;
    if (!val || val === 'true') {
        localStorage['edicratic-quick-look-up-enabled'] = false;
        enable = false;
    } else {
        localStorage['edicratic-quick-look-up-enabled'] = true;
        enable = true;
    }
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "checkHighlight", "enable": enable});
    });
}

function updateBox(checkBox) {
    let val = localStorage['edicratic-quick-look-up-enabled'];
    let enable = undefined;
    if (!val || val === 'true') {
        checkBox.checked = true;
        enable = true;
    } else {
        checkBox.checked = false;
        enable = false;
    }
}