let canvas = document.getElementById('canvas');
let context = canvas.getContext("2d");
let isMouseClicked = false;
let isMouseInCanvas = false;
let x = 0;
let y = 0;
let previousX = 0;
let previousY = 0;
context.strokeStyle = "black";
context.lineWidth = 2;
let typeSelected = "pencil";
let readOnly = false;
const DRAWING_INTERVAL = 50;
const PAUSE_INTERVAL = 3;
const ROUNDS = 3;

function drawPath(from, to) {
  /* from { x, y } 
   * to { x, y }
   * draws a path from from to to */
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  console.log(from.x, from.y, to.x, to.y, isMouseClicked);
  context.stroke();
  context.closePath();
}

function onMouseDown(e) {
  isMouseClicked = true;
  console.log("mouse down");
  /* for drawing a single point */
  var boundingClientRect = canvas.getBoundingClientRect();
  // these are relative to the viewport, i.e. the window
  var offsetTop = boundingClientRect.top;
  var offsetLeft = boundingClientRect.left;
  x = e.clientX - offsetLeft;
  y = e.clientY - offsetTop;
  drawPath({x, y}, {x, y});
}

function onMouseEnter(e) {
  isMouseInCanvas = true;
  console.log("mouse enter");
  /* update the current position of the cursor in the canvas */
  previousX = x;
  previousY = y;
  var boundingClientRect = canvas.getBoundingClientRect();
  // these are relative to the viewport, i.e. the window
  var offsetTop = boundingClientRect.top;
  var offsetLeft = boundingClientRect.left;
  x = e.clientX - offsetLeft;
  y = e.clientY - offsetTop;
}

function onMouseMove(e) {
  /* draw a path from previous position to current cursor position
   * when mouse is clicked and cursor is in canvas */
  console.log("mouse move");
  if(isMouseClicked && isMouseInCanvas) {
    previousX = x;
    previousY = y;
    var boundingClientRect = canvas.getBoundingClientRect();
    // these are relative to the viewport, i.e. the window
    var offsetTop = boundingClientRect.top;
    var offsetLeft = boundingClientRect.left;
    x = e.clientX - offsetLeft;
    y = e.clientY - offsetTop;
    drawPath({x: previousX, y: previousY}, {x, y});
    firebase.database().ref(`/images/${gameId}/${uid}`).set({
      type: typeSelected,
      start: {x: previousX, y: previousY},
      end: {x, y}
    });
  }
}

function onMouseUp() {
  isMouseClicked = false;
  console.log("mouse up");
}

function onMouseOut() {
  isMouseInCanvas = false;
  console.log("mouse out");
}

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mouseout", onMouseOut);
canvas.addEventListener("mouseenter", onMouseEnter);

let pencil = document.getElementById("pencil");
let eraser = document.getElementById("eraser");

function changeStroke(strokeType) {
  switch(strokeType) {
    case "pencil":
      typeSelected = "pencil";
      context.strokeStyle = "black";
      context.lineWidth = 2;
      break;
    case "eraser":
      typeSelected = "eraser";
      context.strokeStyle = "white";
      context.lineWidth = 25;
      break;
    default:
      break;
  }
}

function onClickPencil() {
  changeStroke("pencil");
  eraser.classList.remove("selected");
  pencil.classList.add("selected");
}

function onClickEraser() {
  changeStroke('eraser')
  pencil.classList.remove("selected");
  eraser.classList.add("selected");
}

pencil.onclick = onClickPencil;
eraser.onclick = onClickEraser;


var currentlyDrawingUser = {};
var correctWord;
var guesses = 0;
var currentRoundNumber = 1;

var intervalId;

