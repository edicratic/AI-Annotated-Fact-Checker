MODAL = 'edicratic-modal'
MODAL_OPENED = 'MODAL_OPENED'
document.body.addEventListener('mousedown', checkForModalClose);
createModal();


function createModal() {
    if(!document.getElementById(MODAL)) {
        let div = document.createElement('div');
        div.className = 'modal';
        div.id = MODAL;
        div.innerHTML = `
            <span id="close-icon" class="close">&times;</span>
            <img id='logo-id' class="edicratic-logo">
            <h2 class="modal-header-2">Bug Report</h2>
            <hr/>
    <div class="modal-body">
        <textarea id="feedback-edicratic-text" placeholder="Please let us know what problems you are experiencing here." class="edicratic-textarea"></textarea>
        <p class="edicratic-text-style">Thank you for your feedback! Users like you motivate our developers.</p>
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

function handleFeedbackButtonClick() {
    let currentUrl = window.location.href;
    let textAreaFeedback = document.getElementById('feedback-edicratic-text');
    let text = textAreaFeedback.value;
    console.log(currentUrl);
    console.log(text);
    removeModal();
}

function removeModal() {
    let feedbackModal = document.getElementById(MODAL);
    feedbackModal.parentElement.removeChild(feedbackModal);
}

function checkForModalClose(e) {
    let elementFirst = e.target;
    if(!elementFirst) return;
    let parentElement = e.target.parentElement;
    if(!parentElement) return;
    if(parentElement.className !== 'modal-body' && parentElement.className !== 'modal' &&
    elementFirst.className !== 'modal-body' && elementFirst.className !== 'modal') {
        removeModal();
    }

}