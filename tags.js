ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'edicratic-tooltip';
POST_URL = 'https://webcheck-api.edicratic.com/process';
INNER_LINK = 'inner-link';
SHOW_MORE_ICON_CLASS = "show-more fa fa-angle-down fa-3x";
SHOW_LESS_ICON_CLASS = "show-more fa fa-angle-up fa-3x";
PARAGRAPH_CLASS_NAME = 'edicratic-paragraph-classname'
NEW_LINE_ID = "please-remove-me";
idToData = {};
onTop = {};
OPEN_SPAN = undefined;
DATA_LOADED = 'DATA_LOADED'
BUTTON_PRESSED = 'BUTTON_PRESSED';
PREVIOUS_TEXT = "";
NEW_NODES = null;

window.addEventListener('scroll', adjustSpansBasedOnHeight);

chrome.storage.local.get(["highlight-enabled"], result => handleHighlightEnabling(result));
chrome.storage.onChanged.addListener((changes, namespace) => handleStorageChange(changes, namespace));


document.body.onmousemove = e => handleMouseMove(e);
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    if (request.message === "runWebCheck"){
        //window.addEventListener('scroll', checkForSizeChange);
        makePostRequest(request);
    }
  });

function init(data) {
    data.forEach((obj) => {
        let entity = Object.keys(obj)[0];
        let items = obj[entity];
        let itemsArray = proccessWikiData(items);
        var regex = undefined;
        try {
            var regex = new RegExp(entity, "i");
        } catch(e) {
            console.log(e);
        }
        let childList = document.body.childNodes;
        const set = new Set();
        if(itemsArray.length > 0 && regex) modifyAllText(regex, entity, itemsArray, NEW_NODES || childList, set,);
    });
}

async function modifySingleNode(node, text) {
    var url = getWikiUrl(text);
    var result = await fetchWiki(url);
    var data = await result.json();

    if(!data || !data.query) {
        alert("Sorry, could not find a match for that :(. Try to highlight specific terms");
        return;
    }
    var pages = data.query.pages;
    var matches = getMatches(pages);
    let itemsArray = proccessWikiData(matches);
    var innerText = node.textContent;
    var uniqueId = "d3" + Math.floor(Math.random() * 1000000);
    innerText = innerText.replace(text, `<div id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${text}</div>`);

    idToData[uniqueId] = [0, itemsArray]
    var newElement = document.createElement('div');
    newElement.style.display = "inline";
    newElement.innerHTML = innerText;
    newElement.onmouseover = (e) => mouseOverHandle(e, uniqueId);
    node.parentElement.replaceChild(newElement, node);

    var tooltip = document.createElement('span');
    tooltip.id = `${uniqueId}-parent`;
    tooltip.className = TOOL_TIP_CLASS_NAME;
    tooltip.innerHTML = `${itemsArray[0]['full_html']} <br/><br/> <div id="${uniqueId}" class="leftArrow fa fa-arrow-left fa-3x"></div> <div id="${uniqueId}" class="rightArrow fa fa-arrow-right fa-3x"></div>`
    tooltip.onmouseleave = (e) => {
        if(e.target) {
            let id = e.target.id;
            id = id.substring(0, id.indexOf('-'));
            removeSpan(id);
        }
    }
    document.body.prepend(tooltip)
    tooltip.onclick = e => e.preventDefault();
    tooltip.children[6].addEventListener('click', (e) => arrowClick(e, true), true);
    tooltip.children[7].addEventListener('click', (e) => arrowClick(e, false), true);



}

