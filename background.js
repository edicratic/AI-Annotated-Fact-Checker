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
	 chrome.identity.getAuthToken({
		interactive: true
	}, function(token) {
		if (chrome.runtime.lastError) {
			//TODO Handle this error. Although if api fails I know not what to do. 
			console.log(chrome.runtime.lastError.message);
			return;
		}
		var x = new XMLHttpRequest();
		x.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token);
		x.onload = function() {
			chrome.storage.local.set({"email": x.response["email"], "first_name": x.response["given_name"]}, function() {
				console.log("Succes!");
			});
		};
		x.send();
	});
});