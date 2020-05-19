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
chrome.storage.local.get(['whitelisted-edicratic'], function (result) {
    let websites = result['whitelisted-edicratic'];
    console.log(websites);
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
    console.log(text);
    if(!text) return;
    chrome.storage.local.get(['whitelisted-edicratic'], function (result) {
      let websites = result['whitelisted-edicratic'];
      websites = websites.filter(value => value !== text);
      chrome.storage.local.set({'whitelisted-edicratic': websites});
  });
  }
}

// Add a "checked" symbol when clicking on a list item
var list = document.querySelector('ul');
var button = document.getElementById('addBtn-edicratic');
button.onclick = () => newElement(document.getElementById("myInput").value, false);

// Create a new list item when clicking on the "Add" button
function newElement(inputValue, initial) {
  var li = document.createElement("li");
  var t = document.createTextNode(inputValue);
  li.setAttribute('data-content', inputValue);
  li.appendChild(t);
  if (inputValue === '') {
    alert("Please enter a domain name");
  } else {
    document.getElementById("myUL").appendChild(li);
  }
  document.getElementById("myInput").value = "";

  var span = document.createElement("SPAN");
  var txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  li.appendChild(span);
  if(!initial) {
    chrome.storage.local.get(['whitelisted-edicratic'], function (result) {
        let websites = result['whitelisted-edicratic'];
        websites.push(inputValue);
        chrome.storage.local.set({'whitelisted-edicratic': websites});
    });
}

  for (i = 0; i < close.length; i++) {
    close[i].onclick = function() {
      var div = this.parentElement;
      let text = div ? div.dataset['content'] : undefined;
      div.style.display = "none";
      console.log(text);
      if(!text) return;
      chrome.storage.local.get(['whitelisted-edicratic'], function (result) {
        let websites = result['whitelisted-edicratic'];
        websites = websites.filter(value => value !== text);
        chrome.storage.local.set({'whitelisted-edicratic': websites});
    });
      
    }
  }
}