function modifyAllText(regex, entity, data, childList, set) {
    for (var i = 0; i < childList.length; i++) {
        const child = childList[i];
        if(!set.has(child) && child.className !== ANCHOR_CLASS_NAME && child.className !== TOOL_TIP_CLASS_NAME /*&& child.tagName !== 'NAV'*/) {
            set.add(child);
            const nextList = child.childNodes;
            const length = nextList.length;
            var text = child.textContent;
            if (length === 0 && text !== "" && text !== undefined && checkMatch(text, entity, regex)) {
                if (!noNearbyTags(child, regex)) {
                    return;
                }
                child.innerText = "";
                var uniqueId = "d" + i + Math.floor(Math.random() * 1000000);
                text = text.replace(regex, `<div id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${text.match(regex)}</div>`);
                idToData[uniqueId] = [0, data]
                var newElement = document.createElement('div');
                newElement.style.display = "inline";
                newElement.innerHTML = text;
                newElement.onmouseover = (e) => mouseOverHandle(e, uniqueId);
                if(child.nodeName === '#comment') continue;
                if(child.nodeName !== "#text") {
                    child.appendChild(newElement);
                } else {
                    child.parentElement.replaceChild(newElement, child);
                }
                set.add(newElement);

                //create span
                var tooltip = document.createElement('span');
                tooltip.id = `${uniqueId}-parent`;
                tooltip.className = TOOL_TIP_CLASS_NAME;
                tooltip.innerHTML = `${data[0]['full_html']} <br/><br/> <div id="${uniqueId}" class="leftArrow fa fa-arrow-left fa-3x"></div> <div id="${uniqueId}" class="rightArrow fa fa-arrow-right fa-3x"></div>`
                tooltip.onmouseleave = (e) => {
                    if(e.target) {
                        let id = e.target.id;
                        id = id.substring(0, id.indexOf('-'));
                        removeSpan(id);
                    }
                }
                document.body.prepend(tooltip)
                set.add(tooltip);
                tooltip.onclick = e => e.preventDefault();
                tooltip.children[6].addEventListener('click', (e) => arrowClick(e, true), true);
                tooltip.children[7].addEventListener('click', (e) => arrowClick(e, false), true);

            }
            if (length !== 0) {
                modifyAllText(regex, entity, data, nextList, set)
            }
    }
    }


}

function mouseOverHandle(e, id) {
    if (e.target && e.target.id) {
        id = e.target.id;
        id = id.substring(0, id.indexOf('-'));
        if (OPEN_SPAN) {
            removeSpan(OPEN_SPAN);
        }
        OPEN_SPAN = id;
        const span = document.getElementById(`${id}-parent`);
        const anchor = document.getElementById(`${id}-parent-parent`);
        let x = anchor.getBoundingClientRect().left + window.pageXOffset;
        let y = anchor.getBoundingClientRect().top + window.pageYOffset;
        span.style.visibility = 'visible';
        span.style.width = `${anchor.clientWidth}px`;
        span.style.left = `${x}px`;
        span.style.display = 'block';
        let expanded = textIsShown(span);

        //normalize for height
        removeAllTextConstraints(span, id);
        span.children[2].style.maxHeight = '';
        span.children[2].style.minHeight = '';


        let distance = anchor.getBoundingClientRect().top;
        if (distance <= span.clientHeight) {
            span.style.top = `${y + anchor.clientHeight}px`;
            onTop[id] = false;
            span.children[2].style.maxHeight = '100px';
            if(isOverflown(span.children[2])) {
                if(!expanded) {
                    removeIconShowMore(span);
                    createIconShowMore(span);
                } else {
                    span.children[2].style.marginBottom = '';
                    span.children[2].style.maxHeight = '1000000px';
                    createIconShowLess(span);
                }
            }
        } else {
            span.children[2].style.maxHeight = '';
            span.style.minHeight = '';
            span.getElementsByClassName('leftArrow')[0].style.marginTop = '';
            span.getElementsByClassName('rightArrow')[0].style.marginTop = '';
            span.style.top = `${y - span.clientHeight}px`;
            onTop[id] = true;
        }
    }
}

function removeSpan(id) {
    const span = document.getElementById(`${id}-parent`);
    span.style.display = "none";
    span.style.visibility = 'hidden';
}

function fetchWebCheck(input, params) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({input,params, message: "callInternet", needsAuthHeaders: true}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
          reject(error);
        } else {
          // Use undefined on a 204 - No Content
          //TODO @ Yukt halp??
          //response = JSON.parse(response.body);
          //console.log(response);
          //This is a bit hacky
          const body = response.body ?  new Blob([response.body]) : undefined;
          resolve(new Response(body, {
            status: response.status,
            statusText: response.statusText,
          }));
        }
      });
    });
  }

