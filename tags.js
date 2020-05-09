ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'edicratic-tooltip';
POST_URL = '/process';
INNER_LINK = 'inner-link';
PARAGRAPH_CLASS_NAME = 'edicratic-paragraph-classname'
NEW_LINE_ID = "please-remove-me";
idToData = {};
idToTerm = {};
onTop = {};
OPEN_SPAN = undefined;
DATA_LOADED = 'DATA_LOADED'
BUTTON_PRESSED = 'BUTTON_PRESSED';
PREVIOUS_TEXT = "";
NEW_NODES = null;
TOOL_TIP_POINTER_HEIGHT = 12;
ARROW_UP_CLASSNAME = 'edicratic-tooltip-bottom-rightsideup';
ARROW_DOWN_CLASSNAME = 'edicratic-tooltip-bottom-upsidedown'
TAB_CONTAINER_CLASS_NAME = 'edicratic-tabContainer';
INDIVIDUAL_TAB_CLASS_NAME = 'edicratic-tab';
SHOW_HIDDEN_TEXT = 'edicratic-show-hidden';
ENTITY_HEADER = 'edicratic-entity-header'
ENTITY_LINK_CLASS_NAME = 'edicratic-entity-link';
IMAGE_NYT_CLASSNAME = 'edicratic-image-nyt';

window.addEventListener('scroll', adjustSpansBasedOnHeight);

chrome.storage.local.get(["highlight-enabled"], result => handleHighlightEnabling(result));
chrome.storage.onChanged.addListener((changes, namespace) => handleStorageChange(changes, namespace));


document.body.onmousemove = e => handleMouseMove(e);
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    if (request.message === "runWebCheck"){
        console.log('received');
        //window.addEventListener('scroll', checkForSizeChange);
        makePostRequest(request);
    }
  });

function init(data, entity) {
    var pages = data.query.pages;
    var matches = getMatches(pages);
    var regex = undefined;
    try {
        var regex = new RegExp(entity, "i");
    } catch(e) {
        console.log(e);
    }
    let childList = document.body.childNodes;
    const set = new Set();
    if(regex) modifyAllText(regex, entity, matches, NEW_NODES || childList, set);
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
    var innerText = node.textContent;
    var uniqueId = "d3" + Math.floor(Math.random() * 1000000);
    idToTerm[uniqueId] = text;
    innerText = innerText.replace(text, `<div id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${text}</div>`);
    let itemsArray = proccessWikiData(matches, uniqueId);

    var newElement = document.createElement('div');
    newElement.style.display = "inline";
    newElement.innerHTML = innerText;
    newElement.onmouseover = (e) => mouseOverHandle(e, uniqueId);
    node.parentElement.replaceChild(newElement, node);

    var tooltip = document.createElement('span');
    tooltip.id = `${uniqueId}-parent`;
    tooltip.className = TOOL_TIP_CLASS_NAME;
    tooltip.innerHTML = `<div id=${uniqueId}-content> ${itemsArray}</div>`

    //add data
    idToData[uniqueId] = {'Information': itemsArray};

    //create pointer
    let pointer = document.createElement('div');
    pointer.className = 'edicratic-tooltip-bottom';
    pointer.id = `${uniqueId}-pointer`;
    document.body.appendChild(pointer);

    let tabs = document.createElement('div');
    tabs.className = 'edicratic-tabContainer';
    tabs.id =`${uniqueId}-tabs`;
    tabs.innerHTML = `
        <a class="edicratic-tab edicratic-selected">Information</a>
        <a class="edicratic-tab">News</a>
    `
    tooltip.appendChild(tabs);
    //TODO write onclick method
    let tabChildren = tabs.children;
    for (var i = 0; i < tabChildren.length; i++) {
        tabChildren[i].onclick = (e) => handleTabClick(e, uniqueId);
    }



    
    tooltip.onmouseleave = (e) => {
        if(e.target) {
            let id = e.target.id;
            id = id.substring(0, id.indexOf('-'));
            //removeSpan(id);
        }
    }
    document.body.prepend(tooltip)
    addShowMoreListeners(uniqueId);
    tooltip.onclick = e => e.preventDefault();
    testEndpoint(text, uniqueId);
}

