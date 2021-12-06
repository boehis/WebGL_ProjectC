
var gl;													// WebGL rendering context -- the 'webGL' object
// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For multiple VBOs & Shaders:-----------------
worldBox = new WorldBox();		  // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
part1Box = new VBObox1();		  // "  "  for first set of custom-shaded 3D parts
part2Box = new VBObox2();     // "  "  for second set of custom-shaded 3D parts

var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex


var g_viewMatrix;
var g_projMatrix;

// Global Variables
var g_fov_angle = 30.0
var g_fov_ner = 1.0
var g_fov_far = 70.0

var g_eye_point_v = [5.0, 0.0, 1.0];
var g_up_v = [0.0, 0.0, 1.0];
var g_theat = Math.PI;
var g_aim_z = 0.0;
var g_move_vel = 0.08;
var g_turn_v = Math.PI / 180;
var g_tilt_v = 0.01;


var key_codes = []
var g_matlSel = 1

var g_light_mode = 1
var g_light_enabled = true
var lamp0pos = [6.0, 5.0, 5.0];
var lamp0ambi = [0.4, 0.4, 0.4];
var lamp0diff = [1.0, 1.0, 1.0];
var lamp0spec = [1.0, 1.0, 1.0];

//--------------------------------------

// For animation:---------------------
var g_lastMS = Date.now();			// Timestamp (in milliseconds) for our 
// most-recently-drawn WebGL screen contents.  
// Set & used by moveAll() fcn to update all
// time-varying params for our webGL drawings.
// All time-dependent params (you can add more!)
var g_angleNow0 = 0.0; 			  // Current rotation angle, in degrees.
var g_angleRate0 = 45.0;				// Rotation angle rate, in degrees/second.
//---------------
var g_angleNow1 = 5.0;       // current angle, in degrees
var g_angleRate1 = 3.0;        // rotation angle rate, degrees/sec
var g_angleMax1 = 10.0;       // max, min allowed angle, in degrees
var g_angleMin1 = 0.0;
//---------------
var g_angleNow2 = 0.0; 			  // Current rotation angle, in degrees.
var g_angleRate2 = 50.0;				// Rotation angle rate, in degrees/second.
var g_angleMax2 = 10.0;       // max, min allowed angle, in degrees
var g_angleMin2 = 0.0;
//---------------
var g_posNow0 = 0.0;           // current position
var g_posRate0 = 0.6;           // position change rate, in distance/second.
var g_posMax0 = 0.5;           // max, min allowed for g_posNow;
var g_posMin0 = -0.5;
// ------------------
var g_posNow1 = 0.0;           // current position
var g_posRate1 = 0.5;           // position change rate, in distance/second.
var g_posMax1 = 1.0;           // max, min allowed positions
var g_posMin1 = -1.0;
//---------------

// For mouse/keyboard:------------------------
var g_show0 = 1;								// 0==Show, 1==Hide VBO0 contents on-screen.
var g_show1 = 1;								// 	"					"			VBO1		"				"				" 
var g_show2 = 0;                //  "         "     VBO2    "       "       "

function main() {

  g_canvasID = document.getElementById('webgl');

  gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>

  gl.enable(gl.DEPTH_TEST);
  gl.clearDepth(1000.0);       // each time we 'clear' our depth buffer, set all
  gl.depthFunc(gl.LESS); // draw a pixel only if its depth value is GREATER

  g_viewMatrix = new Matrix4();  // The view matrix
  g_projMatrix = new Matrix4();  // The projection matrix

  worldBox.init(gl);		// VBO + shaders + uniforms + attribs for our 3D world,
  // including ground-plane,                       
  part1Box.init(gl);		//  "		"		"  for 1st kind of shading & lighting
  part2Box.init(gl);    //  "   "   "  for 2nd kind of shading & lighting

  // ==============ANIMATION=============
  // Quick tutorials on synchronous, real-time animation in JavaScript/HTML-5: 
  //    https://webglfundamentals.org/webgl/lessons/webgl-animation.html
  //  or
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simpler-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, & computing loads, and to respond 
  //			to on-screen window placement (to skip battery-draining animation in 
  //			any window that was hidden behind others, or was scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  //------------------------------------
  var tick = function () {		    // locally (within main() only), define our 
    // self-calling animation function. 
    requestAnimationFrame(tick, g_canvasID); // browser callback request; wait
    // til browser is ready to re-draw canvas, then
    animate();  // Update all time-varying params, and
    drawAll();                // Draw all the VBObox contents
  };
  //------------------------------------
  tick();                       // do it again!

  // WINDOW:
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();


  //KEY:
  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);

}

