LIST_TYPE = 'blacklisted-edicratic';
let current = [];
var myNodelist = document.getElementsByTagName("LI");
var i;
for (i = 0; i < myNodelist.length; i++) {
  var span = document.createElement("SPAN");
  var txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  myNodelist[i].appendChild(span);
}

//add all websites
chrome.storage.local.get([LIST_TYPE], function (result) {
    let websites = result[LIST_TYPE];
    current = websites;
    for(var i = 0; i < websites.length; i++) {

        newElement(websites[i].toLowerCase(), true);
    }
});

// Click on a close button to hide the current list item
var close = document.getElementsByClassName("close");
var i;
for (i = 0; i < close.length; i++) {
  close[i].onclick = function() {
    var div = this.parentElement;
    let text = div ? div.dataset['content'] : null;
    div.style.display = "none";
    //console.log(text.replace('.com', ''));
    if(!text) return;
    chrome.storage.local.get([LIST_TYPE], function (result) {
      let websites = result[LIST_TYPE];
      websites = websites.filter(value => value !== text.replace('.com', ''));
      chrome.storage.local.set(getStorageData(LIST_TYPE, websites));
  });
  }
}

// Add a "checked" symbol when clicking on a list item
var list = document.querySelector('ul');

var button = document.getElementById('addBtn-edicratic');
button.onclick = () => {
  let link = document.getElementById("myInput").value;
  if (isValidUrl(link)) {
    link = getDomain(link);
    newElement(link, false);
  } else if (isValidUrl('https://' + link)) {
    link = getDomain('https://' + link);
    newElement(link, false);
  } else if (isValidUrl('https://www.' + link)) {
    link = getDomain('https://www.' + link);
    newElement(link, false);
  } else if (isValidUrl('https://www.' + link + '.com')) {
    link = getDomain('https://www.' + link + '.com');
    newElement(link, false);
  } else if(isValidUrl('https://' + link + '.com')) {
    link = getDomain('https://' + link + '.com');
    newElement(link, false);
  } else {
    alert("Sorry, didn't catch that url");
  }
  
}



// Create a new list item when clicking on the "Add" button
function newElement(inputValue, initial) {
  if (inputValue === '') return;
  var li = document.createElement("li");
  var t = document.createTextNode(inputValue);
  li.setAttribute('data-content', inputValue);
  li.appendChild(t);
  document.getElementById("myUL").appendChild(li);
  document.getElementById("myInput").value = "";

  var span = document.createElement("SPAN");
  var txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  li.appendChild(span);
  if(!initial) {
    chrome.storage.local.get([LIST_TYPE], function (result) {
        let websites = result[LIST_TYPE];
        if(!websites.includes(inputValue)) {
          websites.push(inputValue);
        } else {
          alert('That seems to be saved already');
          li.parentElement.removeChild(li);
        }
        chrome.storage.local.set(getStorageData(LIST_TYPE, websites));
    });
}

  for (i = 0; i < close.length; i++) {
    close[i].onclick = function() {
      var div = this.parentElement;
      let text = div ? div.dataset['content'] : undefined;
      div.style.display = "none";
      //console.log(text);
      if(!text) return;
      chrome.storage.local.get([LIST_TYPE], function (result) {
        let websites = result[LIST_TYPE];
        websites = websites.filter(value => value !== text.replace('.com', ''));
        chrome.storage.local.set(getStorageData(LIST_TYPE, websites));
    });
      
    }
  }
}

function getDomain(url) {
  let anchor = document.createElement('a');
  anchor.href = url;
  var re = new RegExp('.(com|co.uk|net|org|gov|de|edu)')
  var secondLevelDomain = anchor.hostname.replace(re, '');
  return secondLevelDomain;
}

function isValidUrl(string) {
  try {
      var url = new URL(string);
      return url.hostname && url.hostname.match(/^([a-z0-9])(([a-z0-9-]{1,61})?[a-z0-9]{1})?(\.[a-z0-9](([a-z0-9-]{1,61})?[a-z0-9]{1})?)?(\.[a-zA-Z]{2,4})+$/) ? true : false;
  } catch (_) {
      return false;
  }
}

function getStorageData(key, value) {
  let storage = {};
  storage[key] = value;
  return storage;
}