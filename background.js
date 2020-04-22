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

var clientId = manifest.oauth2.client_id;
var scopes = manifest.oauth2.scopes.join(' ');
var redirectUri ='https://' + chrome.runtime.id + '.chromiumapp.org';

const authParams = new URLSearchParams({
  client_id: clientId,
  response_type: 'code token id_token',
  redirect_uri: redirectUri,
  access_type: "offline",
  scope: scopes,
});
const url = `https://accounts.google.com/o/oauth2/auth?${authParams.toString()}`;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("hre");
    console.log(request);
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
    return true;
  });
 chrome.runtime.onInstalled.addListener(function(details){
   chrome.identity.getAuthToken({
		interactive: true
	}, function(token) {
		if (chrome.runtime.lastError) {
      //This is a tolerable failure.
			console.log(chrome.runtime.lastError.message);
			return;
		}
		var x = new XMLHttpRequest();
		x.open('GET', 'https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=' + token);
		x.onload = function() {
      let response = JSON.parse(x.response);
			chrome.storage.local.set({"email": response["email"], "first_name": response["given_name"]}, function() {
        if(chrome.runtime.lastError){
          console.log("Failure :'(");
        }else{
          console.log("Succes!");
          console.log(response);
        }
			});
		};
		x.send();
	});
});
