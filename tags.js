var scriptAlreadyLoaded = true;
var cleared = false;
var timer;
ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
ANCHOR_OVERRIDE_CLASS_NAME = 'edicratic-anchor-tag-override';
TOOL_TIP_CLASS_NAME = 'edicratic-tooltip';
POST_URL = '/process';
INNER_LINK = 'edicratic-inner-link';
PARAGRAPH_CLASS_NAME = 'edicratic-paragraph-classname'
NEW_LINE_ID = "please-remove-me";
idToData = {};
idToTerm = {};
idToSelected = {};
onLeft = {};
onTop = {};
tooltips = {};
pointers = {};
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
GRAY_POINTER_CLASSNAME = 'edicratic-grey-pointer';
IMAGE_BELOW_TEXT = 'edicratic-image-below';
GOOGLE_SEARCH_IMAGE_META = 'og:image';
GOOGLE_SEARCH_DESCRIPTION_META = 'og:description';
WIKI_CLASS_NAME = 'edicratic-image';
ENTITY_PARENT_CLASSNAME = 'edicratic-entity-parent';

window.addEventListener('scroll', adjustSpansBasedOnHeight);

document.body.onmousemove = e => handleMouseMove(e);
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    if (request.message === "runWebCheck"){
        makePostRequest(request.automatic);
    } else if (request.message === 'removeAllHTML') {
        removeAllEdicraticHTML();
    }
    return true;
  });

function init(data, entity, automatic) {
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
    if(regex) modifyAllText(regex, entity, matches, NEW_NODES || childList, set, automatic);
}

async function modifySingleNode(node, text) {
    var url = getWikiUrl(text);
    var data;
    try {
        var result = await fetchWiki(url);
        data = await result.json();
    } catch(e) {
        console.log(e);
    }
    var regex = undefined;
    try {
        var regex = new RegExp(text);
    } catch(e) {
        console.log(e);
    }

    if(!node || !node.textContent || !data || !data.query || !data.query.pages || data.query.pages.length === 0 || !regex || !node.textContent.match(regex)) {
        //alert("Sorry, could not find a match for that :(. Try to highlight specific terms");
        document.body.classList.add('edicratic-red');
        return;
    }

    var pages = data.query.pages;
    var matches = getMatches(pages);
    var innerText = node.textContent;
    var uniqueId = "d3" + Math.floor(Math.random() * 1000000);
    idToTerm[uniqueId] = text;
    innerText = innerText.replace(text, `<div data-unique="${new Date().getTime()}" id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${text}</div>`);
    let itemsArray = proccessWikiData(matches, uniqueId);

    var newElement = document.createElement('div');
    newElement.style.display = "inline";
    newElement.className = ENTITY_PARENT_CLASSNAME;
    newElement.innerHTML = innerText;
    newElement.onmouseover = (e) => mouseOverHandle(e, uniqueId, text);
    newElement.onmouseleave = () => clearTimeout(timer);
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
    pointer.style.display = 'none';
    pointers[uniqueId] = pointer;

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
    idToSelected[uniqueId] = 'Information';
    tooltips[uniqueId] = tooltip;
    // addShowMoreListeners(uniqueId);
    tooltip.onclick = e => e.preventDefault();
    tooltip.onmouseleave = e => handleMouseLeave(e);
    testEndpoint(text, uniqueId);

    //rehighlight text
    let element = document.getElementById(`${uniqueId}-parent-parent`)
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
}

function addShowMoreListeners(id) {
    let tooltip = document.getElementById(`${id}-parent`);
    if (!tooltip) return;
    let showMoreLinks = tooltip.getElementsByClassName(SHOW_HIDDEN_TEXT);
    let images = tooltip.getElementsByClassName(IMAGE_NYT_CLASSNAME);
    let imagesWiki = tooltip.getElementsByClassName(WIKI_CLASS_NAME);
    let links = tooltip.getElementsByClassName(ENTITY_LINK_CLASS_NAME);
    for(var i = 0; i < images.length; i++) {
        images[i].onerror = (e) => {
            let br = document.createElement('br');
            if(e.target.parentElement) e.target.parentElement.replaceChild(br, e.target);
        };
    }
    for (var i = 0; i < imagesWiki.length; i++) {
        imagesWiki[i].onerror = (e) => {
            if(e.target.parentElement) {
                e.target.parentElement.removeChild(e.target);
            }
        }
    }
    for(var i = 0; i < showMoreLinks.length; i++) {
        showMoreLinks[i].onclick = (e) => showHiddenText(e, id);
    }
    for(var i = 0; i < links.length; i++) {
        links[i].onclick = (e) => handleArticleClick(e, id);
    }
}

