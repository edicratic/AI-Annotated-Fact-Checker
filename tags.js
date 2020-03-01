JSON_ARRAY = {
    "entites": [
        {
            "entity": "Extension",
            "link": 'https://en.wikipedia.org/wiki/Extension',
            "data": "This is some bullshit data. This is some bullshit data. This is some bullshit data. This is some bullshit data.This is some bullshit data.This is some bullshit data.This is some bullshit data.This is some bullshit data."
        },
        {
            "entity": "Manifest",
            "link": "https://en.wikipedia.org/wiki/Manifest",
            "data": "Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020Trump 2020"
        }
    ]
};
ANCHOR_CLASS_NAME = 'edicratic-anchor-tag-style';
TOOL_TIP_CLASS_NAME = 'tooltip';
POST_URL = 'https://factcheck.edicratic.com/bycontents';

makePostRequest();
function init(data) {
    data.forEach((obj) => {
        let entity = Object.keys(obj)[0];
        let data = obj[entity][0].description;
        entity = removeNonAlphaNumeric(entity);
        let link = 'www.google.com';
        console.log(entity);
        var regex = new RegExp(entity, "gi");
        let childList = document.body.children
        const set = new Set();
        modifyAllText(regex, link, entity, data, childList, set);
        //document.body.innerHTML = document.body.innerHTML.replace(regex, `<a class="${ANCHOR_CLASS_NAME}" data="${data}" href=${link}>${entity} <span class="${TOOL_TIP_CLASS_NAME}">${data}</span> </a>`);
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
        if(!set.has(child)) {
            set.add(child);
            const nextList = child.children;
            const length = nextList.length;
            var text = child.text || child.textContent;
            if (length === 0 && text !== "" && text !== undefined && text.toLowerCase().includes(entity.toLowerCase())) {
                //console.log(child);
                child.innerText = "";
                text = text.replace(regex, `<a class="${ANCHOR_CLASS_NAME}" data="${data}" href=${link}>${entity} <span class="${TOOL_TIP_CLASS_NAME}">${data}</span> </a>`);
                var newElement = document.createElement('a');
                // console.log(newElement);
                newElement.innerHTML = text;
                child.appendChild(newElement);
                set.add(newElement);
                //child.classList.add(ANCHOR_CLASS_NAME);
                
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