function animate() {
  //=============================================================================
  // Find new values for all time-varying parameters used for on-screen drawing
  // use local variables to find the elapsed time.
  var nowMS = Date.now();             // current time (in milliseconds)
  var elapsedMS = nowMS - g_lastMS;   // 
  g_lastMS = nowMS;                   // update for next webGL drawing.
  if (elapsedMS > 1000.0) {
    // Browsers won't re-draw 'canvas' element that isn't visible on-screen 
    // (user chose a different browser tab, etc.); when users make the browser
    // window visible again our resulting 'elapsedMS' value has gotten HUGE.
    // Instead of allowing a HUGE change in all our time-dependent parameters,
    // let's pretend that only a nominal 1/30th second passed:
    elapsedMS = 1000.0 / 30.0;
  }
  // Find new time-dependent parameters using the current or elapsed time:
  // Continuous rotation:
  g_angleNow0 = g_angleNow0 + (g_angleRate0 * elapsedMS) / 1000.0;
  g_angleNow1 = g_angleNow1 + (g_angleRate1 * elapsedMS) / 1000.0;
  g_angleNow2 = g_angleNow2 + (g_angleRate2 * elapsedMS) / 1000.0;
  g_angleNow0 %= 360.0;   // keep angle >=0.0 and <360.0 degrees  
  g_angleNow1 %= 360.0;
  g_angleNow2 %= 360.0;
  if (g_angleNow1 > g_angleMax1) { // above the max?
    g_angleNow1 = g_angleMax1;    // move back down to the max, and
    g_angleRate1 = -g_angleRate1; // reverse direction of change.
  }
  else if (g_angleNow1 < g_angleMin1) {  // below the min?
    g_angleNow1 = g_angleMin1;    // move back up to the min, and
    g_angleRate1 = -g_angleRate1;
  }

  if (g_angleNow2 > g_angleMax2) { // above the max?
    g_angleNow2 = g_angleMax2;    // move back down to the max, and
    g_angleRate2 = -g_angleRate2; // reverse direction of change.
  }
  else if (g_angleNow2 < g_angleMin2) {  // below the min?
    g_angleNow2 = g_angleMin2;    // move back up to the min, and
    g_angleRate2 = -g_angleRate2;
  }
  // Continuous movement:
  g_posNow0 += g_posRate0 * elapsedMS / 1000.0;
  g_posNow1 += g_posRate1 * elapsedMS / 1000.0;
  // apply position limits
  if (g_posNow0 > g_posMax0) {   // above the max?
    g_posNow0 = g_posMax0;      // move back down to the max, and
    g_posRate0 = -g_posRate0;   // reverse direction of change
  }
  else if (g_posNow0 < g_posMin0) {  // or below the min? 
    g_posNow0 = g_posMin0;      // move back up to the min, and
    g_posRate0 = -g_posRate0;   // reverse direction of change.
  }
  if (g_posNow1 > g_posMax1) {   // above the max?
    g_posNow1 = g_posMax1;      // move back down to the max, and
    g_posRate1 = -g_posRate1;   // reverse direction of change
  }
  else if (g_posNow1 < g_posMin1) {  // or below the min? 
    g_posNow1 = g_posMin1;      // move back up to the min, and
    g_posRate1 = -g_posRate1;   // reverse direction of change.
  }


  //Viewing direction
  key_codes.forEach(animateViewMove)

}
function animateViewMove(key_code) {

  var eye_aim = calcAimPoint().map(function (item, index) {
    return (item - g_eye_point_v[index]);
  })
  var direction_fwd = unitify(eye_aim).map(function (item) {
    return item * g_move_vel;
  })
  var direction_side = unitify(cartesian(g_up_v, eye_aim)).map(function (item) {
    return item * g_move_vel;
  })

  switch (key_code) {

    //----------------Arrow keys------------------------
    case "ArrowLeft":
      direction_side.forEach(function (item, index) {
        g_eye_point_v[index] += item;
      })
      break;
    case "ArrowRight":
      direction_side.forEach(function (item, index) {
        g_eye_point_v[index] -= item;
      })
      break;
    case "ArrowUp":
      direction_fwd.forEach(function (item, index) {
        g_eye_point_v[index] += item;
      })
      break;
    case "ArrowDown":
      direction_fwd.forEach(function (item, index) {
        g_eye_point_v[index] -= item;
      })
      break;
    case "KeyO":
      g_up_v.forEach(function (item, index) {
        g_eye_point_v[index] += item * g_move_vel;
      })
      break;
    case "KeyI":
      g_up_v.forEach(function (item, index) {
        g_eye_point_v[index] -= item * g_move_vel;
      })
      break;
    case "KeyA":
      g_theat += g_turn_v;
      g_theat %= (Math.PI * 2);
      break;
    case "KeyD":
      g_theat -= g_turn_v;
      g_theat %= (Math.PI * 2);
      break;
    case "KeyS":
      g_aim_z -= g_tilt_v
      break;
    case "KeyW":
      g_aim_z += g_tilt_v
      break;
    default:
      break;
  }
}

