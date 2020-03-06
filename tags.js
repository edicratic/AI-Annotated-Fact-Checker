ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'tooltip';
POST_URL = 'https://factcheck.edicratic.com/bycontents';
idToData = {};

//addSemanticUI();
makePostRequest();
function init(data) {
    data.forEach((obj) => {
        let entity = Object.keys(obj)[0];
        let items = obj[entity];
        let itemsArray = [];
        for (var i = 0; i < items.length; i++) {
            let item = items[i];
            let data = {'link': item.wikilink,'full_html': `<b>${item.title}</b>` + '<hr style="color:black"/><p>' + (stripHtml(item.extract) || item.description) + '</p>', 'title': item.title, 'content': (stripHtml(item.extract) || item.description)}
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
                var uniqueId = "a" + i + Math.floor(Math.random() * 1000000);
                text = text.replace(regex, `<a target="_blank" href=${data[0]['link']} id="${uniqueId}-parent-parent" class="${ANCHOR_CLASS_NAME}">${entity} <span id="${uniqueId}-parent" class="${TOOL_TIP_CLASS_NAME}">${data[0]['full_html']} <br/> <img id="${uniqueId}" class="leftArrow" src="https://cdn2.iconfinder.com/data/icons/picons-basic-2/57/basic2-289_arrow_left-128.png"/> <img id="${uniqueId}" class="rightArrow" src="https://cdn2.iconfinder.com/data/icons/picons-basic-2/57/basic2-290_arrow_right-128.png"/> </span> </a>`);
                idToData[uniqueId] = [0, data]
                var newElement = document.createElement('a');
                newElement.innerHTML = text;
                child.appendChild(newElement);
                set.add(newElement);
                const anchor = document.getElementById(`${uniqueId}-parent`);
                console.log(anchor);
                anchor.onclick = e => e.preventDefault();
                
            }
            if (length !== 0) {
                modifyAllText(regex, link, entity, data, nextList, set)
            }
    }
    }

    
}

function removeTagsWithEntities() {
    const possibleTags = ['a', 'p', 'h1', 'h2', 'h3', 'h4', 'div', 'img', 'span']
    let tags = [];
    possibleTags.forEach((tag) => {
        tags = tags.concat(document.getElementsByTagName(tag));
    });
    for (var i = 0; i < tags.length; i++) {
        const subArray = tags[i];
            for (var j = 0; j < subArray.length; j++) {
                let currentTag = subArray[j];
                JSON_ARRAY.entites.forEach((obj) => {
                    if (currentTag.href && currentTag.href.toLowerCase().includes(obj.entity.toLowerCase())) currentTag.href = '';
                    if (currentTag.id && currentTag.id.toLowerCase().includes(obj.entity.toLowerCase())) currentTag.id = '';
                });
        }
    }
}

function makePostRequest() {
    const spinner = document.createElement('div');
    spinner.className = "loading";
    document.body.appendChild(spinner);
    document.body.style.paddingTop = '45vh';
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

function addSemanticUI() {
    var head = document.getElementsByTagName('HEAD')[0]; 
    
    //add css
    var link = document.createElement('link'); 
    link.rel = 'stylesheet';  
    link.type = 'text/css'; 
    link.href = 'https://cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css';  
    head.appendChild(link);

    //add js
    var jsLink = document.createElement('script');
    jsLink.src = 'https://cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.js';
    head.appendChild(jsLink);
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
    span.children[0].innerHTML = array[newIndex]['title']
    span.children[2].innerHTML = array[newIndex]['content']
    span.scrollTop = 0;
    const anchorTag = document.getElementById(`${id}-parent-parent`);
    anchorTag.href = array[newIndex]['link'];
}