function makePostRequest() {
    PREVIOUS_TEXT = document.body.innerText;
    const spinner = document.createElement('div');
    spinner.className = "loading";
    spinner.classList.add('loading-edicratic');
    document.body.appendChild(spinner);
    let data = {"blob": document.body.innerText.substring(0, 50000), details: {sort: true, url: window.location.href}};
    console.log(JSON.stringify(data));
    fetchWebCheck(POST_URL,  {
                      method: "POST",
                      body: JSON.stringify({body: data}),
                      headers: {
                          'Content-Type': 'application/json',
    }}).then(result => {
        console.log(result);
        if (result.ok) {
            return result.json();
        } else {
            throw new Error(result.status);
        }
    }).then(data =>{
      //well so is thius hacky
      spinner.parentElement.removeChild(spinner);
      if(data == undefined){
        console.log("errr");
      }else{
        body = JSON.parse(data.body);
        console.log(body);
        processEntities(body);
        chrome.runtime.sendMessage({
            data: DATA_LOADED
        });
      }
    }).catch(e => {
        console.log(e);
        spinner.parentElement.removeChild(spinner);
        alert("Oops. Smething went wrong :(. Please try again. Error: " + e)
    });
}

async function processEntities(entities) {
   for (var i = 0; i < entities.length; i++) {
       lookUpTerm(entities[i].entity);
       await sleep(10);
   }
}

function sortEntities(data) {
    var counts = {};
    for (var i = 0; i < data.length; i++) {
        var curr = data[i];
        counts[curr.entity] = 0;
        for (var j = 0; j < data.length; j++) {
            var compare = data[j];
            if (curr.entity.includes(compare.entity)) counts[curr.entity] += 1;
        }
    }
    console.log(counts);
    data.sort((a, b) => {
        var diff = counts[b.entity] - counts[a.entity];
        return diff === 0 ? a.block - b.block : diff;
    });
}

function removeNonAlphaNumeric(word) {
    var PATTERN = /[^\x20\x2D0-9A-Z\x5Fa-z\xC0-\xD6\xD8-\xF6\xF8-\xFF]/g;
    return word.replace(PATTERN, '');
}

function stripHtml(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

function addListeners() {
    let leftArrows = document.getElementsByClassName('leftArrow');
    let rightArrows = document.getElementsByClassName('rightArrow');
    for (var i = 0; i < leftArrows.length; i++) {
        leftArrows[i].addEventListener('click', (e) => arrowClick(e, true), true);
    }
    for (var i = 0; i < rightArrows.length; i++) {
        rightArrows[i].addEventListener('click', (e) => arrowClick(e, false), true);

    }
}

function arrowClick(e, isLeft) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.toElement.id;
    //find other arrow and reset margin
    e.toElement.style.marginTop = '0px';
    let otherArrow;
    let otherArrows = document.getElementsByClassName(isLeft ? 'rightArrow' : 'leftArrow');
    for (var i = 0; i < otherArrows.length; i++) {
        if(otherArrows[i].id === id) otherArrow = otherArrows[i];
    }
    otherArrow.style.marginTop = '0px';

    //change data
    const entry = idToData[id];
    var previousIndex = entry[0];
    var array = entry[1];
    var newIndex = isLeft ? previousIndex === 0 ? array.length - 1 : previousIndex - 1 : ((previousIndex + 1) % array.length);
    idToData[id][0] = newIndex;
    const span = document.getElementById(`${id}-parent`);
    const spanHeight = span.clientHeight;
    span.style.minHeight = '';
    span.children[0].innerHTML = array[newIndex]['title']
    span.children[2].innerHTML = array[newIndex]['content'];
    //find link and reset
    let indexOfLink = 3;
    for (var i = 0; i < span.children.length; i++) {
        if(span.children[i].className === INNER_LINK) indexOfLink = i;
    }
    span.children[indexOfLink].outerHTML = `<i onclick="window.open('${array[newIndex]['link']}', '_blank');" class="inner-link">Wikimedia Foundation</i>`
    //keep padding constant when on top
    removeIconShowMore(span);
    if (onTop[id]) {
        const anchor = document.getElementById(`${id}-parent-parent`);
        span.children[2].style.minHeight = '';
        span.style.top = `${anchor.getBoundingClientRect().top + window.pageYOffset - span.clientHeight}px`;

    } else {
        span.style.minHeight =  `${spanHeight - 10}px`;
        if (isOverflown(span.children[2])) {
            span.children[2].style.paddingBottom = '';
            createIconShowMore(span);
        }
        let arr = e.toElement;
        let offset = arr.offsetParent.clientHeight - arr.offsetTop - arr.clientHeight;
        arr.style.marginTop = `${offset}px`;
        otherArrow.style.marginTop = `${offset}px`;
    }
}

