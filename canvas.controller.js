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
  x = e.clientX - canvas.offsetLeft;
  y = e.clientY - canvas.offsetTop;
  drawPath({x, y}, {x, y});
}

function onMouseEnter(e) {
  isMouseInCanvas = true;
  console.log("mouse enter");
  /* update the current position of the cursor in the canvas */
  previousX = x;
  previousY = y;
  x = e.clientX - canvas.offsetLeft;
  y = e.clientY - canvas.offsetTop;
}

function onMouseMove(e) {
  /* draw a path from previous position to current cursor position
   * when mouse is clicked and cursor is in canvas */
  console.log("mouse move");
  if(isMouseClicked && isMouseInCanvas) {
    previousX = x;
    previousY = y;
    x = e.clientX - canvas.offsetLeft;
    y = e.clientY - canvas.offsetTop;
    drawPath({x: previousX, y: previousY}, {x, y});
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

function onClickPencil() {
  context.strokeStyle = "black";
  context.lineWidth = 2;
  eraser.classList.remove("selected");
  pencil.classList.add("selected");
}

function onClickEraser() {
  context.strokeStyle = "white";
  context.lineWidth = 25;
  pencil.classList.remove("selected");
  eraser.classList.add("selected");
}

pencil.onclick = onClickPencil;
eraser.onclick = onClickEraser;
