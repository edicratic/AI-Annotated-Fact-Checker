let changeColor = document.getElementById('changeColor');
changeColor.onclick = function(element) {
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
        var specTab = tabs[0];
        // document.getElementById("changeColor").style.diplay = "none";
        // document.getElementById("info").style.display = "";
        chrome.tabs.insertCSS(specTab.id, {file: 'tags.css'});
        chrome.tabs.insertCSS(specTab.id, {file: 'fontawesome.css'});
        chrome.tabs.insertCSS(specTab.id, {file: 'expandLibrary.css'});
        chrome.tabs.executeScript(specTab.id, {file: 'fontawesome.js'}, () => console.log("DONE"));
        chrome.tabs.executeScript(specTab.id, {file: 'expandLibrary.js'}, () => console.log("DONE"));
        chrome.tabs.executeScript(specTab.id, {file: 'tags.js'}, () => console.log("DONE"));
        window.close();
    });
};