function preventSpanDefaultBehaviour() {
    const spans = document.getElementsByClassName(TOOL_TIP_CLASS_NAME);
    for (var i = 0; i < spans.length; i++) {
        spans[i].onclick = e => e.preventDefault();
    }
}

function adjustSpansBasedOnHeight() {
    const span = document.getElementById(`${OPEN_SPAN}-parent`);
    const anchor = document.getElementById(`${OPEN_SPAN}-parent-parent`)
    if (span) {
        let y = anchor.getBoundingClientRect().top + window.pageYOffset;
        let distance = anchor.getBoundingClientRect().top;
        let expanded = textIsShown(span);

        //normalize for height
        removeAllTextConstraints(span, OPEN_SPAN);
        span.children[2].style.maxHeight = '';
        span.children[2].style.minHeight = '';


        if (distance <= span.clientHeight) {
            span.style.top = `${y + anchor.clientHeight}px`;
            onTop[OPEN_SPAN] = false;
            if (expanded) {
                createIconShowLess(span);
            } else {
                span.children[2].style.maxHeight = '100px';
                if(isOverflown(span.children[2])) {
                    removeAllTextConstraints(span);
                    removeIconShowMore(span);
                    createIconShowMore(span);
                }
            }
        } else {
            span.children[2].style.maxHeight = '';
            span.style.minHeight = '';
            removeAllTextConstraints(span);
            span.style.top = `${y - span.clientHeight}px`;
            onTop[OPEN_SPAN] = true;
            span.getElementsByClassName('leftArrow')[0].style.marginTop = '';
            span.getElementsByClassName('rightArrow')[0].style.marginTop = '';
        }
    }
}

function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

function createIconShowMore(span) {
    span.children[2].style.marginBottom = '0rem';
    let innerLink = span.children[3];
    let icon = document.createElement('i');
    icon.className = SHOW_MORE_ICON_CLASS;
    let id = span.id;
    id = id.substring(0, id.indexOf('-'));
    icon.id = `${id}-icon`;
    icon.onclick = (e) => showHiddenText(e);
    let br = document.createElement('br');
    height = br.clientHeight + icon.clientHeight;
    br.id= NEW_LINE_ID;
    innerLink.parentNode.insertBefore(icon, innerLink);
    innerLink.parentNode.insertBefore(br, innerLink);
    return height;
}

function createIconShowLess(span) {
    span.children[2].style.marginBottom = '0rem';
    let innerLink = span.children[3];
    let icon = document.createElement('i');
    icon.className = SHOW_LESS_ICON_CLASS;
    let id = span.id;
    id = id.substring(0, id.indexOf('-'));
    icon.id = `${id}-icon`;
    icon.onclick = (e) => hideText(e);
    innerLink.parentNode.insertBefore(icon, innerLink);
    span.getElementsByClassName('leftArrow')[0].style.display = 'none';
    span.getElementsByClassName('rightArrow')[0].style.display = 'none';
    
}