async function addNewYorkTimesData(id, term) {
    let resultNYTimes = await fetchNewYorkTimes(term);
    let dataNYTimes = await resultNYTimes.json();
    let NYTimesContent = processNYTimes(dataNYTimes, id);
    idToData[id]['News'] = NYTimesContent;
    addShowMoreListeners(id);
}

function addShowMoreListeners(id) {
    let tooltip = document.getElementById(`${id}-parent`);
    let showMoreLinks = tooltip.getElementsByClassName(SHOW_HIDDEN_TEXT);
    let images = tooltip.getElementsByClassName(IMAGE_NYT_CLASSNAME);
    for(var i = 0; i < images.length; i++) {
        images[i].onerror = (e) => {
            let br = document.createElement('br');
            e.target.parentElement.replaceChild(br, e.target);
        };
    }
    for(var i = 0; i < showMoreLinks.length; i++) {
        showMoreLinks[i].onclick = (e) => showHiddenText(e);
    }
}

function handleTabClick(e, id) {
    let tooltip = document.getElementById(`${id}-parent`);
    let tabs = document.getElementById(`${id}-tabs`);
    let currentTab = e.toElement;
    let tabChildren = tabs.children;
    for(var i = 0; i < tabChildren.length; i++) {
        if (tabChildren[i].classList.contains('edicratic-selected')) {
            tabChildren[i].classList.remove('edicratic-selected');
        }
    }
    currentTab.classList.add('edicratic-selected');
    let tooltipChildren = tooltip.children;
    let index = 0;
    for(var i = 0; i < tooltipChildren.length; i++) {
        if(tooltipChildren[i].id === `${id}-content`) {
            index = i;
            let innerHTML = idToData[id][currentTab.textContent || currentTab.innerText];
            if(innerHTML) {
                tooltipChildren[i].innerHTML = innerHTML;
            } else {
                tooltipChildren[i].innerHTML = `<h4>News Articles From Today</h4><hr/><div class="info-edicratic">Searching...</div>`;
                testEndpoint(idToTerm[id], id, tooltipChildren[index]);
            }

        }
    }
    addShowMoreListeners(id);
}

function processNYTimes(data, id) {
    if(!data || !data.response || !data.response.docs || data.response.docs.length === 0) {
        let tabs = document.getElementById(`${id}-tabs`);
        let tabChildren = tabs.children;
        for (var i = 0; i < tabChildren.length; i++) {
            if(tabChildren[i].textContent === 'News') {
                tabChildren[i].parentElement.removeChild(tabChildren[i]);
                return;
            }
        }
    }
        let articles = data.response.docs;
        let content = `<h4>News Articles From Today</h4><hr/><div class="info-edicratic">`;
        for (var i = 0; i < articles.length; i++) {
            //TODO sort by category. add author attribution
            let article = articles[i];
            let link = article.web_url;
            let title = article.headline.main;
            let pageDescription = article.abstract;
            let firstParagraph = article.lead_paragraph;
            let updatedId = `${Math.floor(Math.random() * 1000000)}` + id + `${i}`;
            let imageSource = article.multimedia && article.multimedia[0] && article.multimedia[0].url ?
            `https://www.nytimes.com/${article.multimedia[0].url}` : undefined;
            content += `<b class="${ENTITY_HEADER}">${title}:</b><p class=${PARAGRAPH_CLASS_NAME}>
            ${pageDescription}<span style="display: none" id="${updatedId}-hidden">
            <br/><br/>${firstParagraph} <br/><br/>` + (imageSource ? `<img class='edicratic-image-nyt' src="${imageSource}"/><br/><br/>` : ``) 
            + `<a class="${ENTITY_LINK_CLASS_NAME}" onclick="window.open('${link}', '_blank')">Read Article</a></span></p>
            <a id="${updatedId}"class="inner-link ${SHOW_HIDDEN_TEXT}">Show More</a><br/><br/>`
        }
        return content + '</div>';
}

