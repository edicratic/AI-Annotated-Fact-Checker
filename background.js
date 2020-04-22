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
var manifest = chrome.runtime.getManifest();

var clientId = encodeURIComponent(manifest.oauth2.client_id);
var scopes = encodeURIComponent(manifest.oauth2.scopes.join(' '));
var redirectUri = encodeURIComponent('https://' + chrome.runtime.id + '.chromiumapp.org');

var url = 'https://accounts.google.com/o/oauth2/auth' +
          '?client_id=' + clientId +
          '&response_type=id_token' +
          '&access_type=offline' +
          '&redirect_uri=' + redirectUri +
          '&scope=' + scopes;



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    fetch(request.input).then(function(response) {
      return response.text().then(function(text) {
        sendResponse([{
          body: text,
          status: response.status,
          statusText: response.statusText,
        }, null]);
      });
    }, function(error) {
      sendResponse([null, error]);
    });
    return true;
  });
 chrome.runtime.onInstalled.addListener(function(details){
   chrome.identity.launchWebAuthFlow(
    {  'url': url,
        'interactive':true
    }, function(redirectedTo) {
  		if (chrome.runtime.lastError) {
        //This is a tolerable failure.
  			console.log(chrome.runtime.lastError.message);
  			return;
  		}
      var token_response = redirectedTo.split('#', 2)[1];
      var id_token = new URLSearchParams(token_response).get('id_token')
  		var x = new XMLHttpRequest();
  		x.open('GET', 'https://oauth2.googleapis.com/tokeninfo?id_token=' + id_token);
  		x.onload = function() {
        let response = JSON.parse(x.response);
  			chrome.storage.local.set({"email": response["email"]}, function() {
          if(chrome.runtime.lastError){
            console.log("Failure :'(");
          }else{
            console.log("Succes!");
          }
  			});
  		};
  		x.send();
  	});
});
