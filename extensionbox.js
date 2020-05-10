QUICK_LOOK_UP_ENABLED = 'edicratic-quick-look-up-enabled';
let changeColor = document.getElementById('changeColor');
let check = document.getElementById('edicratic-check');
let invalidMessage = document.getElementById('edicratic-invalid');
let icon = document.getElementById('info-icon-edicratic');
let checkBox = document.getElementById("enable-quick-look-up");
let bugReport = document.getElementById('edicratic-bug-report');
let isQuickLookUpEnabled = localStorage[QUICK_LOOK_UP_ENABLED];
let sendVal = isQuickLookUpEnabled === 'true' || isQuickLookUpEnabled === undefined;
if(localStorage['isLoadedEdicratic'] === 'true') changeColor.style.display = 'none';

updateBox(checkBox);
checkBox.onclick = () => handleCheckBoxClick();
bugReport.onclick = handleBugReport;
icon.addEventListener("mouseover", (e) => {
    let popup = document.getElementById("myPopup");
    popup.classList.toggle("show");
});

var isValid = localStorage['validEdicratic'];
if (isValid === 'true') {
    invalidMessage.style.display = 'none';
} else {
    changeColor.style.display = 'none';
}

function handleCheckBoxClick() {
  chrome.storage.local.get(["highlight-enabled"], (result) => {
    let val = result['highlight-enabled'];
    let enabled;
    if (val || val == undefined) {
      enabled = false;
    } else {
      enabled = true;
    }
    chrome.storage.local.set({'highlight-enabled': enabled});
  });
}

function updateBox(checkBox) {
    chrome.storage.local.get(["highlight-enabled"], (result) => {
      let val = result['highlight-enabled'];
      if (val || val == undefined) {
        checkBox.checked = true;
      } else {
        checkBox.checked = false;
      }
    });
}

function performWebCheck(){
  chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let specTab = tabs[0]; 
      chrome.tabs.sendMessage(specTab.id, {message: "runWebCheck"});
      changeColor.style.display = "none"
      check.style.display = "";
  });
}

function handleBugReport() {
  request = {message: "bugReport"}
  chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
    var specTab = tabs[0];
    chrome.tabs.insertCSS(specTab.id, {file: 'bugReport.css'});
    chrome.tabs.executeScript(specTab.id, {file: 'bugReport.js'}, () => {
      chrome.tabs.sendMessage(specTab.id, request);
    });
  });
}

changeColor.onclick = (element) => performWebCheck();
