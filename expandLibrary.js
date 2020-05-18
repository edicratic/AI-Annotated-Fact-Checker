LOG_URL = "/log"
NUMBER_OF_CHARCATERS_IN_PARAGRAPH = 500;
INVALID_DESCRIPTION = "Disambiguation page providing links to topics that could be referred to by the same search term";


function analyzeTextForSending() {
    if(!window.getSelection) return;
    if(window.getSelection().toString() === '') return;
    let node = window.getSelection().anchorNode;
    const range = window.getSelection().getRangeAt(0);
    let text = window.getSelection().toString();
    if (range.startOffset === range.endOffset) return;
    if (text.length > 50) return;

    sendBackData(node, text);
    modifySingleNode(node, text.trim());
}

function sendBackData(paragraph, text) {
    //we dont want an infinite loop, now do we
    let i = 0;
    while(paragraph.textContent.length < NUMBER_OF_CHARCATERS_IN_PARAGRAPH && i < 5) {
        paragraph = paragraph.parentElement;
        i+=1;
    }
    if(paragraph.textContent.length <= 100){
      return
    }
    //TODO add processing
    let raw = paragraph.innerHTML;

    let body = {
      type: "Annotation",
      subject: text,
      raw_annotated_html: raw,
      url: window.location.href,
      annotation_type: "missing"
    };
    sendData(LOG_URL, body);
}

async function lookUpTerm(term) {
    var URL = getWikiUrl(term);
    var data;
    try {
      var result = await fetchWiki(URL);
      data = await result.json();
    } catch (e) {
      console.log(e);
      return;
    }
    if(!data || !data.query || !data.query.pages || data.query.pages.length === 0) return;
    init(data, term);
}

function fetchWiki(input) {
    return new Promise((resolve, reject) => {
      let params = {method: "GET"}
      chrome.runtime.sendMessage({input,params,init,message: "callInternet"}, messageResponse => {
        //   console.log(messageResponse);
        const [response, error] = messageResponse;
        if (response === null) {
          reject(error);
        } else {
          // Use undefined on a 204 - No Content
          const body = response.body ? new Blob([response.body]) : undefined;
          resolve(new Response(body, {
            status: response.status,
            statusText: response.statusText,
          }));
        }
      });
    });
  }

  function fetchNewYorkTimes(term) {
    let dateObj = new Date();
    let month = `${dateObj.getMonth() + 1}`
    let day = `${dateObj.getDate()}`;
    let date = `${dateObj.getFullYear()}-${month.length < 2 ? '0' + month : month}-${day.length < 2 ? '0' + day : day}`;
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({message: 'NYTimes', term, date}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
          reject(error);
        } else {
          // Use undefined on a 204 - No Content
          const body = response.body ? new Blob([response.body]) : undefined;
          resolve(new Response(body, {
            status: response.status,
            statusText: response.statusText,
          }));
        }
      });
    })
  }

  function sendData(url, body) {
      return new Promise((resolve, reject) => {
        params = {
                  method: "POST",
                  body: JSON.stringify({body: body}),
                  headers: {
                     'Content-Type': 'application/json',
                 }
               }
        chrome.runtime.sendMessage({input: url,params,message: "callWebCheckAPI",needsAuthHeaders: true}, messageResponse => {
          //   console.log(messageResponse);
          const [response, error] = messageResponse;
          if (response === null) {
            reject(error);
          } else {
            const body = response.body ?  new Blob([response.body]) : undefined;
            resolve(new Response(body, {
              status: response.status,
              statusText: response.statusText,
            }));
          }
        });
      });
    }

function getWikiUrl(term) {
    const params =  new URLSearchParams({
        "action": "query",
        "format": "json",
        "prop": "description|extracts|pageimages",
        "list": "",
        "generator": "search",
        "exsentences": "2",
        "exlimit": "5",
        "exintro": 1,
        "gsrsearch": term,
        "gsrlimit": 5,
        "gsrinfo": "totalhits",
        "gsrsort": "relevance",
    });
    return `https://en.wikipedia.org/w/api.php?${params.toString()}`;
}

function getMatches(pages) {
  var matches = [];
  Object.keys(pages).forEach(key => {
    if(key && pages[key].description !== INVALID_DESCRIPTION) matches.push(pages[key]);
  })
  matches.sort((a,b) => a.index - b.index);
  return matches;

}
