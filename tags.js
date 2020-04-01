ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'edicratic-tooltip';
POST_URL = 'https://factcheck.edicratic.com/bycontents';
INNER_LINK = 'inner-link';
SHOW_MORE_ICON_CLASS = "show-more fa fa-angle-down fa-3x";
SHOW_LESS_ICON_CLASS = "show-more fa fa-angle-up fa-3x";
PARAGRAPH_CLASS_NAME = 'edicratic-paragraph-classname'
NEW_LINE_ID = "please-remove-me";
idToData = {};
onTop = {};

makePostRequest();
function init(data) {
    data.forEach((obj) => {
        let entity = Object.keys(obj)[0];
        let items = obj[entity];
        let itemsArray = [];
        for (var i = 0; i < items.length; i++) {
            let item = items[i];
            let data = {'link': item.wikilink,'full_html': `<b>${item.title}</b>` + `<hr style="color:black"/><p class=${PARAGRAPH_CLASS_NAME}>` + (stripHtml(item.extract) || item.description) + `</p><i onclick="window.open('${item.wikilink}', '_blank');" class="inner-link">Learn More Here</i>`, 'title': item.title, 'content': (stripHtml(item.extract) || item.description)}
            if(data['content'] !== undefined) itemsArray.push(data);
        }
        entity = removeNonAlphaNumeric(entity);
        let link = 'www.google.com';
        var regex = new RegExp(entity, "i");
        let childList = document.body.children
        const set = new Set();
        if(itemsArray.length > 0) modifyAllText(regex, link, entity, itemsArray, childList, set);
    });
    addListeners();
    preventSpanDefaultBehaviour();
    adjustSpansBasedOnHeight();
    document.body.onscroll = (e) => adjustSpansBasedOnHeight();
    document.body.onmouseup =(e) => analyzeTextForSending();
    document.body.onmousedown = (e) => removeHighlightedSpans();
}

function modifyAllText(regex, link, entity, data, childList, set) {
    for (var i = 0; i < childList.length; i++) {
        const child = childList[i];
        if(!set.has(child) && child.className !== ANCHOR_CLASS_NAME && child.className !== TOOL_TIP_CLASS_NAME) {
            set.add(child);
            const nextList = child.children;
            const length = nextList.length;
            var text = child.text || child.textContent;
            if (length === 0 && text !== "" && text !== undefined && text.toLowerCase().includes(entity.toLowerCase())) {
                child.innerText = "";
                var uniqueId = "d" + i + Math.floor(Math.random() * 1000000);
                text = text.replace(regex, `<div id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${text.match(regex)}</div>`);
                idToData[uniqueId] = [0, data]
                var newElement = document.createElement('div');
                newElement.style.display = "inline";
                newElement.innerHTML = text;
                newElement.onmouseover = (e) => mouseOverHandle(e, uniqueId);
                newElement.onmouseleave = (e) => handleMouseLeaveAnchor(e, uniqueId);
                child.appendChild(newElement);
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

            }
            if (length !== 0) {
                modifyAllText(regex, link, entity, data, nextList, set)
            }
    }
    }


}

function mouseMoveEvent(e) {
    var x = event.clientX, y = event.clientY,
    elementMouseIsOver = document.elementFromPoint(x, y);
    if (elementMouseIsOver.className !== ANCHOR_CLASS_NAME && elementMouseIsOver.className !== TOOL_TIP_CLASS_NAME
        && elementMouseIsOver.parentElement.className !== TOOL_TIP_CLASS_NAME && elementMouseIsOver.className !== INNER_LINK) {
        let spans = document.getElementsByClassName(TOOL_TIP_CLASS_NAME);
        for (var i = 0; i < spans.length; i++) {
            let id = spans[i].id;
            id = id.substring(0, id.indexOf('-'));
            removeSpan(id);
        }
    }
}