function getMVPMatrix(modelMat) {
  var mvpMat = new Matrix4()
  mvpMat.set(g_projMatrix).multiply(g_viewMatrix).multiply(modelMat);
  return mvpMat
}

function drawAll() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var aspect = gl.canvas.width / gl.canvas.height
  var aim = calcAimPoint();
  g_viewMatrix.setLookAt(
    g_eye_point_v[0],
    g_eye_point_v[1],
    g_eye_point_v[2],
    aim[0],
    aim[1],
    aim[2],
    g_up_v[0],
    g_up_v[1],
    g_up_v[2]);

  g_projMatrix.setPerspective(g_fov_angle, aspect, g_fov_ner, g_fov_far);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  drawShapes();   // Draw shapes

}
function calcAimPoint() {
  return [
    g_eye_point_v[0] + Math.cos(g_theat),
    g_eye_point_v[1] + Math.sin(g_theat),
    g_eye_point_v[2] + g_aim_z]
}

function drawShapes() {

  var b4Draw = Date.now();
  var b4Wait = b4Draw - g_lastMS;

  if (g_show0 == 1) {	// IF user didn't press HTML button to 'hide' VBO0:
    worldBox.switchToMe();  // Set WebGL to render from this VBObox.
    worldBox.adjust();		  // Send new values for uniforms to the GPU, and
    worldBox.draw();			  // draw our VBO's contents using our shaders.
  }
  if (g_show1 == 1) { // IF user didn't press HTML button to 'hide' VBO1:
    part1Box.switchToMe();  // Set WebGL to render from this VBObox.
    part1Box.adjust();		  // Send new values for uniforms to the GPU, and
    part1Box.draw();			  // draw our VBO's contents using our shaders.
  }
  if (g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
    part2Box.switchToMe();  // Set WebGL to render from this VBObox.
    part2Box.adjust();		  // Send new values for uniforms to the GPU, and
    part2Box.draw();			  // draw our VBO's contents using our shaders.
  }
  /* // ?How slow is our own code?  	
  var aftrDraw = Date.now();
  var drawWait = aftrDraw - b4Draw;
  console.log("wait b4 draw: ", b4Wait, "drawWait: ", drawWait, "mSec");
  */
}

function VBO0toggle() {
  //=============================================================================
  // Called when user presses HTML-5 button 'Show/Hide VBO0'.
  if (g_show0 != 1) g_show0 = 1;				// show,
  else g_show0 = 0;										// hide.
  console.log('g_show0: ' + g_show0);
}

function VBO1toggle() {
  //=============================================================================
  // Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if (g_show1 != 1) g_show1 = 1;			// show,
  else g_show1 = 0;									// hide.
  console.log('g_show1: ' + g_show1);
}

function VBO2toggle() {
  //=============================================================================
  // Called when user presses HTML-5 button 'Show/Hide VBO2'.
  if (g_show2 != 1) g_show2 = 1;			// show,
  else g_show2 = 0;									// hide.
  console.log('g_show2: ' + g_show2);
}

function lightSelectChange() {
  var light = document.getElementById("light").value;
  if (light == "phong-light") {
    g_light_mode = 1
  } else {
    g_light_mode = 0
  }
}
function shadingSelectChange() {
  var shadeing = document.getElementById("shading").value;
  if (shadeing == "gouraud-shading") {
    g_show1 = 1
    g_show2 = 0
  } else {
    g_show1 = 0
    g_show2 = 1
  }
}

function myKeyDown(key) {
  if (key_codes.indexOf(key.code) == -1) {
    key_codes.push(key.code)
  }
}

function myKeyUp(key) {
  var index = key_codes.indexOf(key.code)
  if (index != -1) {
    key_codes.splice(index, 1)
  }
}
function myKeyPress(ev) {

  switch (ev.keyCode) {
    case 77:	// UPPER-case 'M' key:
    case 109:	// LOWER-case 'm' key:
      g_matlSel = (g_matlSel + 1) % MATL_DEFAULT;
      break;

    default:

      break;
  }
}



function cartesian(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}
function unitify(a) {
  var len = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
  return [
    a[0] * len,
    a[1] * len,
    a[2] * len
  ]
}
function resizeCanvas() {
  g_canvasID.width = g_canvasID.clientWidth;
  g_canvasID.height = g_canvasID.clientHeight;
}

function lightSwitch(value) {
  g_light_enabled = value
}

function sliderP(value, index) {
  lamp0pos[index] = value - 10 
}
function sliderA(value, index) {
  lamp0ambi[index] = value / 255.0
}
function sliderD(value, index) {
  lamp0diff[index] = value / 255.0
}
function sliderS(value, index) {
  lamp0spec[index] = value / 255.0
}