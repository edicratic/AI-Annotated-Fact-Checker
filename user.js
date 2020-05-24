tooltipData = {}
sessionTimeStamp = undefined;
webcheckId = undefined;
tabSwitchTime = undefined;
startTime = undefined;
LOG_URL = "/log"

function startTimer(text, target) {
    let timeStamp = target.dataset['unique'];
    let dataType = target.dataset['type'];
    startTime = new Date();
    let sessionType = null;
    if (!dataType) {
        sessionType = 'highlight';
    } else {
        sessionType = dataType;
    }
    tooltipData = {
                    "term": text, 
                    "start": startTime, 
                    "url": window.location.href,
                    "session_type": sessionType,
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
    try {
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
    } catch(e) {
        handleUpdate(e.message);

    }
}


function recordWebCheck(id) {
    webcheckId = id;
    sessionTimeStamp = new Date();
}

function invalidateInformation() {
    chrome.storage.local.get(["edicratic-information"], (result) => {
        let arrayOfHovers = result['edicratic-information'];
        // console.log(arrayOfHovers);
        if(arrayOfHovers.length > 0){
            params = {
                method: "POST",
                body: JSON.stringify({
                    body: {
                        type: "Hover",
                        content: arrayOfHovers,
                    } 
                }),
                headers: {
                   'Content-Type': 'application/json',
               }
             }
            chrome.runtime.sendMessage({input: LOG_URL,params, message:"callWebCheckAPI"}, messageResponse => {
                const [response, error] = messageResponse;
                if (response === null) {
                    console.log(error);
                } else {
                    const body = response.body ?  new Blob([response.body]) : undefined;
                    chrome.storage.local.set({'edicratic-information': []});
                }
            });
        }
    })
}

function whitelistChange(type, list) {
    params = {
        method: "POST",
        body: JSON.stringify({
            body: {
                type: "Whitelist_Update",
                content: {
                    whitelist: list,
                    action: type
                },
            } 
        }),
        headers: {
           'Content-Type': 'application/json',
       }
     }
     chrome.runtime.sendMessage({input: LOG_URL,params, message:"callWebCheckAPI"}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
            console.log(error);

        } else {
            console.log('success');
        }
    });
}

function autoWebCheckChange(type, time) {
    params = {
        method: "POST",
        body: JSON.stringify({
            body: {
                type: "AutoWebCheckChange",
                content: JSON.stringify({
                    'type': type,
                    'time': time,
                }),
            } 
        }),
        headers: {
           'Content-Type': 'application/json',
       }
     }
     chrome.runtime.sendMessage({input: LOG_URL,params, message:"callWebCheckAPI"}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
            console.log(error);

        } else {
            console.log('success');
        }
});
}