function mouseOverHandle(e, id) {
    if (e.target && e.target.id) {
        id = e.target.id;
        id = id.substring(0, id.indexOf('-'));
        const span = document.getElementById(`${id}-parent`);
        const anchor = document.getElementById(`${id}-parent-parent`);
        var positions = getPosition(anchor);
        let x = positions.x;
        let y = positions.y + anchor.clientHeight;
        span.style.visibility = 'visible';
        span.style.width = `${anchor.clientWidth}px`;
        span.style.left = `${x}px`;
        span.style.display = 'block';
        let expanded = textIsShown(span);

        let distance = getPosition(anchor).y - window.pageYOffset;
        if (distance <= span.clientHeight) {
            span.style.top = `${y}px`;
            onTop[id] = false;
            if(!expanded) {
                span.children[2].style.maxHeight = '100px';
                removeIconShowMore(span);
                if (isOverflown(span.children[2])) {
                    createIconShowMore(span);
                }
            } 
        } else {
            span.children[2].style.minHeight = '';
            span.style.top = `${y - anchor.clientHeight - span.clientHeight}px`;
            onTop[id] = true;
            span.children[2].style.maxHeight = '';
            removeAllTextConstraints(span, id);
        }
    }
}

function removeSpan(id) {
    const span = document.getElementById(`${id}-parent`);
    span.style.display = "none";
    span.style.visibility = 'hidden';
}

function handleMouseLeaveAnchor(e, id) {
    let newElement = e.toElement || e.relatedTarget;
    let children = e.target.children;
    let original = null;
    for (var i = 0; i < children.length; i++) {
        if (children[i].className === ANCHOR_CLASS_NAME) {
            original = children[i].id;
    }
    id = original.substring(0, original.indexOf('-'));

    if (newElement === null || newElement.id !== `${id}-parent`) removeSpan(id);
}
}

function isOverLap(span, anchor, x, y, id) {
    var left = span.style.left;
    var x_span = parseInt(left.substring(0, left.indexOf('p')));
    var top = span.style.top;
    var y_span = parseInt(top.substring(0, top.indexOf('p')));
    xOverLap = x >= x_span && x <= x_span + span.clientWidth + 10;
    yOverLap = !onTop[id] ? y >= y_span - 10 - window.pageYOffset && y <= y_span + span.clientHeight + 10 : y >= y_span - window.pageYOffset && y <= getPosition(anchor).y - window.pageYOffset;
    return xOverLap && yOverLap;

}

function makePostRequest() {
    const spinner = document.createElement('div');
    spinner.className = "loading";
    document.body.appendChild(spinner);
    let data = {"blob": document.body.innerText.substring(0, 1000)};
    console.log(JSON.stringify(data));
    fetch(POST_URL, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(res => res.json()).then(data => {
        spinner.style.display = "none";
        console.log(data);
        init(data);
    }).catch(e => console.log(e));

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
    span.children[indexOfLink].outerHTML = `<i onclick="window.open('${array[newIndex]['link']}', '_blank');" class="inner-link">Learn More Here</i>`
    //keep padding constant when on top
    removeIconShowMore(span);
    if (onTop[id]) {
        const anchor = document.getElementById(`${id}-parent-parent`);
        var positions = getPosition(anchor);
        let y = positions.y + anchor.clientHeight;
        span.style.top = `${y - anchor.clientHeight - span.clientHeight}px`;
        span.children[2].style.minHeight = '';

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
    const spans = document.getElementsByClassName(TOOL_TIP_CLASS_NAME);
    for (var i = 0; i < spans.length; i++) {
        const anchor = document.getElementById(`${spans[i].id}-parent`);
        if (anchor) {
            var positions = getPosition(anchor);
            let y = positions.y + anchor.clientHeight;
            let span = spans[i];
            let id = span.id;
            id = id.substring(0, id.indexOf('-'));
            let distance = getPosition(anchor).y - window.pageYOffset;
            let expanded = textIsShown(span);
            if (distance <= span.clientHeight) {
                span.style.top = `${y}px`;
                onTop[id] = false;
                if(!expanded) {
                    span.children[2].style.maxHeight = '100px';
                    removeIconShowMore(span);
                    if (isOverflown(span.children[2])) {
                        createIconShowMore(span);
                    }
                } 
            } else {
                span.children[2].style.minHeight = '';
                span.style.top = `${y - anchor.clientHeight - span.clientHeight}px`;
                onTop[id] = true;
                span.children[2].style.maxHeight = '';
                removeAllTextConstraints(span, id);
            }
         }
    }
}

function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while(element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
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
    let leftArrows= document.getElementsByClassName('leftArrow');
    let rightArrows = document.getElementsByClassName('rightArrow');
    for (var i = 0; i < leftArrows.length; i++) {
        if (leftArrows[i].id === id) leftArrows[i].style.display = 'none';
    }
    for (var i = 0; i < rightArrows.length; i++) {
        if(rightArrows[i].id === id) rightArrows[i].style.display = 'none';
    }

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
