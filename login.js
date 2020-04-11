let submitButton = document.getElementById("submit-button-edicraic");
submitButton.addEventListener("click",(e) => {
  e.preventDefault();
  let email = document.getElementById("edicratic-email").value;
  let password = document.getElementById("edicratic-password").value;
  let params = {
    email: email,
    password: password
  };
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://www.edicratic.com/api/auth/", true)
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.onreadystatechange = function () {
    console.log("hey")
    if(this.status == 200){
      res = JSON.parse(this.responseText);
      console.log("needs code for writing an error message");
      chrome.storage.local.set({"edicratic_user_info": res}, () => console.log("Value has been set"))
      document.body.innerHTML = `<object type="text/html" data="validPage.html"></object>`;
    }else {
      console.log("@Yukt Help?");
      console.log("needs code for writing an error message");
    }

  }
  xhr.send(JSON.stringify(params));

});
