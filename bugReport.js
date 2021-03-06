MODAL = 'edicratic-modal'
LOG_URL = "/reporting"
MODAL_OPENED = 'MODAL_OPENED'
document.body.addEventListener('mousedown', checkForModalClose);


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      // console.log(request);
      if (request.message === "bugReport"){
        //if auth set to true in local storage
            createModal();
            //TODO check Auth
            //alert("Please log in to report a bug");
      }
      return true;
  });



function createModal() {
    // console.log("creating a modal");
    if(!document.getElementById(MODAL)) {
        let div = document.createElement('div');
        div.className = 'edicratic-modal';
        div.id = MODAL;
        div.innerHTML = `
            <span id="close-icon" class="edicratic-close">&times;</span>
            <img id='logo-id' class="edicratic-logo">
            <h2 class="edicratic-modal-header-2">Bug Report</h2>
            <hr/>
    <div class="modal-body-edicratic">
        <textarea id="feedback-edicratic-text" placeholder="Enter feedback here..." class="edicratic-textarea"></textarea>
        <h4 class="edicratic-text-style">Thank you for your feedback! Users like you motivate our developers.</h4>
        <div id="edicratic-feedback-button" class="edicratic-button">Submit Report</div>
        <br/>
    </div>
    `
    var imgURL = chrome.extension.getURL("/images/logo48.png");
    //sdiv.style.bottom = `${dist - window.innerHeight / 2}px`
    chrome.runtime.sendMessage({
        data: MODAL_OPENED,
    });
    document.body.appendChild(div);
    document.getElementById('logo-id').src = imgURL;
    let feedbackButton = document.getElementById('edicratic-feedback-button');
    let close = document.getElementById('close-icon');
    feedbackButton.onclick = () => handleFeedbackButtonClick();
    close.onclick = () => removeModal();
}

}

function sendLog(url, body) {
    return new Promise((resolve, reject) => {
      params = {
                method: "POST",
                body: JSON.stringify({body: body}),
                headers: {
                   'Content-Type': 'application/json',
               }
             }
      chrome.runtime.sendMessage({input: url,params, message:"callWebCheckAPI", needsAuthHeaders: true}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
          reject(error);
        } else {
          const body = response.body ?  new Blob([response.body]) : undefined;
          resolve(new Response(body, {
            status: response.status,
            statusText: response.statusText,
          }));
        }
      });
    });
  }

function handleFeedbackButtonClick() {
    let currentUrl = window.location.href;
    let textAreaFeedback = document.getElementById('feedback-edicratic-text');
    let text = textAreaFeedback.value;
    params = {type: "Feedback", content: text, url: currentUrl};
    sendLog(LOG_URL, params);
    removeModal();
}

function removeModal() {
    let feedbackModal = document.getElementById(MODAL);
    feedbackModal.parentElement.removeChild(feedbackModal);
    document.body.removeEventListener('mousedown', checkForModalClose);
}

function checkForModalClose(e) {
    let elementFirst = e.target;
    if(!elementFirst) return;
    let parentElement = e.target.parentElement;
    if(!parentElement) return;
    if(parentElement.className !== 'modal-body-edicratic' && parentElement.className !== 'edicratic-modal' &&
    elementFirst.className !== 'modal-body-edicratic' && elementFirst.className !== 'edicratic-modal') {
        removeModal();
    }

}
