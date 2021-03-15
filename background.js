//TODO Yukt add the caching
BASE_URL = "https://webcheck-api-dev.edicratic.com"
DEFAULT_BLACKLIST = [
  'twitter',
  'www.linkedin',
  'www.amazon',
  'www.facebook',
  'www.linkedin',
  'mail.google',
  'outlook.office',
  'mail.aol',
  'www.google',
  'www.zoho',
  'mail.com',
  'mail.yahoo',
  'www.tiktok',
  'www.facebook',
  'www.whatsapp',
  'www.messenger',
  'www.instagram',
  'www.tiktok',
  'www.ebay',
  'www.walmart',
  'www.target',
  'www.alibaba',
  'www.wayfair',
  'www.wish',
  'www.shopify',
  'www.youtube',
  'www.netflix',
  'docs.google',
  'support.google',
  'vimeo',
  'accounts.google',
  'drive.google',
  'github',
  'www.dropbox',
  'www.paypal',
  'www.dailymotion',
  'news.google',
  'bitly',
  'bit.ly'
]
LIST_TYPE = 'blacklisted-edicratic';

chrome.contextMenus.create({
  title: "WebCheck This Term", 
  contexts:["selection"], 
  id: 'CONTEXT_MENU_ID',
});
chrome.contextMenus.onClicked.addListener(() => {
  chrome.storage.local.set({'dummy-highlight': new Date().getTime()});
});

// chrome.storage.local.get(['authStatus'], function(result) {
//   createBadge(result['authStatus']);
// });

// chrome.storage.onChanged.addListener((changes, namespace) => {
//   if (!changes['authStatus']) return;
//   createBadge(changes['authStatus']['newValue']);
// });

// chrome.runtime.onUpdateAvailable.addListener(function(details) {
//   console.log("updating to version " + details.version);
//   chrome.runtime.reload();
// });

function createBadge(authStatus) {
  // if(chrome.runtime.lastError || authStatus === null || authStatus === undefined || authStatus === "Logged Out") {
  //   chrome.browserAction.setBadgeText({text: 'Off'});
  //   chrome.browserAction.setBadgeBackgroundColor({color: 'red'});
  // } else {
    chrome.browserAction.setBadgeText({text: 'On'});
    chrome.browserAction.setBadgeBackgroundColor({color: '#4688F1'});
  //}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "callInternet"){
      // console.log("calling the internet");
      fetch(request.input, request.params).then(function(response) {
        // console.log("a response");
        response.text().then(function(text) {
          sendResponse([{
            body: text,
            status: response.status,
            statusText: response.statusText,
          }, null]);
        });
      }, function(error) {
        // console.log("here?");
        console.log(error);
        sendResponse([null, error]);
      });
}else if (request.message === "callWebCheckAPI"){
  // console.log("calling the internet");
  url = BASE_URL + request.input;
  fetch(url, request.params).then(function(response) {
    // console.log("a response");
    requestFailed = false;
    // if(response.status === 401){
    //   requestFailed = true;
    //   chrome.storage.local.set({'authStatus': "Logged Out"}, function() {
    //     //Handle Error 
    //     if (chrome.runtime.lastError){
    //       //TODO 
    //       console.log("failed to save status, fatal error");
    //     }
    //     // console.log("Hi!")
    //   });
    // } else
     if (response.status !== 200){
      requestFailed = true;
    }
    response.text().then(function(text) {
      if (requestFailed){
        sendResponse([null, text]);
      }else{
        sendResponse([{
          body: text,
          status: response.status,
          statusText: response.statusText,
        }, null]);
      }
    });
  }, function(error) {
    // console.log("here?");
    console.log(error);
    sendResponse([null, error]);
  });
}  else if (request.message === 'NYTimes') {
  //TODO attach auth here, Chris
  let url = `https://news.google.com/rss/search?q=${request.term}`;
  fetch(url).then(response => {
    response.text().then(text => {
      sendResponse([{
        body: text,
        status: response.status,
        statusText: response.statusText,
      }, null]);
    }, function(error) {
      sendResponse([null, error]);
    });
  })
} else if(request.message === 'basicGET') {
  fetch(request.url).then(response => {
    response.text().then(text => {
      sendResponse([{
        body: text,
        status: response.status,
        statusText: response.statusText,
      }, null]);
    }, function(error) {
      sendResponse([null, error]);
    });
  })
// }else if (request.message === 'runOAuthFlow'){
//   oauthFlow();
}
return true;
});

// chrome.runtime.onInstalled.addListener(function(details){
//   oauthFlow();
//   let params =  { method:"POST", 
//                   body: JSON.stringify({body:{type: "installed"}}),
//                   'Content-Type': 'application/json'
//                 };
//   fetch(BASE_URL + "/subscription-event", params);
// });

function getToken(id_token){
  return new Promise((resolve, reject) => {
      let params =  {method:"POST", body: JSON.stringify({body:{oauth2_identifier:{type: "google", id_token: id_token}}}),
                      'Content-Type': 'application/json'};
      fetch(BASE_URL + "/token",params).then(res => {
          if(res.status === 200){
            resolve(res);
          }else{
            reject(res);
          }
      }).catch(err => {
          reject(err);
      });
  });
}

// function oauthFlow(){
//   chrome.tabs.create({'url': 'about:blank'}, function(authenticationTab) {
//       chrome.tabs.update(authenticationTab.id, {'url': 'https://webcheck.edicratic.com/login.html'});
//   });
// };

function createDefaultBlackList() {
  chrome.storage.local.get([LIST_TYPE], function (result) {
      if(!result[LIST_TYPE]) {
          let storage = {};
          storage[LIST_TYPE] = DEFAULT_BLACKLIST;
          chrome.storage.local.set(storage);
          chrome.storage.local.set({'button-change-edicratic': {'time': new Date().getTime(), 'on': true}});
      }
  })
}

chrome.runtime.setUninstallURL("https://webcheck.edicratic.com/uninstall.html?origin=extension")