function removeIconShowMore(span) {
    span.children[2].style.marginBottom = '';
    for (var i = 0; i < span.children.length; i++) {
        if (span.children[i].className === SHOW_MORE_ICON_CLASS || span.children[i].id === NEW_LINE_ID) {
            span.children[i].parentNode.removeChild(span.children[i]);
        }
    }
    for (var i = 0; i < span.children.length; i++) {
        if (span.children[i].className === SHOW_MORE_ICON_CLASS || span.children[i].id === NEW_LINE_ID) {
            span.children[i].parentNode.removeChild(span.children[i]);
        }
    }
}

function showHiddenText(e) {
    let id = e.toElement.id;
    id = id.substring(0, id.indexOf('-'));
    let span = document.getElementById(`${id}-parent`);
    span.children[2].style.maxHeight = '1000000px';
    let newIcon = document.createElement('i');
    newIcon.id = `${id}-icon`;
    newIcon.className = SHOW_LESS_ICON_CLASS;
    newIcon.onclick = (e) => hideText(e);
    let oldIcon = e.toElement;
    oldIcon.parentNode.replaceChild(newIcon, oldIcon);

    //remove Arrows
    span.getElementsByClassName('leftArrow')[0].style.display = 'none';
    span.getElementsByClassName('rightArrow')[0].style.display = 'none';

}

function hideText(e) {
    let id = e.toElement.id;
    id = id.substring(0, id.indexOf('-'));
    let span = document.getElementById(`${id}-parent`);
    span.children[2].style.maxHeight = '100px';
    let newIcon = document.createElement('i');
    newIcon.className = SHOW_MORE_ICON_CLASS;
    newIcon.id = `${id}-icon`;
    newIcon.onclick = (e) => showHiddenText(e);
    let oldIcon = e.toElement;
    oldIcon.parentNode.replaceChild(newIcon, oldIcon);

    //add arrows
    let leftArrows= document.getElementsByClassName('leftArrow');
    let rightArrows = document.getElementsByClassName('rightArrow');
    for (var i = 0; i < leftArrows.length; i++) {
        if (leftArrows[i].id === id) leftArrows[i].style.display = '';
    }
    for (var i = 0; i < rightArrows.length; i++) {
        if(rightArrows[i].id === id) rightArrows[i].style.display = '';
    }
}

function textIsShown(span) {
    for (var i = 0; i < span.children.length; i++) {
        if (span.children[i].className === SHOW_LESS_ICON_CLASS) return true;
    }
    return false;
}

function removeAllTextConstraints(span, id) {
    let arr = span.children;
    span.children[2].style.marginBottom = '';
    for (var i = 0; i < arr.length; i++) {
        let curr = arr[i];
        if(curr.className === SHOW_MORE_ICON_CLASS || curr.className === SHOW_LESS_ICON_CLASS || curr.id === NEW_LINE_ID) {
            curr.parentNode.removeChild(curr);
        }
    }
    //add arrows
    let leftArrows= document.getElementsByClassName('leftArrow');
    let rightArrows = document.getElementsByClassName('rightArrow');
    for (var i = 0; i < leftArrows.length; i++) {
        if (leftArrows[i].id === id) leftArrows[i].style.display = '';
    }
    for (var i = 0; i < rightArrows.length; i++) {
        if(rightArrows[i].id === id) rightArrows[i].style.display = '';
    }
}

function checkMatch(text, entity, regex) {
    //replace with regex
    var first = text.toLowerCase();
    var second = entity.toLowerCase();
    if (first === second) {
        return true;
    }
    var matchArray = text.match(regex);
    if (!matchArray) return false;
    let previousCharacter = first[matchArray.index - 1];
    let nextCharacter = first[matchArray.index + matchArray[0].length];
    if (!previousCharacter && !nextCharacter) return true;
    return first.includes(second) && (!previousCharacter || !previousCharacter.match(/[a-z\-]/i)) && (!nextCharacter || !nextCharacter.match(/[a-z\-]/i));
}

