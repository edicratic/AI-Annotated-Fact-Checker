ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'tooltip';
POST_URL = 'https://factcheck.edicratic.com/bycontents';

//addSemanticUI();
makePostRequest();
function init(data) {
    data.forEach((obj) => {
        let entity = Object.keys(obj)[0];
        let item = obj[entity][0];
        let data = `<b>${item.title}</b>` + '<hr style="color:black"/>' + (stripHtml(item.extract) || item.description);
        entity = removeNonAlphaNumeric(entity);
        let link = 'www.google.com';
        console.log(data);
        var regex = new RegExp(entity, "gi");
        let childList = document.body.children
        const set = new Set();
        modifyAllText(regex, link, entity, data, childList, set);
    });
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
                text = text.replace(regex, `<a class="${ANCHOR_CLASS_NAME}" href=${link}>${entity} <span class="${TOOL_TIP_CLASS_NAME}">${data}</span> </a>`);
                var newElement = document.createElement('a');
                newElement.innerHTML = text;
                child.appendChild(newElement);
                set.add(newElement);
                
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
    let data = {"blob": document.body.innerText.substring(0, 1000)};
    console.log(JSON.stringify(data));
    fetch(POST_URL, {
        method: "POST", 
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(res => res.json()).then(data => {
        console.log(data);
        const title = Object.keys(data[0])[0];
        console.log(title);
        console.log(data[0][title]);
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