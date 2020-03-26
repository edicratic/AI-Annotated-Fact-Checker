ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'tooltip';
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
        var regex = new RegExp(entity, "gi");
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
        if(!set.has(child) && child.className !== ANCHOR_CLASS_NAME) {
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
                child.appendChild(newElement);
                set.add(newElement);

                //create span
                var tooltip = document.createElement('span');
                tooltip.id = `${uniqueId}-parent`;
                tooltip.className = TOOL_TIP_CLASS_NAME;
                tooltip.innerHTML = `${data[0]['full_html']} <br/> <div id="${uniqueId}" class="leftArrow fa fa-arrow-left fa-3x"></div> <div id="${uniqueId}" class="rightArrow fa fa-arrow-right fa-3x"></div>`
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
    const span = document.getElementById(`${id}-parent`);
    console.log(`${id}-parent`);
    let x = e.clientX;
    let y = e.clientY;
    span.style.visibility = 'visible';
    span.style.left = `${x}px`;
    span.style.display = 'block';
    span.style.top = `${y}px`;

}

function makePostRequest() {
    const spinner = document.createElement('div');
    spinner.className = "loading";
    document.body.appendChild(spinner);
    // document.body.style.paddingTop = '80vh';
    // window.scrollTo(0, 150);
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
