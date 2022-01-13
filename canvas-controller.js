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
    setDrawingDataInFirebase({
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

function makeCanvasReadOnly() {
  readOnly = true;
  canvas.removeEventListener("mousedown", onMouseDown);
  canvas.removeEventListener("mousemove", onMouseMove);
  canvas.removeEventListener("mouseup", onMouseUp);
  canvas.removeEventListener("mouseout", onMouseOut);
  canvas.removeEventListener("mouseenter", onMouseEnter);

  function onDraw(data) {
    if(data) {
      if(data.type !== typeSelected) {
        changeStroke(data.type);
      }
      drawPath(data.start, data.end);
    }
  }
  
  listenToFirebaseValueChange(DRAWING, onDraw);
}

function makeCanvasDrawable() {
  readOnly = false;
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mouseout", onMouseOut);
  canvas.addEventListener("mouseenter", onMouseEnter);
}

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
