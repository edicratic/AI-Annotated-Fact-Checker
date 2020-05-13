tooltipData = {}
sessionTimeStamp = undefined;
webcheckId = undefined;
tabSwitchTime = undefined;
startTime = undefined;

function startTimer(text, target) {
    let timeStamp = target.dataset['unique'];
    startTime = new Date();
    tooltipData = {
                    "term": text, 
                    "start": startTime, 
                    "url": window.location.href,
                    "session_type": timeStamp ? 'highlight' : 'webcheck',
                    "clicks": [],
                    "information_tab_time": 0,
                    "news_tab_time": 0,
                    "time_stamp": timeStamp ? new Date(parseInt(timeStamp)) : sessionTimeStamp,
                    "webcheck_id": timeStamp ? 0 : webcheckId,
    };

}

function handleShowMore(currentTab, linkOfArticle, type) {
    let text = type === 'Show More' ? 'show-more' : 'show-less';
    tooltipData['clicks'].push({
       'type': text,
       'url': linkOfArticle,
       'destination': currentTab,
       'source': currentTab, 
    });
}

function handleReadArticleProcess(currentTab, linkOfArticle) {
    tooltipData['clicks'].push({
        'type': 'read-article',
        'url': linkOfArticle,
        'destination': currentTab,
        'source': currentTab, 
     });
}

function handleTabSwitchProcesssing(previousTab, newTab) {
    determineTimeChange(previousTab);
    tooltipData['clicks'].push({
        'type': 'tab-switch',
        'url': 'TABSWITCH',
        'destination': newTab,
        'source': previousTab, 
     });
}

function determineTimeChange(tab) {
    let currentTime = new Date();
    let timePass = currentTime - (tabSwitchTime || startTime);
    tabSwitchTime = currentTime;
    let tabName = tab === 'Information' ? 'information_tab_time' : 'news_tab_time';
    tooltipData[tabName] += timePass;
}

function endTimer(tab) {
    if(!tooltipData['start'] || !tooltipData['time_stamp']) return;
    determineTimeChange(tab);
    let currentTime = new Date();
    let timeChange = currentTime - (tooltipData["start"] || 0);
    chrome.storage.local.get(['edicratic-information'], function(result) {
       let arr = result['edicratic-information'] || [];
       let newData = {
           'clicks': tooltipData['clicks'], /* Click data type {source, destination, type, url}*/
           'session_type': tooltipData['session_type'], /*highlight or webcheck*/
           'start': tooltipData['start'].getTime(), /*time of hover */
           'term': tooltipData['term'], /* entity*/
           'time_spent': timeChange, /*time spent on tooltip */
           'time_stamp': tooltipData['time_stamp'].getTime(), /*time of webcheck or highlight */
           'url': tooltipData['url'], /*webpage url */
           'webcheck_id': tooltipData['webcheck_id'],/*id of webcheck */
           "information_tab_time": tooltipData['information_tab_time'], /*time spent on wiki tab */
           "news_tab_time": tooltipData['news_tab_time'],/*time spent on news tab */
       };
       arr.push(newData);
       //uncomment to debug
       //console.log(arr);
       chrome.storage.local.set({'edicratic-information': arr}); /*array of hovers */

    });
}


function recordWebCheck(id) {
    webcheckId = id;
    sessionTimeStamp = new Date();
}

function invalidateInformation() {
    chrome.storage.local.get(["edicratic-information"], () => {
        //put endpoint here
        chrome.storage.local.set({'edicratic-information': []});

    })
}