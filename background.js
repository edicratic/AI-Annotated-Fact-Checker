//TODO Yukt add the caching
BASE_URL = "https://webcheck-api.edicratic.com"

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
    if(response.status === 401){
      requestFailed = true;
      chrome.storage.local.set({'authStatus': "Logged Out"}, function() {
        //Handle Error 
        if (chrome.runtime.lastError){
          //TODO 
          console.log("failed to save status, fatal error");
        }
        // console.log("Hi!")
      });
    } else if (response.status !== 200){
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
}else if (request.message === 'runOAuthFlow'){
  oauthFlow();
}
return true;
});

chrome.runtime.onInstalled.addListener(function(details){
  oauthFlow();
});

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

function oauthFlow(){
  var manifest = chrome.runtime.getManifest();
  var clientId = encodeURIComponent(manifest.oauth2.client_id);
  var scopes = encodeURIComponent(manifest.oauth2.scopes.join(' '));
  var redirectUri = encodeURIComponent('urn:ietf:wg:oauth:2.0:oob:auto');
  var url = 'https://accounts.google.com/o/oauth2/auth' +
            '?client_id=' + clientId +
            '&response_type=id_token' +
            '&access_type=offline' +
            '&redirect_uri=' + redirectUri +
            '&scope=' + scopes;

  var RESULT_PREFIX = ['Success', 'Denied', 'Error'];
  chrome.tabs.create({'url': 'about:blank'}, function(authenticationTab) {
      chrome.tabs.onUpdated.addListener(function googleAuthorizationHook(tabId, changeInfo, tab) {
          if (tabId === authenticationTab.id) {
              // console.log(tab.title);
			  if (tab.title === null || tab.title === undefined){
				  return;
			  }
              var titleParts = tab.title.split(' ', 2);

              var result = titleParts[0];
              if (titleParts.length == 2 && RESULT_PREFIX.indexOf(result) >= 0) {
                  chrome.tabs.onUpdated.removeListener(googleAuthorizationHook);
                  chrome.tabs.remove(tabId);

                  var response = titleParts[1];
                  // console.log("hey");
                  const urlParams = new URLSearchParams(response);
                  let id_token = null;
                  switch (result) {
                      case 'Success':
                          // console.log("SUCCESSS")
                          // console.log(response);
                          id_token = urlParams.get("id_token");
                          getToken(id_token).then(res => {
                            chrome.storage.local.set({'authStatus': "Authenticated"});
                          }).catch(err => {
                              chrome.storage.local.set({'authStatus': "Logged Out"});
                              console.log(err);
                          });
                      break;
                      case 'Denied':
                          // console.log("DENIEDDD");
                          chrome.storage.local.set({'authStatus': "Logged Out"});
                          // Example: error_subtype=access_denied&error=immediate_failed
                          // console.log(response);
                      break;
                      case 'Error':
                          //console.log("ERRRORRROROOR");
                          // console.log(response);
                          id_token = urlParams.get("id_token");
                          if (id_token == null || id_token == undefined){
                              //console.log("an actual error")
                              //TODO Handle / log this somehow
                              chrome.storage.local.set({'authStatus': "Logged Out"});
                          }else{
                              getToken(id_token).then(res => {
                                  chrome.storage.local.set({'authStatus': "Authenticated"});
                                  // console.log(res);
                              }).catch(err => {
                                  chrome.storage.local.set({'authStatus': "Logged Out"});
                                  console.log(err);
                              });
                          }
                      break;
                  }
              }
          }
      });

      chrome.tabs.update(authenticationTab.id, {'url': url});
  });
};