function modifyAllText(regex, entity, matches, childList, set) {
    for (var i = 0; i < childList.length; i++) {
        const child = childList[i];
        if(!set.has(child) && child.className !== ANCHOR_CLASS_NAME && child.className !== TOOL_TIP_CLASS_NAME && child.tagName !== 'NAV') {
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
                idToTerm[uniqueId] = entity;
                text = text.replace(regex, `<div id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${text.match(regex)}</div>`);
                let data = proccessWikiData(matches, uniqueId);
                idToData[uniqueId] = {'Information': data};
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
                createTooltip(data, uniqueId);
                //testEndpoint(entity,uniqueId);
            }
            if (length !== 0) {
                modifyAllText(regex, entity, matches, nextList, set)
            }
    }
    }
}

function createTooltip(data, id) {
    var tooltip = document.createElement('span');
    tooltip.id = `${id}-parent`;
    tooltip.className = TOOL_TIP_CLASS_NAME;
    tooltip.innerHTML = `<div id=${id}-content> ${data}</div>`

    let pointer = document.createElement('div');
    pointer.className = 'edicratic-tooltip-bottom';
    pointer.id = `${id}-pointer`;
    document.body.appendChild(pointer);

    let tabs = document.createElement('div');
    tabs.className = 'edicratic-tabContainer';
    tabs.id =`${id}-tabs`;
    tabs.innerHTML = `
        <a class="edicratic-tab edicratic-selected">Information</a>
        <a class="edicratic-tab">News</a>
    `
    tooltip.appendChild(tabs);

    let tabChildren = tabs.children;
    for (var i = 0; i < tabChildren.length; i++) {
        tabChildren[i].onclick = (e) => handleTabClick(e, id);
    }

    document.body.prepend(tooltip)
    addShowMoreListeners(id);
    tooltip.onclick = e => e.preventDefault();

}

function mouseOverHandle(e, id) {
    if (e.target && e.target.id) {
        id = e.target.id;
        id = id.substring(0, id.indexOf('-'));
        if (OPEN_SPAN) {
            removeSpan(OPEN_SPAN);
        }
        OPEN_SPAN = id;
        positionTooltips(id);
    }
}

function positionTooltips(id) {
    const span = document.getElementById(`${id}-parent`);
    const anchor = document.getElementById(`${id}-parent-parent`);
    let x = anchor.getBoundingClientRect().left + window.pageXOffset;
    let y = anchor.getBoundingClientRect().top + window.pageYOffset;
    span.style.visibility = 'visible';
    span.style.display = 'block';
    let anchorRight = anchor.getBoundingClientRect().right;
    let anchorLeft = anchor.getBoundingClientRect().left;
    let spanWidth = (Math.min(anchorRight + anchorLeft) / 2, 400);
    span.style.width = `${spanWidth}px`
    let pointer = document.getElementById(`${id}-pointer`);
    pointer.style.display = 'block';
    
    let distanceLeft = anchor.getBoundingClientRect().left;
    let distanceRight = window.innerWidth - anchor.clientWidth - distanceLeft;
    let halfWidth = span.clientWidth / 2;
    if(halfWidth > distanceLeft) {
        span.style.left = `${x + anchor.clientWidth / 2 - TOOL_TIP_POINTER_HEIGHT}px`;

    } else if (halfWidth > distanceRight) {
        span.style.left = `${x - spanWidth + anchor.clientWidth / 2 + TOOL_TIP_POINTER_HEIGHT}px`;

    } else {
        span.style.left = `${x - spanWidth / 2 + anchor.clientWidth / 2}px`;
    }

    pointer.style.left = `${x - spanWidth / 2 + anchor.clientWidth / 2 + 
        span.clientWidth / 2}px`;



    let top = anchor.getBoundingClientRect().top;
    let bottom = window.innerHeight - top;
    if (top <= bottom) {
        span.style.top = `${y + anchor.clientHeight + TOOL_TIP_POINTER_HEIGHT}px`;
        onTop[id] = false;
        pointer.style.bottom = `${window.innerHeight - span.offsetTop}px`
        pointer.classList.remove(ARROW_UP_CLASSNAME);
        pointer.classList.add(ARROW_DOWN_CLASSNAME);
    } else {
        span.style.top = `${y - span.clientHeight - TOOL_TIP_POINTER_HEIGHT}px`;
        onTop[id] = true;
        pointer.style.top = `${y - TOOL_TIP_POINTER_HEIGHT}px`
        pointer.classList.remove(ARROW_DOWN_CLASSNAME);
        pointer.classList.add(ARROW_UP_CLASSNAME);
    }
}

