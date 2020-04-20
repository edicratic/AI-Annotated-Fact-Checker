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

function secureWebCheck(element, callback){
  chrome.identity.getAuthToken({
   interactive: true
 }, function(token) {
   auth = {type:"Google", token: token, isAuth: true, message:"authCredentials"}
   if (chrome.runtime.lastError) {
     //TODO handle failure to authenticate
     //Tell the user something went wrong
     console.log(chrome.runtime.lastError.message);
     return;
   }
   chrome.storage.local.get(['email'], (res) => {
     console.log(Object.entries(res));
     console.log(Object.entries(res).length);
     console.log(Object.entries(res).length == 0);
     if(chrome.runtime.lastError || Object.entries(res).length == 0){
       var x = new XMLHttpRequest();
       x.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token);
       x.onload = function() {
         let response = JSON.parse(x.response);
         chrome.storage.local.set({"email": response["email"], "first_name": response["given_name"]}, function() {
           if(chrome.runtime.lastError){
             auth["email"] = "failedToGet@mail.com";
             callback(element,auth);
             console.log("failed to write to localstorage ... what do we do?");
           }else{
             auth["email"] = response["email"];
             callback(element,auth);
           }
         });
       };
       x.send();
     }else{
       auth["email"] = res.email
       callback(element,auth);
     }
   });
 });
}

function performWebCheck(element, auth){
  console.log(auth);
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
            chrome.tabs.executeScript(specTab.id, {file: 'tags.js'}, () => {
              chrome.tabs.sendMessage(specTab.id, auth);
              console.log("sentMessage");
           });
        });
      changeColor.style.display = "none"
      check.style.display = "";
      window.close();
  });
}

changeColor.onclick = (element) => secureWebCheck(element, performWebCheck);