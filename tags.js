ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'edicratic-tooltip';
POST_URL = 'https://factcheck.edicratic.com/bycontents';
idToData = {};

//addFontAwesome();
makePostRequest();
function init(data) {
    data.forEach((obj) => {
        let entity = Object.keys(obj)[0];
        let items = obj[entity];
        let itemsArray = [];
        for (var i = 0; i < items.length; i++) {
            let item = items[i];
            let data = {'link': item.wikilink,'full_html': `<b>${item.title}</b>` + '<hr style="color:black"/><p>' + (stripHtml(item.extract) || item.description) + `<br/><br/><i onclick="window.open('${item.wikilink}', '_blank');" class="inner-link">Learn More Here</i></p>`, 'title': item.title, 'content': (stripHtml(item.extract) || item.description)}
            itemsArray.push(data);
        }
        entity = removeNonAlphaNumeric(entity);
        let link = 'www.google.com';
        var regex = new RegExp(entity, "i");
        let childList = document.body.children
        const set = new Set();
        modifyAllText(regex, link, entity, itemsArray, childList, set);
    });
    addListeners();
    preventSpanDefaultBehaviour();
    //adjustSpansBasedOnHeight();
    //document.body.onscroll = (e) => adjustSpansBasedOnHeight();
}

function modifyAllText(regex, link, entity, data, childList, set) {
    /*
        var p = document.getElementById(parentId);
    var newElement = document.createElement(elementTag);
    newElement.setAttribute('id', elementId);
    newElement.innerHTML = html;
    p.appendChild(newElement);
     */
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
                text = text.replace(regex, `<div id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${entity}</div>`);
                idToData[uniqueId] = [0, data]
                var newElement = document.createElement('div');
                newElement.innerHTML = text;
                newElement.onmouseover = (e) => mouseOverHandle(e, uniqueId);
                newElement.onmouseleave = (e) => handleMouseLeaveAnchor(e, uniqueId);
                child.appendChild(newElement);
                set.add(newElement);

                //create span
                var tooltip = document.createElement('span');
                tooltip.id = `${uniqueId}-parent`;
                tooltip.className = TOOL_TIP_CLASS_NAME;
                tooltip.innerHTML = `${data[0]['full_html']} <br/> <div id="${uniqueId}" class="leftArrow fa fa-arrow-left fa-3x"></div> <div id="${uniqueId}" class="rightArrow fa fa-arrow-right fa-3x"></div>`
                tooltip.onmouseleave = (e) => {
                    if(e.target) {
                        let id = e.target.id;
                        console.log(e.target.clientHeight);
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

function mouseOverHandle(e, id) {
    if (e.target) {
        id = e.target.id;
        id = id.substring(0, id.indexOf('-'));
        const span = document.getElementById(`${id}-parent`);
        const anchor = document.getElementById(`${id}-parent-parent`);
        var positions = getPosition(anchor);
        let x = positions.x;
        let y = positions.y + anchor.clientHeight + 5;
        span.style.visibility = 'visible';
        span.style.width = `${anchor.clientWidth}px`;
        span.style.left = `${x}px`;
        span.style.display = 'block';
        console.log(span.clientHeight);
        console.log(y);

        if (y <= span.clientHeight) {
            span.style.top = `${y - anchor.clientHeight - span.clientHeight}px`;
        } else {
            span.style.top = `${y}px`;
        }
    }
}

function removeSpan(id) {
    const span = document.getElementById(`${id}-parent`);
    span.style.display = "none";
    span.style.visibility = 'hidden';
}

function handleMouseLeaveAnchor(e, id) {
    const span = document.getElementById(`${id}-parent`);
    const anchor = document.getElementById(`${id}-parent-parent`);
    if (!isOverLap(span, anchor, e.clientX, e.clientY)) removeSpan(id);
}

function isOverLap(span, anchor, x, y) {
    var left = span.style.left;
    var x_span = parseInt(left.substring(0, left.indexOf('p')));
    var top = span.style.top;
    var y_span = parseInt(top.substring(0, top.indexOf('p')));
    xOverLap = x >= x_span && x <= x_span + span.clientWidth + 10;
    yOverLap = y >= y_span - 10 - window.pageYOffset && y_span <= y_span + span.clientHeight + 10;
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
    const entry = idToData[id];
    var previousIndex = entry[0];
    var array = entry[1];
    var newIndex = isLeft ? previousIndex === 0 ? array.length - 1 : previousIndex - 1 : ((previousIndex + 1) % array.length);
    idToData[id][0] = newIndex;
    const span = document.getElementById(`${id}-parent`);
    const isBottom = span.style.top === '100%';
    const height = span.children[2].clientHeight;
    span.children[0].innerHTML = array[newIndex]['title']
    span.children[2].innerHTML = array[newIndex]['content'] + `<br/><br/> <i onclick="window.open('${array[newIndex]['link']}', '_blank');" class="inner-link">Learn More Here</i>`
    if (isBottom) {
        span.children[2].style.minHeight = `${height}px`;
    } else {
        span.children[2].style.minHeight = '';
    }
    span.scrollTop = 0;
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
        const aTag = document.getElementById(`${spans[i].id}-parent`);
        if (aTag) {
            if ((aTag.offsetTop <= spans[i].clientHeight) || aTag.getBoundingClientRect().top <= spans[i].clientHeight) {
                spans[i].style.bottom = '';
                spans[i].style.top = '100%';

            } else {
                spans[i].style.bottom = '100%';
                spans[i].style.top = '';
                spans[i].children[2].style.minHeight = '';

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
