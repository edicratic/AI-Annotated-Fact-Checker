let changeColor = document.getElementById('changeColor');
let check = document.getElementById('edicratic-check');
let invalidMessage = document.getElementById('edicratic-invalid');
let icon = document.getElementById('info-icon-edicratic');
let checkBox = document.getElementById("enable-quick-look-up");
let bugReport = document.getElementById('edicratic-bug-report');
let buttonIcon = document.getElementById('changeColor-icon');
let loader = document.getElementById('loader');
let header = document.getElementById('header');
let checkBoxAutoCheck = document.getElementById('enable-auto-web-check');
let whitelist = document.getElementById('whitelist');
let settings = document.getElementById('edicratic-settings');
settings.onclick = () => window.open('settings.html', '_blank')
header.onclick = () => window.open('https://webcheck.edicratic.com/', '_blank')
whitelist.onclick = handleWhiteListing;
updateBox(checkBox, checkBoxAutoCheck);
updateWhitelist(whitelist);
checkBox.onclick = () => handleCheckBoxClick('highlight-enabled');
checkBoxAutoCheck.onclick = () => handleCheckBoxClick('auto-webcheck-enabled');
bugReport.onclick = handleBugReport;


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

function handleCheckBoxClick(cacheKey) {
  chrome.storage.local.get([cacheKey], (result) => {
    let val = result[cacheKey];
    let data = {};
    data[cacheKey] = val === false ? true : false;
    chrome.storage.local.set(data);
    if (cacheKey === 'auto-webcheck-enabled') {
      chrome.storage.local.set({'button-change-edicratic' : {'time': new Date().getTime(), 'on': data[cacheKey]}});
    }
  });
}

function updateBox(checkBox, checkBoxAutoCheck) {
    chrome.storage.local.get(["highlight-enabled"], (result) => {
      let val = result['highlight-enabled'];
      checkBox.checked = val === false ? false : true;
    });
    chrome.storage.local.get(['auto-webcheck-enabled'], (result) => {
      let valWebCheck = result['auto-webcheck-enabled'];
      checkBoxAutoCheck.checked = valWebCheck === false ? false : true;
    });
}

function performWebCheck(){
  chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let specTab = tabs[0]; 
      chrome.tabs.executeScript(specTab.id, {
        code: `chrome.runtime.sendMessage({data: 'webCheckLoadScript', loaded: typeof scriptAlreadyLoaded === "undefined" ? false : scriptAlreadyLoaded});`
      });
      changeColor.style.display = "none"
      loader.style.display = "";
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

function removeAllHTML() {
  chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
    var specTab = tabs[0];
    chrome.tabs.sendMessage(specTab.id, {message: 'removeAllHTML'});
  });
}

function handleWhiteListing(e) {
  chrome.storage.local.get(['whitelisted-edicratic'], (result) => {
    let websites = result['whitelisted-edicratic'] || [];
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let domain = getDomain(tabs[0].url);
      if(e.target.checked) {
        websites.push(domain);
        chrome.storage.local.get(['auto-webcheck-enabled'], res => {
          if(res['auto-webcheck-enabled'] !== false) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "runWebCheck", automatic: true});
          }
        });
      } else {
        websites = websites.filter(value => value !== domain);
      }
      //console.log(websites);
      chrome.storage.local.set({'whitelisted-edicratic': websites});
    })
    
  });
}

function updateWhitelist(whitelist) {
  chrome.storage.local.get(['whitelisted-edicratic'], (result) => {
    let websites = result['whitelisted-edicratic'] || [];
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
      let domain = getDomain(tabs[0].url);
      if(websites.includes(domain)) {
        whitelist.checked = true;
      } else {
        whitelist.checked = false;
      }
    });
  });
}

function getDomain(url) {
  let anchor = document.createElement('a');
  anchor.href = url;
  var re = new RegExp('.(com|co.uk|net|org|gov|de|edu)')
  var secondLevelDomain = anchor.hostname.replace(re, '');
  return secondLevelDomain;
}