function handleTabClick(e, id) {
    let tooltip = document.getElementById(`${id}-parent`);
    let tabs = document.getElementById(`${id}-tabs`);
    let currentTab = e.toElement;
    let tabChildren = tabs.children;
    var previousTabText = '';
    for(var i = 0; i < tabChildren.length; i++) {
        if (tabChildren[i].classList.contains('edicratic-selected')) {
            tabChildren[i].classList.remove('edicratic-selected');
            previousTabText = tabChildren[i].textContent || tabChildren[i].innerText;
        }
    }
    currentTab.classList.add('edicratic-selected');
    idToSelected[id] = currentTab.innerText || currentTab.textContent;
    handleTabSwitchProcesssing(previousTabText,idToSelected[id]);
    let tooltipChildren = tooltip.children;
    let index = 0;
    for(var i = 0; i < tooltipChildren.length; i++) {
        if(tooltipChildren[i].id === `${id}-content`) {
            index = i;
            let innerHTML = idToData[id][currentTab.textContent || currentTab.innerText];
            if(innerHTML && innerHTML !== ' ') {
                tooltipChildren[i].innerHTML = innerHTML;
            } else {
                tooltipChildren[i].innerHTML = `<h4>Most Recent News Articles</h4><hr/><div class="info-edicratic">Searching...</div>`;
            }

        }
    }
    addShowMoreListeners(id);
}

function updatePointerColor(id) {
    let pointer = document.getElementById(`${id}-pointer`);
    if(onLeft[id] && onTop[id] && idToSelected[id] === 'Information') {
        pointer.classList.add(GRAY_POINTER_CLASSNAME);
    } else if (onTop[id] && onLeft[id] === undefined && idToSelected[id] === 'News') {
        pointer.classList.add(GRAY_POINTER_CLASSNAME);
    } else {
        pointer.classList.remove(GRAY_POINTER_CLASSNAME);
    }
}

function modifyAllText(regex, entity, matches, childList, set, automatic) {
    for (var i = 0; i < childList.length; i++) {
        const child = childList[i];
        if(!set.has(child) && child.className !== ANCHOR_CLASS_NAME && child.className !== TOOL_TIP_CLASS_NAME && child.tagName !== 'NAV') {
            set.add(child);
            if(child.nodeName === '#comment' || child.nodeName === 'NOSCRIPT' || child.nodeName === 'IMG'
                || child.nodeName === 'SCRIPT' ||  child.nodeName === 'STYLE') continue;
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
                text = text.replace(regex, `<div data-type="${automatic ? 'whitelist_check' : 'webcheck'}" id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${text.match(regex)}</div>`);
                let data = proccessWikiData(matches, uniqueId);
                idToData[uniqueId] = {'Information': data};
                var newElement = document.createElement('div');
                newElement.className = ENTITY_PARENT_CLASSNAME;
                newElement.style.display = "inline";
                newElement.innerHTML = text;
                newElement.onmouseover = (e) => mouseOverHandle(e, uniqueId, entity);
                newElement.onmouseleave = () => clearTimeout(timer);
                if(child.nodeName !== "#text") {
                    child.appendChild(newElement);
                } else {
                    child.parentElement.replaceChild(newElement, child);
                }
                set.add(newElement);
                createTooltip(data, uniqueId, 'Information');
            }
            if (length !== 0) {
                modifyAllText(regex, entity, matches, nextList, set, automatic)
            }
    }
    }
}

function createTooltip(data, id, infoType) {
    var tooltip = document.createElement('span');
    tooltip.id = `${id}-parent`;
    tooltip.className = TOOL_TIP_CLASS_NAME;
    tooltip.innerHTML = `<div id=${id}-content> ${data}</div>`

    let pointer = document.createElement('div');
    pointer.className = 'edicratic-tooltip-bottom';
    pointer.style.display = 'none';
    pointer.id = `${id}-pointer`;
    // document.body.appendChild(pointer);
    pointers[id] = pointer;

    let tabs = document.createElement('div');
    tabs.className = 'edicratic-tabContainer';
    tabs.id =`${id}-tabs`;
    tabs.innerHTML = `
        <a class="edicratic-tab ${infoType === 'Information' ? 'edicratic-selected' : ''}">Information</a>
        <a class="edicratic-tab ${infoType === 'News' ? 'edicratic-selected' : ''}">News</a>
    `
    tooltip.appendChild(tabs);
    idToSelected[id] = infoType;

    let tabChildren = tabs.children;
    for (var i = 0; i < tabChildren.length; i++) {
        tabChildren[i].onclick = (e) => handleTabClick(e, id);
    }

    // document.body.prepend(tooltip)
    // addShowMoreListeners(id);
    tooltip.onclick = e => e.preventDefault();
    tooltip.onmouseleave = e => handleMouseLeave(e);
    tooltips[id] = tooltip;

}

