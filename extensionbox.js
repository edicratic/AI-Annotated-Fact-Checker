let changeColor = document.getElementById('changeColor');
let check = document.getElementById('edicratic-check');
let invalidMessage = document.getElementById('edicratic-invalid');
let icon = document.getElementById('info-icon-edicratic');
let checkBox = document.getElementById("enable-quick-look-up");
let bugReport = document.getElementById('edicratic-bug-report');
let buttonIcon = document.getElementById('changeColor-icon');
if(localStorage['isLoadedEdicratic'] === 'true') changeColor.style.display = 'none';

chrome.storage.local.get(['authStatus'], function(result) {
  if(chrome.runtime.lastError || result.authStatus === null || result.authStatus === undefined || result.authStatus === "Logged Out"){
      chrome.runtime.sendMessage({input: "/auth-status",params: {method: "GET"}, message: "callWebCheckAPI"}, messageResponse => {
          const [response, error] = messageResponse;
          if (response === null) {
              setButtonLogin(changeColor, buttonIcon)
          } else {
              setButtonNormal(changeColor, buttonIcon);
          }
        });
      
  } else if(result.authStatus === "Authenticated"){
      setButtonNormal(changeColor, buttonIcon);
  }
});

function setButtonLogin(changeColor, buttonIcon) {
  console.log('login');
  changeColor.style.backgroundColor = '#3958ae';
  buttonIcon.style.display = 'none';
  let text = document.getElementById('webcheck-text');
  text.innerText = 'Login To Webcheck';
  changeColor.onclick = () => chrome.runtime.sendMessage({message: "runOAuthFlow"})
}

function setButtonNormal(changeColor, buttonIcon) {
  changeColor.style.backgroundColor = '';
  let text = document.getElementById('webcheck-text');
  text.textContent = 'WebCheck This';
  buttonIcon.style.display = 'inline';
  changeColor.onclick = () => performWebCheck();

}

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
    chrome.storage.local.set({'highlight-enabled': !val});
  });
}

function updateBox(checkBox) {
    chrome.storage.local.get(["highlight-enabled"], (result) => {
      let val = result['highlight-enabled'];
      checkBox.checked = !!val;
    });
}

function performWebCheck(){
  chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let specTab = tabs[0]; 
      chrome.tabs.executeScript(specTab.id, {
        code: `chrome.runtime.sendMessage({data: 'webCheckLoadScript', loaded: typeof scriptAlreadyLoaded === "undefined" ? false : scriptAlreadyLoaded});`
      });
      changeColor.style.display = "none"
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
