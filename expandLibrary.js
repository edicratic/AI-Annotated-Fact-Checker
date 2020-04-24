EDICRATIC_HIGHLIGHTED_TEXT_CLASS = 'edicratic-highlighted-text-class'
TOOL_TIP_CLASSNAME = 'edicratic-add-library-tooltip'
TOOL_TIP_TEXT_CLASSNAME_TOP = 'tooltiptext-top';
TOOL_TIP_TEXT_CLASSNAME_BOTTOM = 'tooltiptext-bottom'
CHECK_CLASS_NAME = 'fa fa-check fa-2x edicratic-yes';
X_CLASS_NAME = 'fa fa-times fa-2x edicratic-no';
LOG_URL = "https://webcheck-api.edicratic.com/log"
//Chris, modify this as you please
NUMBER_OF_CHARCATERS_IN_PARAGRAPH = 500;


function analyzeTextForSending(auth) {
    if(!window.getSelection) return;
    if(window.getSelection().toString() === '') return;
    closeAllTooltips();
    let node = window.getSelection().anchorNode;
    const range = window.getSelection().getRangeAt(0);
    let text = window.getSelection().toString();
    const rect = range.getBoundingClientRect()
    if (range.startOffset === range.endOffset) return;
    //if (text.length > 100) return;

    let tooltip = document.createElement('span');
    tooltip.className = TOOL_TIP_CLASSNAME;
    tooltip.innerHTML = `<p class="${TOOL_TIP_TEXT_CLASSNAME_TOP}">Do you want us to look up this highlighted text for you?</p><br/><br/><i class="${X_CLASS_NAME}"></i><i class="${CHECK_CLASS_NAME}"></i></p>`
    tooltip.setAttribute('data-content', text);
    document.body.prepend(tooltip);
    let paragraph = tooltip.children[0];
    var onBottom = rect.top >= tooltip.clientHeight ;
    tooltip.style.width = `${rect.right - rect.left}px`
    tooltip.style.top = onBottom ? `${window.pageYOffset + rect.top - tooltip.clientHeight - 20}px` : `${window.pageYOffset + rect.bottom + 30}px`;
    tooltip.style.left = `${rect.left}px`
    if(onBottom) paragraph.classList.replace(TOOL_TIP_TEXT_CLASSNAME_TOP, TOOL_TIP_TEXT_CLASSNAME_BOTTOM);
    let x = document.getElementsByClassName(X_CLASS_NAME)[0];
    let check = document.getElementsByClassName(CHECK_CLASS_NAME)[0];
    x.onclick = (e) => {
        e.preventDefault();
        clearSelection();
        removeHighlightedSpans();
    };
    check.onclick = (e) => {
        e.preventDefault();
        sendBackData(auth, node, text);
        modifySingleNode(node, text);
        clearSelection();
        removeHighlightedSpans();
    }
}

function removeHighlightedSpans() {
    window.getSelection().removeAllRanges();
    remove(document.getElementsByClassName(TOOL_TIP_CLASSNAME));
}

function checkAndRemoveSpans(e) {
    let element = e.toElement;
    if (element.className !== TOOL_TIP_CLASSNAME && element.parentElement.className !== TOOL_TIP_CLASSNAME) {
        window.getSelection().removeAllRanges();
        closeAllTooltips();
    }
}

function closeAllTooltips() {
    let tooltips = document.getElementsByClassName(TOOL_TIP_CLASSNAME);
    for (var i = 0; i < tooltips.length; i++) {
        tooltips[i].parentElement.removeChild(tooltips[i]);
    }
}

function remove(collection) {
    for (var i = 0; i < collection.length; i++) {
        collection[i].parentNode.removeChild(collection[i]);
    }
}

function clearSelection() {
    console.log("removing");
    window.getSelection().removeAllRanges();
}

function sendBackData(auth, paragraph, text) {
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
    sendData(auth, LOG_URL, body)
}

async function lookUpTerm(term) {

    var URL = getWikiUrl(term);
    var result = await fetchWiki(URL);
    var data = await result.json();
    if(!data || !data.query) return;
    var pages = data.query.pages;
    var matches = getMatches(pages);
    var pairs = {};
    pairs[term] = matches;
    init([pairs]);

}

function fetchWiki(input) {
    return new Promise((resolve, reject) => {
      let params = {method: "GET"}
      chrome.runtime.sendMessage({input,params,init}, messageResponse => {
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

  function sendData(auth, url, body) {
      return new Promise((resolve, reject) => {
        params = {
                  method: "POST",
                  body: JSON.stringify({body: body}),
                  headers: {
                     'Content-Type': 'application/json',
                     "authorizationToken": auth["token"]
                 }
               }
        chrome.runtime.sendMessage({input: url,params}, messageResponse => {
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
        "prop": "description|extracts",
        "list": "",
        "generator": "search",
        "exsentences": "2",
        "exlimit": "5",
        "exintro": 1,
        "gsrsearch": term,
        "gsrlimit": 5,
        "gsrinfo": "totalhits",
        "gsrsort": "relevance"
    });
    return `https://en.wikipedia.org/w/api.php?${params.toString()}`;
}

function getMatches(pages) {
  var matches = [];
  Object.keys(pages).forEach(key => {
    if(key) matches.push(pages[key]);
  })
  matches.sort((a,b) => a.index - b.index);
  return matches;
  
}
