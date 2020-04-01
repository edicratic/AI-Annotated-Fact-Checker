EDICRATIC_HIGHLIGHTED_TEXT_CLASS = 'edicratic-highlighted-text-class'
TOOL_TIP_CLASSNAME = 'edicratic-add-library-tooltip'
TOOL_TIP_TEXT_CLASSNAME = 'tooltiptext';
CHECK_CLASS_NAME = 'fa fa-check fa-2x edicratic-yes';
X_CLASS_NAME = 'fa fa-times fa-2x edicratic-no';

function analyzeTextForSending() {
    if(!window.getSelection) return;
    if(window.getSelection().toString() === '') return;
    const range = window.getSelection().getRangeAt(0);
    let text = window.getSelection().toString();
    if (range.startOffset === range.endOffset) return;
    if (text.length > 30) return;
    const selectedText = range.extractContents();
    const span = document.createElement('span');
    span.className = EDICRATIC_HIGHLIGHTED_TEXT_CLASS;
    span.appendChild(selectedText);
    range.insertNode(span);

    let tooltip = document.createElement('span');
    tooltip.className = TOOL_TIP_CLASSNAME;
    tooltip.innerHTML = `<p class="${TOOL_TIP_TEXT_CLASSNAME}">Would you like to add this entity to our library?<br/><br/><i class="${X_CLASS_NAME}"></i><i class="${CHECK_CLASS_NAME}"></i></p>`
    tooltip.setAttribute('data-content', text);
    tooltip.style.width = `${span.clientWidth}px`
    tooltip.style.top = `${window.pageYOffset + span.getBoundingClientRect().top -span.clientHeight - 10}px`;
    tooltip.style.left = `${span.getBoundingClientRect().left - text.length}px`
    document.body.prepend(tooltip);
    let x = document.getElementsByClassName(X_CLASS_NAME)[0];
    let check = document.getElementsByClassName(CHECK_CLASS_NAME)[0];
    console.log(x);
    console.log(check);
    x.onclick = (e) => {
        console.log('click');
        e.preventDefault();
        clearSelection();
        removeHighlightedSpans()
    };
    check.onclick = (e) => {
        console.log('click');
        e.preventDefault();
        clearSelection();
        removeHighlightedSpans();
    }
}

function removeHighlightedSpans() {
    window.getSelection().removeAllRanges();
    remove(document.getElementsByClassName(TOOL_TIP_CLASSNAME));
}

function remove(collection) {
    for (var i = 0; i < collection.length; i++) {
        collection[i].parentNode.removeChild(collection[i]);
    }
}

function clearSelection() {
    console.log("removing");
    window.getSelection().removeAllRanges();
}