function subscribeCurrentlyDrawingUserListener() {
  /* toggles between drawing and reading mode */
  var currentlyDrawingUserListener = firebase.database().ref(`images/${gameId}/currentRound/currentlyDrawingUser`);
  currentlyDrawingUserListener.on('value', (snapshot) => {
    const data = snapshot.val();
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
    firebase.database().ref(`/images/${gameId}/currentRound/guessedUsers/`).set(null);
    if(uid !== currentlyDrawingUser.uid) {
      overlayText.innerText = `${currentlyDrawingUser.displayName}'s turn`;
      // add guess box
      document.getElementById("guessBox").style.display = "block";
    } else {
      let word = WORDS[Math.floor(Math.random(WORDS.length) * WORDS.length)]
      overlayText.innerText = `Your turn!\n Your word is: ${word}`;
      firebase.database().ref(`/images/${gameId}/currentRound/word/`).set(word);

      document.getElementById("guessBox").style.display = "none";
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
      readOnly = true;
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseout", onMouseOut);
      canvas.removeEventListener("mouseenter", onMouseEnter);
      var img = firebase.database().ref(`images/${gameId}/${currentlyDrawingUser.uid}`);
      img.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log("fb", data);
        if(data) {
          if(data.type !== typeSelected) {
            changeStroke(data.type);
          }
          drawPath(data.start, data.end);
        }
      });
    } else {
      readOnly = false;
      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("mouseout", onMouseOut);
      canvas.addEventListener("mouseenter", onMouseEnter);
    }
  });

  var correctWordListener = firebase.database().ref(`images/${gameId}/currentRound/word`);
  correctWordListener.on('value', (snapshot) => {
    const data = snapshot.val();
    correctWord = data;

    let wordElement = document.getElementById("word");
    if(uid !== currentlyDrawingUser.uid) {
      wordElement.childNodes[0].replaceWith(document.createTextNode("".padEnd(correctWord.length, "_")));
    } else {
      wordElement.childNodes[0].replaceWith(document.createTextNode(correctWord));
    }
  });

  // listen for guessedUsers
  firebase.database().ref(`images/${gameId}/currentRound/guessedUsers`).on('child_added', (data) => {
    const newGuessedUser = data.val().displayName;
    if(newGuessedUser && document.getElementById(newGuessedUser)) {
      document.getElementById(newGuessedUser).classList.add("guessed");
      guesses++;
      if(guesses === userList.length - 1) {
        // nextTurn();
      }
    }
  });

  var gameStateListener = firebase.database().ref(`images/${gameId}/gameState/`);
  gameStateListener.on('value', (snapshot) => {
    const data = snapshot.val();
    var gameState = data;
    if(gameState === "over") {
      endGame();
    }
  });

  function nextTurn() {
    let currentlyDrawingUserIndex = userList.findIndex(user => user.uid === currentlyDrawingUser.uid);
    let newIndex = (currentlyDrawingUserIndex + 1) % userList.length;
    let nextUser = userList[newIndex];
    console.log("nextturn", userList, currentlyDrawingUser, currentlyDrawingUserIndex, newIndex, nextUser);
    // if next user admin and current round === ROUNDS, return
    if(newIndex === 0) {
      if(currentRoundNumber === ROUNDS) {
        firebase.database().ref(`/images/${gameId}/gameState`).set("over");
        return;
      } else {
        currentRoundNumber++;
      }
    } 

    console.log("nextturn after", currentRoundNumber, newIndex);
    if(currentRoundNumber <= ROUNDS || newIndex !== 0) {
      firebase.database().ref(`/images/${gameId}/currentRound/currentlyDrawingUser/`).set(nextUser);
    }
    // setTimeout(nextTurn, (DRAWING_INTERVAL + PAUSE_INTERVAL) * 1000)
  }

  function endGame() {
    let overlay = document.getElementById("overlay");
    let overlayText = document.getElementById("overlayText");
    overlay.classList.remove("hidden");

    var userListListener = firebase.database().ref(`images/${gameId}/users`);
    var userListFromFb = {};
    userListListener.on('value', (snapshot) => {
      const data = snapshot.val();
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

      overlayText.innerText = `Game over!\n ${userListText}`;
    });
  }
  
  // if admin. then set the next user's turn in the db
  console.log("isAdmin", isAdmin)
  if(isAdmin) {
    console.log("if isAdmin", isAdmin)
    // setTimeout(nextTurn, (DRAWING_INTERVAL + PAUSE_INTERVAL) * 1000);
  }
}