function noNearbyTags(child, regex) {
    let previousChild = child;
    while(child.textContent && child.textContent.length < 300) {
        previousChild = child;
        child = child.parentElement;
    }
    if(!child.textContent) child = previousChild;
    if (child.textContent.length > 400) child == previousChild;
    if (child.nodeName[0] === '#') return true;
    let noMatches = true;
    let matchingTags = child.getElementsByClassName(ANCHOR_CLASS_NAME);
    if(!matchingTags) return true;
    for(var i = 0; i < matchingTags.length; i++) {
        let text = matchingTags[i].innerText || matchingTags[i].textContent;
        if (regex.test(text)) {
            noMatches = false;
            break;
        }
    }
    return noMatches;
}

function handleMouseMove(e) {
    const element = e.target;
    const elementParent = e.target.parentElement;
    if (element.className !== TOOL_TIP_CLASS_NAME && elementParent.className !== TOOL_TIP_CLASS_NAME
        && element.className !== ANCHOR_CLASS_NAME) {
        let spans = document.getElementsByClassName(TOOL_TIP_CLASS_NAME);
        for (var i = 0; i < spans.length; i++) {
            let id = spans[i].id;
            id = id.substring(0, id.indexOf('-'));
            removeSpan(id);
        }
        OPEN_SPAN = undefined;
    }
}

function proccessWikiData(items) {
    let itemsArray = [];
    for (var i = 0; i < items.length; i++) {
        let item = items[i];
        let wikilink = `https://en.wikipedia.org/?curid=${item.pageid}`
        let data = {'link': wikilink,'full_html': `<b>${item.title}</b>` + `<hr style="color:black"/><p class=${PARAGRAPH_CLASS_NAME}>` + (stripHtml(item.extract) || item.description) + `</p><i onclick="window.open('${wikilink}', '_blank');" class="inner-link">Wikimedia Foundation</i>`, 'title': item.title, 'content': (stripHtml(item.extract) || item.description)}
        if(data['content'] !== undefined) itemsArray.push(data);
    }
    return itemsArray;

}

const sleep = ms => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

function checkForSizeChange() {
    let allText = document.body.innerText;
    let prevTextLength = PREVIOUS_TEXT.length;
    if(allText.length > prevTextLength + 50) {
        let difference = getDifference(PREVIOUS_TEXT, allText);
        NEW_NODES = separateChildNodes(document.body.childNodes);
        PREVIOUS_TEXT = allText;
        makePostRequestOnScroll(difference);
    }
}

function makePostRequestOnScroll(text) {
    let data = {"blob": text, details: {sort: true, url: window.location.href}};
    fetchWebCheck(POST_URL,  {
        method: "POST",
        body: JSON.stringify({body: data}),
        headers: {
            'Content-Type': 'application/json',
    }}).then(res => {
        if(res.ok) {
            return res.json();
        } else {
            throw new Error(res.status);
        }
    }).then(data => {
        let body = JSON.parse(data.body);
        processEntities(body);

    }).catch(e => {
        //probably don't want to tell user when this happens
        //alert("Oops. Smething went wrong :(. Please try again. Error: " + e)
    });

}

function getDifference(a, b) {
    var i = 0;
    var j = 0;
    var result = "";
    
    while (j < b.length)
    {
        if (a[i] != b[j] || i == a.length)
            result += b[j];
        else
            i++;
        j++;
    }
    return result;
}

function separateChildNodes(newNodes) {
    let updatedNodes = [];
    newNodes.forEach(node => {
        if(node.className !== TOOL_TIP_CLASS_NAME) updatedNodes.push(node);
    });
    return updatedNodes;
}

function handleHighlightEnabling(result) {
    let isHighlightEnabled = result['highlight-enabled'];
    if(isHighlightEnabled || isHighlightEnabled === undefined) {
        document.body.addEventListener('mouseup', analyzeTextForSending);
        document.body.addEventListener("mousedown", checkAndRemoveSpans);
    }
}

function handleStorageChange(changes, namespace) {
    let change = changes['highlight-enabled']['newValue'];
    if (change) {
        document.body.addEventListener('mouseup', analyzeTextForSending);
        document.body.addEventListener("mousedown", checkAndRemoveSpans);
    } else {
        document.body.removeEventListener('mouseup', analyzeTextForSending);
        document.body.removeEventListener("mousedown", checkAndRemoveSpans);
    }
}