function removeSpan(id) {
    const span = document.getElementById(`${id}-parent`);
    span.style.display = "none";
    span.style.visibility = 'hidden';
    const pointer = document.getElementById(`${id}-pointer`);
    pointer.style.display = 'none';
}

function fetchWebCheck(input, params) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({input,params, message: "callWebCheckAPI", needsAuthHeaders: true}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
          reject(error);
        } else {
          // Use undefined on a 204 - No Content
          //TODO @ Yukt halp??
          //response = JSON.parse(response.body);
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

  //TODO rename NYTimes method and endpoint method

async function testEndpoint(term, id, tooltipField) {
    await sleep(10);
    let content = `<h4>Most Recent News Articles</h4><hr/><div class="info-edicratic">`;
    if (tooltipField) tooltipField.innerHTML = content + 'Searching...</div>';
    let resultNYTimes = await fetchNewYorkTimes(term);
    let dataNYTimes = await resultNYTimes.text();
    let str = await new window.DOMParser().parseFromString(dataNYTimes, "text/xml");
    const items = str.querySelectorAll("item");
    for(var i = 0; i < items.length && i < 5; i++) {
        let item = items[i];
        let children = item.children;
        let title = null;
        let url = null;
        let date = null;
        for(var j = 0; j < children.length; j++) {
            if(children[j].tagName === 'title') {
                title = children[j].innerText || children[j].textContent;
            } else if(children[j].tagName === 'link') {
                url = children[j].innerText || children[j].textContent;
            } else if (children[j].tagName === 'pubDate') {
                date = children[j].innerText || children[j].textContent;
            }
        }
        if(title && url && date) {
            let res = await extractMetaData(url);
            let data = await res.json();
            let source = data.source;
            let updatedId = `${Math.floor(Math.random() * 1000000)}` + id;
            let empty = data.description === 'EMPTY';
            console.log(empty);

            let newElement = `<b class="${ENTITY_HEADER}">${title}:</b><p class=${PARAGRAPH_CLASS_NAME}>
            <span style="display: none" id="${updatedId}-hidden">` + 
            (source ? `<img ${empty ? 'style="width:100%; height:100%;margin-bottom: 1rem;"' : ''}class='edicratic-image-nyt' src="${source}"/>` : ``)  +
            `${!empty ? data.description : ''}`
            + `<br/><br/><a class="${ENTITY_LINK_CLASS_NAME}" onclick="window.open('${url}', '_blank')">Read Article</a></span></p>
            <a id="${updatedId}"class="inner-link ${SHOW_HIDDEN_TEXT}">Show More</a><br/><br/>`
            content += newElement;
            if(tooltipField) {
                if(i === 0) {
                    tooltipField.getElementsByClassName('info-edicratic')[0].innerHTML = newElement;
                } else {
                    tooltipField.getElementsByClassName('info-edicratic')[0].innerHTML += newElement;
                }
                addShowMoreListeners(id);
            }
            idToData[id]['News'] = content;
        }
        await sleep(10);
    }
    idToData[id]['News'] = content;
}

function extractMetaData(url) {
    return new Promise((resolve, reject ) => {
        getWebUrl(url).then(res => res.text()).then(data => {
            let el = document.createElement('div');
            el.innerHTML = data;
            let metaTags = el.getElementsByTagName('meta');
            let images = el.getElementsByTagName('img');
            var description = "";
            var image;
            for (var i = 0; i < metaTags.length; i++) {
                let content = metaTags[i].content;
                if(content && content.length >= description.length && !content.includes('http') 
                && !content.includes('://') && content.split(",").length < 5 && !content.includes('{')) {
                    description = metaTags[i].content;
                }
            }
            for (var i = 0; i < images.length; i++) {
                let currentImage = images[i];
                if(!image || currentImage.clientWidth * currentImage.clientHeight > image.clientWidth * image.clientHeight) {
                    image = currentImage;
                }
            }
            if(!description || description.length < 100) {
                description = 'EMPTY';
            }
            let source = image ? image.src : '';
            body = JSON.stringify({description, source});
            resolve(new Response(body, {
                status: 200,
            }));
        });
    });

}

function getWebUrl(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({message: 'basicGET', url}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
          reject(error);
        } else {
          const body = response.body ? new Blob([response.body]) : undefined;
          resolve(new Response(body, {
            status: response.status,
            statusText: response.statusText,
          }));
        }
      });
    })
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
        if (result.ok) {
            return result.json();
        } else {
            console.log(result);
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

function stripHtml(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

function adjustSpansBasedOnHeight() {
    if(OPEN_SPAN) {
        positionTooltips(OPEN_SPAN);
    }
}

function showHiddenText(e) {
    let id = e.target.id;
    let hiddenText = document.getElementById(`${id}-hidden`);
    let image = hiddenText.getElementsByClassName(IMAGE_NYT_CLASSNAME)[0];
    let newLines = hiddenText.getElementsByClassName('image-newline');
    if(image && image.naturalWidth * image.naturalHeight < 200) {
        image.parentElement.removeChild(image);
        for (var i = 0; i < newLines.length; i++) {
            newLines[i].parentElement.removeChild(newLines[i]);
        }
    }
    if (hiddenText.style.display === 'none') {
        e.target.textContent = 'Show Less';
        hiddenText.style.display = 'inline';
    } else {
        e.target.textContent = 'Show More';
        hiddenText.style.display = 'none';
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
    if (!OPEN_SPAN) return;
    let anchor = document.getElementById(`${OPEN_SPAN}-parent-parent`)
    if (invalidPosition(anchor, e, OPEN_SPAN)) {
        let spans = document.getElementsByClassName(TOOL_TIP_CLASS_NAME);
        for (var i = 0; i < spans.length; i++) {
            let id = spans[i].id;
            id = id.substring(0, id.indexOf('-'));
            removeSpan(id);
        }
        OPEN_SPAN = undefined;
    }
}

function invalidPosition(anchor, e, OPEN_SPAN) {
    let target = e.target;
    let parent = e.target.parentElement;
    let top = anchor.getBoundingClientRect().top;
    let bottom = top + anchor.clientHeight;
    return invalidPositionHelper(target) &&
    !(onTop[OPEN_SPAN] ? e.clientY > top - 20 && e.clientY < top + 20 : e.clientY > bottom - 20 && e.clientY < bottom + 20);
}

function invalidPositionHelper(element) {
    for(let i = 0; i < 10; i++) {
        if(!element) {
            return true;
        } else if(element.className === TOOL_TIP_CLASS_NAME || element.className === ANCHOR_CLASS_NAME) {
            return false;
        } else {
            element = element.parentElement;

        }
    }
    return true;
}

function proccessWikiData(items, id) {
    let content = `<h4>Wiki Articles</h4><hr/><div class="info-edicratic">`;
    for (var i = 0; i < items.length; i++) {
        let item = items[i];
        let wikilink = `https://en.wikipedia.org/?curid=${item.pageid}`
        let pageDescription = stripHtml(item.extract) || item.description;
        if (!pageDescription) continue;
        let words = pageDescription.split(' ');
        let visibleArray = words.slice(0, 10);
        let hiddenArray = words.slice(10);
        let modiifiedId = 't' + `${i}` + id + `${Math.floor(Math.random() * 1000000)}`;
        content += `<b class="${ENTITY_HEADER}">${item.title}:</b><p class=${PARAGRAPH_CLASS_NAME}>
        ${visibleArray.join(' ')}<span id="${modiifiedId}-show-more-hidden" style="display: none">
        ${hiddenArray.join(' ')} <br/><br/>` + (item.thumbnail ? `<img class='edicratic-image' src="${item.thumbnail.source}"/><br/><br/>` : ``) 
        + `<a class="${ENTITY_LINK_CLASS_NAME}" onclick="window.open('${wikilink}', '_blank')">Learn More</a></span></p>
        <a id="${modiifiedId}-show-more" class="inner-link ${SHOW_HIDDEN_TEXT}">Show More</a><br/><br/>`
    }
    return content + '</div>';

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
