const urlSearchParams = new URLSearchParams(window.location.search);
var gameId = urlSearchParams.get("game");
var userName = "";
var userMapping = {};
var userList = [];
if(gameId) {
  document.getElementById("gameIdInput").value = gameId;
} else {
  document.getElementById("game").style.display = "none";
  document.getElementById("homepage").style.display = "block";
  document.getElementById("gameIdInput").value = "game" + Math.floor(Math.random(1000) * 1000);
  document.getElementById("userIdInput").value = "user" + Math.floor(Math.random(1000) * 1000);
}

function onClickJoin() {
  const gameName = document.getElementById("gameIdInput").value || gameId;
  gameId = gameName;
  userName = document.getElementById("userIdInput").value || "user1"
  history.pushState({game: gameName}, "title 1", `?game=${gameName}`);
  console.log(history.state);
  document.getElementById("homepage").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("game").style.display = "none";
  signInToFirebase();    
  var userListFromFb = {};
  function onUserListChange(data) {
    userListFromFb = data;
    console.log("userlistlistener", data);
    userList = [];
    for(let key in userListFromFb) {
      let user = userListFromFb[key];
      userList.push(user);
      if(!userMapping[user.displayName]) {
        const userListElement = document.getElementById("userlist");
        const newListItem = document.createElement("li");
        newListItem.appendChild(document.createTextNode(user.displayName));
        userListElement.appendChild(newListItem);
        userMapping[user.displayName] = user.uid;
      }
      if(Object.keys(userListFromFb).length === 1 && user.displayName === displayName) {
        isAdmin = true;
        document.getElementById("start").disabled = false;
        setAdminInFirebase({
          uid: uid,
          displayName: displayName
        });
        setCurrentlyDrawingUserInFirebase({
          uid: uid,
          displayName: displayName
        });
        setGameStateInFirebase("lobby");
      }
    }
    if(!isAdmin) {
      function onGameStateChange(data) {
        if(data === "started") {
          startGame();
        }
      }
      listenToFirebaseValueChange(GAME_STATE, onGameStateChange);
    }
  }
  listenToFirebaseValueChange(USERS, onUserListChange);
}

function onClickStart() {
  startGame();
  if(isAdmin) {
    setGameStateInFirebase("started");
  }
}

function startGame() {
  document.getElementById("homepage").style.display = "none";
  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
  document.getElementById("userlist2").innerHTML = "";
  for(let i = 0; i < userList.length; i++) {
    let user = userList[i];
    const userListElement = document.getElementById("userlist2");
    const newListItem = document.createElement("li");
    newListItem.id = user.displayName;
    if(i === userList.length - 1) {
      newListItem.classList.add("highlighted")
    }
    newListItem.appendChild(document.createTextNode(user.displayName));
    userListElement.appendChild(newListItem);
  }
  listenToFirebaseChanges();
}

function onClickStop() {
  history.back();
  console.log(history.state);
  document.getElementById("game").style.display = "none";
  document.getElementById("lobby").style.display = "none";
  document.getElementById("homepage").style.display = "block";
}

function onClickGuess(e) {
  let guessValue = document.getElementById("guess").value;
  if(guessValue.trim().toLowerCase() === correctWord.toLowerCase()) {
    document.getElementById("guessResponse").innerText = "You guessed it!";
    document.getElementById("guess").disabled = true;

    //push guessed user
    pushGuessedUserInFirebase({
      uid: uid,
      displayName: displayName
    });

    // update current user score
    updateCurrentUserScoreInFirebase(score + 10);
  } else {
    document.getElementById("guessResponse").innerText = "Try again"
    guessValue = "";
  }
}

function endGame() {
  let overlay = document.getElementById("overlay");
  let overlayText = document.getElementById("overlayText");
  overlay.classList.remove("hidden");

  function displayGameOverAndScores(data) {
    let userListFromFb = data;
    let userList = [];
    let userListText = "";
    for(let key in userListFromFb) {
      let user = userListFromFb[key];
      userList.push(user);
    }

    userList.sort((firstUser, secondUser) => (
      secondUser.score - firstUser.score
    ));
    for(let user of userList) {
      userListText +=  `${user.displayName}: ${user.score} \n`;
    }

    overlayText.innerText = `Game over!\n\n ${userListText}`;
  }

  listenToFirebaseValueChange(USERS, displayGameOverAndScores);
}
