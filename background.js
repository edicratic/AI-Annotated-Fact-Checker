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

function getAuth(interactive){
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({
      interactive: interactive
     }, function(token) {
       auth = {type:"Google", token: token}
       if (chrome.runtime.lastError) {
         reject(chrome.runtime.lastError.message);
       }
       chrome.storage.local.get(['email'], (res) => {
         if(chrome.runtime.lastError || Object.entries(res).length == 0){
           var x = new XMLHttpRequest();
           x.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token);
           x.onload = function() {
             let response = JSON.parse(x.response);
             chrome.storage.local.set({"email": response["email"], "first_name": response["given_name"]}, function() {
               if(chrome.runtime.lastError && showError){
                 auth["email"] = "failedToGet@mail.com";
                 console.log("failed to write to localstorage ... what do we do?");
               }else{
                 auth["email"] = response["email"];
               }
             });
           };
           x.send();
         }else{
           auth["email"] = res.email;
         }
       resolve(auth);
     });
  })
});
}
//TODO show the error
function attachHeaders(request, interactive){
  return new Promise((resolve, reject) =>{
    if(!request.needsAuthHeaders){
      resolve(request);
    }
    getAuth(interactive).then(auth => {
      request.params.headers["authorizationToken"] = auth["token"];
      resolve(request);
    }).catch((err) => {
      reject(err);
    });
 });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("wtf");
    if (request.message === "callInternet"){
      console.log("hello");
      attachHeaders(request, false).then((readyRequest) => {
        fetch(readyRequest.input, readyRequest.params).then(function(response) {
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
    }).catch(err => {
		err_log = {type: "Application Error", content: err, url: "None"};
		param_stuff = {
				method: "POST",
				body: JSON.stringify({body: err_log}),
				headers: {
				   'Content-Type': 'application/json',
			   }
			 };
		fetch("https://webcheck-api.edicratic.com/log", param_stuff);
        sendResponse([null, err]);
    });
    return true;
}
});

chrome.runtime.onInstalled.addListener(function(details){
  getAuth(true).then(auth =>{
    console.log(auth);
  }).catch(err => {
		err_log = {type: "Application Error", content: err, url: "None"};
		param_stuff = {
				method: "POST",
				body: JSON.stringify({body: err_log}),
				headers: {
				   'Content-Type': 'application/json',
			   }
			 };
		fetch("https://webcheck-api.edicratic.com/log", param_stuff);
    });
});

getAuth(false);
