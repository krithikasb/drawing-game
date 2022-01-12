const DRAWING_INTERVAL = 50;
const PAUSE_INTERVAL = 3;
const ROUNDS = 3;

var currentlyDrawingUser = {};
var correctWord;
var guesses = 0;
var currentRoundNumber = 1;

function onCurrentlyDrawingUserChange(data) {
  if(currentlyDrawingUser.uid === data.uid) {
    return;
  }
  currentlyDrawingUser = data;
  console.log("currentlyDrawingUser", data, currentlyDrawingUser.displayName, uid, currentlyDrawingUser.uid)
  
  // disable drawing for all users, show message saying nextUser's turncontext.clearRect(0, 0, 800, 600);
  let overlay = document.getElementById("overlay");
  let overlayText = document.getElementById("overlayText");
  let wordElement = document.getElementById("word");
  wordElement.classList.add("hidden");
  context.clearRect(0, 0, 800, 600);
  overlay.classList.remove("hidden");
  overlayText.innerText = "";

  document.getElementById("guessResponse").innerText = "";
  document.getElementById("guess").value = "";
  document.getElementById("guess").disabled = false;
  resetGuessedUsersInFirebase();
  if(uid !== currentlyDrawingUser.uid) {
    overlayText.innerText = `${currentlyDrawingUser.displayName}'s turn`;
    // add guess box
    document.getElementById("guessBox").classList.remove("hidden");
  } else {
    let word = WORDS[Math.floor(Math.random(WORDS.length) * WORDS.length)]
    overlayText.innerText = `Your turn!\n Your word is: ${word}`;
    setWordInFirebase(word);

    document.getElementById("guessBox").classList.add("hidden");
  }

  setTimeout(() => {
    let overlay = document.getElementById("overlay");
    overlay.classList.add("hidden");
    wordElement.classList.remove("hidden");
    context.clearRect(0, 0, 800, 600);

    let childNodes = document.getElementById("userlist2").childNodes;
    for(let node of childNodes) {
      node.classList.remove("guessed");
    }

    let remainingSeconds = DRAWING_INTERVAL;
    let timerElement = document.getElementById("timer");

    timerElement.innerText = remainingSeconds;
    function tick() {
      setTimeout(() => {
        remainingSeconds -= 1;
        console.log(remainingSeconds, guesses, userList.length - 1)
        timerElement.innerText = remainingSeconds;
        if(remainingSeconds > 0 && guesses < userList.length - 1) {
          tick();
        } else {
          console.log("else isadmin", guesses, userList.length - 1)
          if(isAdmin) {
            nextTurn();
          }
        }
      }, 1000);
    }
    tick();
    guesses = 0;
  }, PAUSE_INTERVAL * 1000);

  let childNodes = document.getElementById("userlist2").childNodes;
  for(let node of childNodes) {
    node.classList.remove("highlighted");
  }
  document.getElementById(currentlyDrawingUser.displayName).classList.add("highlighted");

  if(currentlyDrawingUser.displayName !== displayName) {
    makeCanvasReadOnly();
  } else {
    makeCanvasDrawable();
  }
}

function onWordChange(data) {
  correctWord = data;

  let wordElement = document.getElementById("word");
  if(uid !== currentlyDrawingUser.uid) {
    wordElement.childNodes[0].replaceWith(document.createTextNode("".padEnd(correctWord.length, "_")));
  } else {
    wordElement.childNodes[0].replaceWith(document.createTextNode(correctWord));
  }
}

// listen for guessedUsers
function onAddGuessedUser(data) {
  const newGuessedUser = data.displayName;
  if(newGuessedUser && document.getElementById(newGuessedUser)) {
    document.getElementById(newGuessedUser).classList.add("guessed");
    guesses++;
    if(guesses === userList.length - 1) {
      // nextTurn();
    }
  }
}

function onGameStateChange(data) {
  var gameState = data;
  if(gameState === "over") {
    endGame();
  }
}

function nextTurn() {
  let currentlyDrawingUserIndex = userList.findIndex(user => user.uid === currentlyDrawingUser.uid);
  let newIndex = (currentlyDrawingUserIndex + 1) % userList.length;
  let nextUser = userList[newIndex];
  console.log("nextturn", userList, currentlyDrawingUser, currentlyDrawingUserIndex, newIndex, nextUser, currentRoundNumber);
  // if next user admin and current round === ROUNDS, end the game
  if(newIndex === 0) {
    if(currentRoundNumber === ROUNDS) {
      setGameStateInFirebase("over");

      setTimeout(() => {
        deleteGameInFirebase();
      }, 30000);

      return;
    } else {
      currentRoundNumber++;
    }
  } 

  console.log("nextturn after", currentRoundNumber, newIndex);
  if(currentRoundNumber <= ROUNDS || newIndex !== 0) {
    setCurrentlyDrawingUserInFirebase(nextUser);
  }
  // setTimeout(nextTurn, (DRAWING_INTERVAL + PAUSE_INTERVAL) * 1000)
}

function endGame() {
  let overlay = document.getElementById("overlay");
  let overlayText = document.getElementById("overlayText");
  overlay.classList.remove("hidden");

  var userListFromFb = {};
  function onChangeUsers(data) {
    userListFromFb = data;
    var userList = [];
    var userListText = "";
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

  listenToFirebaseValueChange(USERS, onChangeUsers);
}

function listenToFirebaseChanges() {
  listenToFirebaseValueChange(CURRENTLY_DRAWING_USER, onCurrentlyDrawingUserChange);
  listenToFirebaseValueChange(WORD, onWordChange);
  listenToFirebaseChildAdded(GUESSED_USERS, onAddGuessedUser);
  listenToFirebaseValueChange(GAME_STATE, onGameStateChange);
}
