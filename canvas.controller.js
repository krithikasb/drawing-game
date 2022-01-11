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

var intervalId;

function subscribeCurrentlyDrawingUserListener() {
  /* toggles between drawing and reading mode */
  var currentlyDrawingUserListener = firebase.database().ref(`images/${gameId}/currentRound/currentlyDrawingUser`);
  currentlyDrawingUserListener.on('value', (snapshot) => {
    const data = snapshot.val();
    currentlyDrawingUser = data;
    
    // disable drawing for all users, show message saying nextUser's turncontext.clearRect(0, 0, 800, 600);
    let overlay = document.getElementById("overlay");
    let overlayText = document.getElementById("overlayText");
    let wordElement = document.getElementById("word");
    wordElement.classList.add("hidden");
    context.clearRect(0, 0, 800, 600);
    overlay.classList.remove("hidden");

    document.getElementById("guessResponse").innerText = "";
    document.getElementById("guess").value = "";
    document.getElementById("guess").disabled = false;
    firebase.database().ref(`/images/${gameId}/currentRound/guessedUsers/`).set(null);
    if(uid !== currentlyDrawingUser.uid) {
      overlayText.childNodes[0].replaceWith(document.createTextNode(`${currentlyDrawingUser.displayName}'s turn`));
      // add guess box
      document.getElementById("guessBox").style.display = "block";
    } else {
      let word = WORDS[Math.floor(Math.random(WORDS.length) * WORDS.length)]
      overlayText.childNodes[0].replaceWith(document.createTextNode(`Your turn!\n Your word is: ${word}`));
      firebase.database().ref(`/images/${gameId}/currentRound/word/`).set(word);

      document.getElementById("guessBox").style.display = "none";

    }

    clearInterval(intervalId);
    // intervalId = 0;

    setTimeout(() => {
      let overlay = document.getElementById("overlay");
      overlay.classList.add("hidden");
      wordElement.classList.remove("hidden");
      context.clearRect(0, 0, 800, 600);

      let remainingSeconds = DRAWING_INTERVAL;
      let timerElement = document.getElementById("timer");
  
      timerElement.innerText = remainingSeconds;
      intervalId = setInterval(()=> {
        remainingSeconds -= 1;
        timerElement.innerText = remainingSeconds;
        if(remainingSeconds <= 0) {
          clearInterval(intervalId)
        }
      }, 1000);
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
      document.getElementById(newGuessedUser).style.backgroundColor = "lightgreen";
      guesses++;
      if(guesses === userList.length - 1) {
        // endTurn
        nextTurn();
      }
    }
  });

  function nextTurn() {
    let currentlyDrawingUserIndex = userList.findIndex(user => user.uid === currentlyDrawingUser.uid);
    let newIndex = (currentlyDrawingUserIndex + 1) % userList.length;
    let nextUser = userList[newIndex];
    console.log("nextturn", userList, currentlyDrawingUser, currentlyDrawingUserIndex, newIndex, nextUser);
    
    firebase.database().ref(`/images/${gameId}/currentRound/currentlyDrawingUser/`).set(nextUser);
    guesses = 0;
    setTimeout(nextTurn, (DRAWING_INTERVAL + PAUSE_INTERVAL) * 1000)
  }
  
  // if admin. then set the next user's turn in the db
  console.log("isAdmin", isAdmin)
  if(isAdmin) {
    console.log("if isAdmin", isAdmin)
    setTimeout(nextTurn, (DRAWING_INTERVAL + PAUSE_INTERVAL) * 1000);
  }
}
