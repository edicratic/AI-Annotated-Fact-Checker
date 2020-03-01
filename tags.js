JSON_ARRAY = {
    "entites": [
        {
            "entity": "Extensions",
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

init();
function init() {
    removeTagsWithEntities();
    JSON_ARRAY.entites.forEach((obj) => {
        let {entity, link, data} = obj;
        var regex = new RegExp(entity, "gi");
        //let childList = document.body.children
        //const set = new Set();
        // modifyAllText(regex, link, entity, data, childList, set);
        document.body.innerHTML = document.body.innerHTML.replace(regex, `<a class="${ANCHOR_CLASS_NAME}" data="${data}" href=${link}>${entity} <span class="${TOOL_TIP_CLASS_NAME}">${data}</span> </a>`);
    });
}

function modifyAllText(regex, link, entity, data, childList, set) {
    for (var i = 0; i < childList.length; i++) {
        const child = childList[i];
        if(!set.has(child)) {
            set.add(child);
            const nextList = child.children;
            var text = child.text || child.textContent;
            console.log(text);
            if (text !== "" && text !== undefined) {
                text = text.replace(regex, `<a class="${ANCHOR_CLASS_NAME}" data="${data}" href=${link}>${entity} <span class="${TOOL_TIP_CLASS_NAME}">${data}</span> </a>`);
                child.outerHTML = text;
            }
            if (nextList.length !== 0) {
                modifyAllText(regex, link, entity, data, nextList)
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