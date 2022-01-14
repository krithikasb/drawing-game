const DRAWING_INTERVAL = 50;
const PAUSE_INTERVAL = 3;
const ROUNDS = 3;

var currentlyDrawingUser = {};
var correctWord;
var guesses = 0;
var currentRoundNumber = 1;

function clearPreviousTurn() {
  // reset guessvalue etc from previous turn
  document.getElementById("guessResponse").innerText = "";
  document.getElementById("guess").value = "";
  document.getElementById("guess").disabled = false;
  resetGuessedUsersInFirebase();
}

function setupCurrentTurn() {
  // disable drawing if its not currentuser's, show message saying nextUser's turn
  let overlay = document.getElementById("overlay");
  let overlayText = document.getElementById("overlayText");
  let wordElement = document.getElementById("word");
  wordElement.classList.add("hidden");
  context.clearRect(0, 0, 800, 600);
  overlay.classList.remove("hidden");
  overlayText.innerText = "";
  if(uid !== currentlyDrawingUser.uid) {
    // if its not currentuser's turn, show guess box
    overlayText.innerText = `${currentlyDrawingUser.displayName}'s turn`;
    document.getElementById("guessBox").classList.remove("hidden");
    document.getElementById("toolbar").classList.add("hidden");
  } else {
    // if its currentuser's turn, set a word and hide guess box
    let word = WORDS[Math.floor(Math.random(WORDS.length) * WORDS.length)]
    overlayText.innerText = `Your turn!\n Your word is: ${word}`;
    setWordInFirebase(word);

    document.getElementById("guessBox").classList.add("hidden");
    document.getElementById("toolbar").classList.remove("hidden");
  }

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

function tick(remainingSeconds) {
  setTimeout(() => {
    remainingSeconds -= 1;
    console.log(remainingSeconds, guesses, userList.length - 1)
    document.getElementById("timer").innerText = remainingSeconds;
    if(remainingSeconds > 0 && guesses < userList.length - 1) {
      tick(remainingSeconds);
    } else {
      console.log("else isadmin", guesses, userList.length - 1)
      if(isAdmin) {
        nextTurn();
      }
    }
  }, 1000);
}

function startTurn() {
  let overlay = document.getElementById("overlay");
  let wordElement = document.getElementById("word");
  overlay.classList.add("hidden");
  wordElement.classList.remove("hidden");
  context.clearRect(0, 0, 800, 600);

  let userNodes = document.getElementById("userlist2").childNodes;
  for(let userListItem of userNodes) {
    userListItem.classList.remove("guessed");
  }

  let remainingSeconds = DRAWING_INTERVAL;

  document.getElementById("timer").innerText = remainingSeconds;
  tick(remainingSeconds);
  guesses = 0;
}

function onCurrentlyDrawingUserChange(data) {
  if(currentlyDrawingUser.uid === data.uid) {
    return;
  }
  currentlyDrawingUser = data;
  console.log("currentlyDrawingUser", data, currentlyDrawingUser.displayName, uid, currentlyDrawingUser.uid)

  clearPreviousTurn();
  setupCurrentTurn();
  
  // start the turn after pause interval
  setTimeout(startTurn, PAUSE_INTERVAL * 1000);
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

function onAddGuessedUser(data) {
  const newGuessedUser = data.displayName;
  if(newGuessedUser && document.getElementById(newGuessedUser)) {
    document.getElementById(newGuessedUser).classList.add("guessed");
    guesses++;
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
  // if next user is the admin and current round === ROUNDS, end the game
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
}

function listenToFirebaseChanges() {
  listenToFirebaseValueChange(CURRENTLY_DRAWING_USER, onCurrentlyDrawingUserChange);
  listenToFirebaseValueChange(WORD, onWordChange);
  listenToFirebaseChildAdded(GUESSED_USERS, onAddGuessedUser);
  listenToFirebaseValueChange(GAME_STATE, onGameStateChange);
}
