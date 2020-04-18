let changeColor = document.getElementById('changeColor');
let check = document.getElementById('edicratic-check');
let invalidMessage = document.getElementById('edicratic-invalid');
if (localStorage['isLoaded'] === 'true') {
    check.style.display = "";
    changeColor.style.display = "none";
} else {
    check.style.display = "none";
}
var isValid = localStorage['valid'];
if (isValid === 'true') {
    invalidMessage.style.display = 'none';
} else {
    changeColor.style.display = 'none';
}

function secureWebCheck(element, callback){
  chrome.identity.getAuthToken({
   interactive: true
 }, function(token) {
   auth = {type:"Google", token: token, isAuth: true}
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
      chrome.tabs.executeScript(specTab.id, {file: 'tags.js'}, () => {
        chrome.tabs.sendMessage(specTab.id, auth);
        console.log("sentMessage");
      });
      changeColor.style.display = "none"
      check.style.display = "";
      window.close();
  });
}

changeColor.onclick = (element) => secureWebCheck(element, performWebCheck);
