'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var linewi = document.getElementById("lineWidth").value;
  var context = canvas.getContext('2d');

  var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);


function Drawstart(evt){
  evt.preventDefault();
  drawing = true;
  current.x = evt.touches[0].pageX;
  current.y = evt.touches[0].pageY;
  linewi = document.getElementById("lineWidth").value;
}

function Drawmove(evt){
  evt.preventDefault();
  if(!drawing){return;}
  linewi = document.getElementById("lineWidth").value;
  drawLine(current.x, current.y, evt.touches[0].pageX, evt.touches[0].pageY, current.color,linewi, true);
  current.x = evt.touches[0].pageX;
  current.y = evt.touches[0].pageY;
}

canvas.addEventListener('touchstart',Drawstart,false);
canvas.addEventListener('touchmove',Drawmove,false);

document.body.addEventListener('touchmove',function(e){
  e.preventDefault();
},false);



  for (var i = 0; i < colors.length-1; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('drawing', onDrawingEvent);

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, linewi, emit){
    context.fillStyle = color;
    context.beginPath();
    context.arc(x1,y1,linewi/2,0,Math.PI*2);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineJoin = "round";
    context.lineWidth = linewi;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color,
      linewi: linewi 
    });
  }

  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX-e.target.offsetLeft;
    current.y = e.clientY-e.target.offsetTop;
    linewi = document.getElementById("lineWidth").value;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    linewi = document.getElementById("lineWidth").value;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color,linewi, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    linewi = document.getElementById("lineWidth").value;
    // drawLine(current.x, current.y, e.clientX, e.clientY, current.color,linewi, true);
    drawLine(current.x, current.y, e.clientX-e.target.offsetLeft, e.clientY-e.target.offsetTop, current.color,linewi, true);
    current.x = e.clientX-e.target.offsetLeft;
    current.y = e.clientY-e.target.offsetTop;
  }

  function onColorUpdate(e){
    if ( e.target.className.split(' ')[1] == 'eraser'){
        current.color = 'white';
    }
    else if(e.target.className.split(' ')[1] == 'panel'){
      document.getElementById('colorPanel').click();
      document.getElementById('colorPanel').onchange = function(){
        current.color = this.value;
      }
    }
    else
    current.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.linewi);
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

})();
