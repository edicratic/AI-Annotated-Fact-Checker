// chrome.runtime.onInstalled.addListener(function() {
//     chrome.storage.sync.set({color: '#3aa757'}, function() {
//       console.log("The color is green.");
//     });
    // chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    //     chrome.declarativeContent.onPageChanged.addRules([{
    //       conditions: [new chrome.declarativeContent.PageStateMatcher({
    //         pageUrl: {hostEquals: 'developer.chrome.com'},
    //       })
    //       ],
    //           actions: [new chrome.declarativeContent.ShowPageAction()]
    //     }]);
    // });
// });
//TODO Yukt add the caching
BASE_URL = "https://q329xt0jt9.execute-api.us-east-1.amazonaws.com/default"

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "callInternet"){
      console.log("calling the internet");
      fetch(request.input, request.params).then(function(response) {
        console.log("a response");
        return response.text().then(function(text) {
          sendResponse([{
            body: text,
            status: response.status,
            statusText: response.statusText,
          }, null]);
        });
      }, function(error) {
        console.log("here?");
        console.log(error);
        sendResponse([null, error]);
      });
} else if (request.message === 'NYTimes') {
  //TODO attach auth here, Chris
  let url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${request.term}&fq=pub_date:("${request.date}")&api-key=6NLKSZcRcdoGdABNC5e5ZlCetf0Upvns`
  fetch(url).then(response => {
    return response.text().then(text => {
      console.log(text);
      sendResponse([{
        body: text,
        status: response.status,
        statusText: response.statusText,
      }, null]);
    }, function(error) {
      sendResponse[null, error];
    });
  })
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
          resolve(res);
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
              console.log(tab.title);
              var titleParts = tab.title.split(' ', 2);

              var result = titleParts[0];
              if (titleParts.length == 2 && RESULT_PREFIX.indexOf(result) >= 0) {
                  chrome.tabs.onUpdated.removeListener(googleAuthorizationHook);
                  chrome.tabs.remove(tabId);

                  var response = titleParts[1];
                  console.log("hey");
                  const urlParams = new URLSearchParams(response);
                  let id_token = null;
                  switch (result) {
                      case 'Success':
                          console.log("SUCCESSS")
                          console.log(response);
                          id_token = urlParams.get("id_token");
                          getToken(id_token).then(res => {
                              console.log(res);
                          }).catch(err => {
                              console.log(err);
                          });
                      break;
                      case 'Denied':
                          console.log("DENIEDDD");
                          // Example: error_subtype=access_denied&error=immediate_failed
                          console.log(response);
                      break;
                      case 'Error':
                          console.log("ERRRORRROROOR");
                          console.log(response);
                          id_token = urlParams.get("id_token");
                          if (id_token == null || id_token == undefined){
                              console.log("an actual error")
                          }else{
                              getToken(id_token).then(res => {
                                  console.log(res);
                              }).catch(err => {
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