function handleMouseLeave(e) {
    clearTimeout(timer);
    let orginalId = e.target ? e.target.id || undefined : undefined;
    if(orginalId) removeSpan(orginalId.substring(0, orginalId.indexOf('-')));

}

async function mouseOverHandle(e, id, text) {
    if (cleared && !e.target.dataset['unique']) return;
    if (e.target && e.target.id) {
        id = e.target.id;
        id = id.substring(0, id.indexOf('-'));
        let entityElement = document.getElementById(`${id}-parent-parent`);
        if(entityElement) {
            startTimer(entityElement.textContent || entityElement.innerText, e.target);
            if(entityElement.dataset['unique']) entityElement.style.marginBottom = '0px';
        }
        if (OPEN_SPAN) {
            removeSpan(OPEN_SPAN);
        }
        let isHighlightLookup = !!entityElement.dataset['unique'];
        let type = idToSelected[id] || 'Information';
        let tooltip = tooltips[id];
        let pointer = pointers[id];
        if(!tooltip || !pointer) return;
        clearTimeout(timer);
        if (!idToData[id]['News'] && text && !isHighlightLookup) {
                idToData[id]['News'] = ' ';
                testEndpoint(text, id);
        }
        timer = setTimeout(async function() {
            OPEN_SPAN = id;
            document.body.prepend(tooltip);
            document.body.appendChild(pointer);
            addShowMoreListeners(id);
            positionTooltips(id);
        }, 500); 
    }
    e.preventDefault();
    e.stopPropagation();
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
    let spanWidth = 400;
    span.style.width = `${spanWidth}px`
    let pointer = document.getElementById(`${id}-pointer`);
    pointer.style.display = 'block';
    
    let distanceLeft = anchor.getBoundingClientRect().left;
    let distanceRight = window.innerWidth - anchor.clientWidth - distanceLeft;
    let halfWidth = span.clientWidth / 2;
    let pointerDistance = x - spanWidth / 2 + anchor.clientWidth / 2 + 
    span.clientWidth / 2;
    if(halfWidth > distanceLeft) {
        onLeft[id] = true;
        span.style.left = `${x + anchor.clientWidth / 2 - TOOL_TIP_POINTER_HEIGHT}px`;
        pointer.style.left = `${pointerDistance + 1}px`;

    } else if (halfWidth > distanceRight) {
        onLeft[id] = false;
        span.style.left = `${x - spanWidth + anchor.clientWidth / 2 + TOOL_TIP_POINTER_HEIGHT}px`;
        pointer.style.left = `${pointerDistance - 1}px`;

    } else {
        onLeft[id] = undefined;
        span.style.left = `${x - spanWidth / 2 + anchor.clientWidth / 2}px`;
        pointer.style.left = `${pointerDistance}px`;
    }

    let top = anchor.getBoundingClientRect().top;
    let bottom = window.innerHeight - top;
    if (top <= bottom) {
        span.style.top = `${y + anchor.clientHeight + TOOL_TIP_POINTER_HEIGHT}px`;
        onTop[id] = false;
        pointer.style.bottom = `${window.innerHeight - span.offsetTop - 3}px`
        pointer.classList.remove(ARROW_UP_CLASSNAME);
        pointer.classList.add(ARROW_DOWN_CLASSNAME);
    } else {
        span.style.top = `${y - span.clientHeight - TOOL_TIP_POINTER_HEIGHT}px`;
        onTop[id] = true;
        pointer.style.top = `${y - TOOL_TIP_POINTER_HEIGHT - 3}px`
        pointer.classList.remove(ARROW_DOWN_CLASSNAME);
        pointer.classList.add(ARROW_UP_CLASSNAME);
    }
    //updatePointerColor(id);
}

