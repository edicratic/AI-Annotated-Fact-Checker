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
    JSON_ARRAY.entites.forEach((obj) => {
        let {entity, link, data} = obj;
        html = document.body.innerHTML;
        var regex = new RegExp(entity, "gi");
        html = html.replace(regex, `<a class="${ANCHOR_CLASS_NAME}" data="${data}" href=${link}>${entity} <span class="${TOOL_TIP_CLASS_NAME}">${data}</span> </a>`);
        document.body.innerHTML = html;
    });
}