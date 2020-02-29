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
CLASS_NAME = 'edicratic-anchor-tag-style';
INLINE_STYLES = `
border-bottom: 5px solid #15c39a;
padding-bottom: 0px;
color: black;
background-color:#FFFF00;
`

manuallyAttachCSS();
init();
function init() {
    JSON_ARRAY.entites.forEach((obj) => {
        let {entity, link, data} = obj;
        html = document.body.innerHTML;
        var regex = new RegExp(entity, "gi");
        html = html.replace(regex, `<a style="${INLINE_STYLES}" class="${CLASS_NAME}" data="${data}" href=${link}>${entity}</a>`);
        document.body.innerHTML = html;
    });
}

function manuallyAttachCSS() {
    var head = document.getElementsByTagName('HEAD')[0];  
  
        // Create new link Element 
        var link = document.createElement('link'); 
  
        // set the attributes for link element  
        link.rel = 'stylesheet';  
      
        link.type = 'text/css'; 
      
        link.href = 'tags.css';  
  
        // Append link element to HTML head 
        head.appendChild(link); 
}