function removeSpan(id) {
    const span = document.getElementById(`${id}-parent`);
    if(OPEN_SPAN === id) OPEN_SPAN = undefined;
    if(!span) return;
    const pointer = document.getElementById(`${id}-pointer`);
    span.parentElement.removeChild(span);
    pointer.parentElement.removeChild(pointer);
    endTimer(idToSelected[id]);
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

function handleArticleClick(e, id) {
    let dataset = e.target.dataset;
    let category = dataset['category'];
    let url = dataset['url'];
    handleReadArticleProcess(category, url);
    removeSpan(id);
    window.open(url, '_blank');
}

async function testEndpoint(term, id) {
    // console.log(term);
    let content = `<h4>Most Recent News Articles</h4><hr/><div class="info-edicratic">`;
    var str;
    try {
        let resultNYTimes = await fetchNewYorkTimes(term);
        let dataNYTimes = await resultNYTimes.text();
        str = await new window.DOMParser().parseFromString(dataNYTimes, "text/xml");
    } catch(e) {
        handleUpdate(e.message);
        return;
    }

    let items = str.querySelectorAll("item");
    if(!items || items.length === 0) {
        idToData[id]['News'] =  `<h4>Most Recent News Articles</h4><hr/><div class="info-edicratic">No Results Found</div>`;
        let tooltipField = document.getElementById(`${id}-content`);
        if(idToSelected[id] === 'News') tooltipField.innerHTML = `<h4>Most Recent News Articles</h4><hr/><div class="info-edicratic">No Results Found</div>`
        return;
    }
    items = Array.prototype.slice.call(items, 0).slice(0, 6);
    items.sort((a, b) => {
        let element1 = a.getElementsByTagName('pubDate')[0];
        let element2 = b.getElementsByTagName('pubDate')[0];
        let date1 = element1 ? element1 .textContent : null;
        let date2 = element2 ? element2.textContent : null;
        return date1 && date2 ? new Date(date2) - new Date(date1) : 0;
    });
    let numArticles = 5;
    for(var i = 0; i < items.length && i < numArticles; i++) {
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
        if(url === window.location.href) {
            numArticles++;
            continue;
        }
        if(title && url && date) {
            let data;
            let res;
            try {
                res = await extractMetaData(url);
                data = await res.json();
            } catch(e) {
                console.log(e.message)
                continue;
            }
            let source = data.source;
            let updatedId = `${Math.floor(Math.random() * 1000000)}` + id;
            let empty = data.description === 'EMPTY';
            let dateString = new Date(date).toDateString();
            let newElement = `<b class="${stripHtml(ENTITY_HEADER)}">${title}</b><br/><i>${dateString}</i><p class=${PARAGRAPH_CLASS_NAME}>`
            + (source ? `<img id="${updatedId}-image" onError="this.parentElement.removeChild(this);" src="${source}" class="${IMAGE_BELOW_TEXT}"/>` : ``) + `<span style="display: none" id="${updatedId}-hidden">` + 
            (source ? `<img onError="this.parentElement.removeChild(this);" ${empty ? 'style="width:100%; height:100%;margin-bottom: 1rem;"' : ''}class='edicratic-image-nyt' src="${source}"/>` : ``)  +
            `${!empty ? stripHtml(data.description) : ''}`
            + `${empty ? '' : '<br/><br/>'}</span></p>` +
            (empty ? `` : `<a data-url="${url}" id="${updatedId}"class="${INNER_LINK} ${SHOW_HIDDEN_TEXT}">Show More</a><br/><br/>`) +
            `<a data-category="News" data-url="${url}"class="${ENTITY_LINK_CLASS_NAME}">Read Article</a><br/><br/>`
       
            content += newElement;
            if(idToSelected[id] === 'News') {
                let tooltipField = document.getElementById(`${id}-content`);
                if(i === 0) {
                    if(tooltipField) tooltipField.getElementsByClassName('info-edicratic')[0].innerHTML = newElement;
                } else {
                    if(tooltipField) tooltipField.getElementsByClassName('info-edicratic')[0].innerHTML += newElement;
                }
                addShowMoreListeners(id);
            }
            idToData[id]['News'] = content;
        }
    }
    idToData[id]['News'] = content;
}

function extractMetaData(url) {
    return new Promise((resolve, reject ) => {
        getWebUrl(url).then(res => {
            if (res.status === 200){
                return res.text();
            }else{
                // console.log(res.statusText);
                reject(new Error(res.statusText));
            }
        }).then(data => {
            let el = document.createElement('div');
            el.innerHTML = data;
            let metaTags = el.getElementsByTagName('meta');
            var description = "EMPTY";
            var image = '';
            for (var i = 0; i < metaTags.length; i++) {
                let tag = metaTags[i];
                let property = tag.getAttribute('property');
                let name = tag.getAttribute('name');
                if (property === GOOGLE_SEARCH_DESCRIPTION_META
                || name === GOOGLE_SEARCH_DESCRIPTION_META) {
                    description = tag.content;
                } else if (property === GOOGLE_SEARCH_IMAGE_META
                    || name === GOOGLE_SEARCH_IMAGE_META) {
                    image = tag.content;
                }
            }
            let source = image && image.includes('https') ? image : '';
            body = JSON.stringify({description, source});
            resolve(new Response(body, {
                status: 200,
            }));
        }).catch(err => {reject(err)});
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

function makePostRequest(isAutomatic) {
    if (cleared) {
        cleared = false;
        handleClearedEvent();
    }
    PREVIOUS_TEXT = document.body.innerText;
    window.addEventListener('scroll', checkForSizeChange);
    var spinner;
    if(!isAutomatic) {
        spinner = document.createElement('div');
        spinner.classList.add('loading-edicratic');
        document.body.appendChild(spinner);
    } else {
        currentWebCheckedUrl = window.location.href;
    }
    invalidateInformation();
    let data = {"blob": document.body.innerText.substring(0, 50000), details: {sort: true, url: window.location.href}};
    fetchWebCheck(POST_URL,  {
                      method: "POST",
                      body: JSON.stringify({body: data}),
                      headers: {
                          'Content-Type': 'application/json',
    }}).then(result => {
        if (result.ok) {
            return result.json();
        } else {
            throw new Error(result.status);
        }
    }).then(data =>{
        chrome.runtime.sendMessage({data: 'hasHTML'});
        if(!isAutomatic && spinner) spinner.style.display = 'none';
        recordWebCheck(data.local_id || 'NO_ID');
        body = JSON.parse(data.body);
        processEntities(body, isAutomatic);
        if(!isAutomatic) chrome.runtime.sendMessage({data: DATA_LOADED});
    }).catch(e => {
        handleUpdate(e.message);
        console.log(e);
        if(!isAutomatic && spinner) spinner.style.display = 'none';
        alert("Oops. Something went wrong :(. Please try again." + "\nIf your issue is persistent, go to webcheck.edicratic.com/support.html for help.");
    });
}

async function processEntities(entities, isAutomatic) {
   for (var i = 0; i < entities.length; i++) {
       lookUpTerm(entities[i].entity, isAutomatic);
       await sleep(10);
       if (i === 199) await sleep(1000);
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

function showHiddenText(e, tooltipId) {
    let id = e.target.id;
    let hiddenText = document.getElementById(`${id}-hidden`);
    let hiddenImage = document.getElementById(`${id}-image`);
    let type = e.target.textContent || e.target.innerText;
    if (hiddenText.style.display === 'none') {
        e.target.textContent = 'Show Less';
        hiddenText.style.display = 'inline';
        if(hiddenImage) hiddenImage.style.display = 'none';
    } else {
        e.target.textContent = 'Show More';
        hiddenText.style.display = 'none';
        if(hiddenImage) hiddenImage.style.display = 'inline';
    }
    handleShowMore(idToSelected[tooltipId], e.target.dataset['url'], type);
}

function checkMatch(text, entity, regex) {
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
        clearTimeout(timer);
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
        let visibleArray = words.slice(0, 20);
        let hiddenArray = words.slice(20);
        let modiifiedId = 't' + `${i}` + id + `${Math.floor(Math.random() * 1000000)}`;
        content += `<b class="${ENTITY_HEADER}">${item.title}:</b><p class=${PARAGRAPH_CLASS_NAME}>`
        + (item.thumbnail ? `<img class='edicratic-image' src="${item.thumbnail.source}"/>` : ``) +
        `${visibleArray.join(' ')}<span id="${modiifiedId}-show-more-hidden" style="display: none">
        ${hiddenArray.join(' ')} <br/><br/>` + `<a class="${ENTITY_LINK_CLASS_NAME}" data-url="${wikilink}"
        data-category="Information">Learn More</a></span></p>
        <a data-url="${wikilink}" id="${modiifiedId}-show-more" class="${INNER_LINK} ${SHOW_HIDDEN_TEXT}">Show More</a><br/><br/>`
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
    if(allText.length > prevTextLength + 200) {
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

function removeAllEdicraticHTML() {
    cleared = true;
    window.removeEventListener('scroll', checkForSizeChange);
    let entities = document.getElementsByClassName(ANCHOR_CLASS_NAME);
    for(var i = 0; i < entities.length; i++) {
        entities[i].classList.add(ANCHOR_OVERRIDE_CLASS_NAME);
    }
}

function handleClearedEvent() {
    let entities = document.getElementsByClassName(ANCHOR_CLASS_NAME);
    for (var i = 0; i < entities.length; i++) {
        entities[i].classList.remove(ANCHOR_OVERRIDE_CLASS_NAME);
    }
}
