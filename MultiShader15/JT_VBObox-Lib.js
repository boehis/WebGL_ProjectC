
function WorldBox() {

  this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_MvpMatrix0;\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Colr0;\n' +
    'varying vec3 v_Colr0;\n' +
    //
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix0 * a_Pos0;\n' +
    '	 v_Colr0 = a_Colr0;\n' +
    ' }\n';

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec3 v_Colr0;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Colr0, 1.0);\n' +
    '}\n';

  this.vboContents = makeGroundGrid()

  this.vboVerts = this.vboContents.length / 7.0;						// # of vertices held in 'vboContents' array
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
  // bytes req'd by 1 vboContents array element;
  // (why? used to compute stride and offset 
  // in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;
  // total number of bytes stored in vboContents
  // (#  of floats in vboContents array) * 
  // (# of bytes/float).
  this.vboStride = this.vboBytes / this.vboVerts;
  // (== # of bytes to store one complete vertex).
  // From any attrib in a given vertex in the VBO, 
  // move forward by 'vboStride' bytes to arrive 
  // at the same attrib for the next vertex. 

  //----------------------Attribute sizes
  this.vboFcount_a_Pos0 = 4;    // # of floats in the VBO needed to store the
  // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
    this.vboFcount_a_Colr0) *   // every attribute in our VBO
    this.FSIZE == this.vboStride, // for agreeement with'stride'
    "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

  //----------------------Attribute offsets  
  this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
  // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
  // (4 floats * bytes/float) 
  // # of bytes from START of vbo to the START
  // of 1st a_Colr0 attrib value in vboContents[]
  //-----------------------GPU memory locations:
  this.vboLoc;									// GPU Location for Vertex Buffer Object, 
  // returned by gl.createBuffer() function call
  this.shaderLoc;								// GPU Location for compiled Shader-program  
  // set by compile/link of VERT_SRC and FRAG_SRC.
  //------Attribute locations in our shaders:
  this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
  this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

  //---------------------- Uniform locations &values in our shaders
  this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
  this.u_MvpMatrix0;							// GPU location for u_ModelMat uniform
}

WorldBox.prototype.init = function () {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
  this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name +
      '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

  gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

  // b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log(this.constructor.name +
      '.init() failed to create VBO in GPU. Bye!');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
    this.vboLoc);				  // the ID# the GPU uses for this buffer.

  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
    this.vboContents, 		// JavaScript Float32Array
    gl.STATIC_DRAW);			// Usage hint.

  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if (this.a_PosLoc < 0) {
    console.log(this.constructor.name +
      '.init() Failed to get GPU location of attribute a_Pos0');
    return -1;	// error exit.
  }
  this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if (this.a_ColrLoc < 0) {
    console.log(this.constructor.name +
      '.init() failed to get the GPU location of attribute a_Colr0');
    return -1;	// error exit.
  }
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
  this.u_MvpMatrix0 = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix0');
  if (!this.u_MvpMatrix0) {
    console.log(this.constructor.name +
      '.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
}

WorldBox.prototype.switchToMe = function () {

  gl.useProgram(this.shaderLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
    this.vboLoc);			    // the ID# the GPU uses for our VBO.
  gl.vertexAttribPointer(
    this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
    this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
    gl.FLOAT,			// type == what data type did we use for those numbers?
    false,				// isNormalized == are these fixed-point values that we need
    //									normalize before use? true or false
    this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
    // stored attrib for this vertex to the same stored attrib
    //  for the next vertex in our VBO.  This is usually the 
    // number of bytes used to store one complete vertex.  If set 
    // to zero, the GPU gets attribute values sequentially from 
    // VBO, starting at 'Offset'.	
    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
    this.vboOffset_a_Pos0);
  // Offset == how many bytes from START of buffer to the first
  // value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Colr0);

  // --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

WorldBox.prototype.isReady = function () {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
    console.log(this.constructor.name +
      '.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
    console.log(this.constructor.name +
      '.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

WorldBox.prototype.adjust = function () {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.adjust() call you needed to call this.switchToMe()!!');
  }
  // Adjust values for our uniforms,
  this.ModelMat.setRotate(0, 0, 0, 1);	  // rotate drawing axes,
  this.ModelMat.translate(0, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

  gl.uniformMatrix4fv(this.u_MvpMatrix0,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    getMVPMatrix(this.ModelMat).elements);	// send data from Javascript.
  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)

}

WorldBox.prototype.draw = function () {
  //=============================================================================
  // Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.draw() call you needed to call this.switchToMe()!!');
  }

  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
    0, 								// location of 1st vertex to draw;
    this.vboVerts);		// number of vertices to draw on-screen.
}

WorldBox.prototype.reload = function () {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.

  gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
    0,                  // byte offset to where data replacement
    // begins in the VBO.
    this.vboContents);   // the JS source-data array used to fill VBO

}

//=============================================================================
//=============================================================================
function VBObox1() {

  this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'attribute vec4 a_position; \n' +
    'attribute vec4 a_normal; \n' +

    'uniform mat4 u_pvMat, u_modelMat, u_normalMat; \n' +
    'uniform int u_lightMode;    \n' +
    'uniform float u_Ka;    \n' +
    'uniform float u_Kd;    \n' +
    'uniform float u_Ks;    \n' +
    'uniform float u_shininessVal;  \n' +
    'uniform vec3 u_ambientColor; \n' +
    'uniform vec3 u_diffuseColor; \n' +
    'uniform vec3 u_specularColor; \n' +
    'uniform vec3 u_lightPos;  \n' +
    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    
    'varying vec4 v_color;  \n' +

    'void main(){ \n' +

    '  vec3 normal2 = normalize(vec3(u_normalMat * a_normal));\n' +
     // Calculate world coordinate of vertex
    '  vec4 vertexPosition = u_modelMat * a_position;\n' +
      // Calculate the light direction and make it 1.0 in length
    '  vec3 lightDirection = normalize(u_lightPos - vec3(vertexPosition));\n' +
      // The dot product of the light direction and the normal
    '  float nDotL = max(dot(lightDirection, vec3(normal2)), 0.0);\n' +

    '  vec3 diffuse = u_diffuseColor * nDotL;\n' +
    // Calculate the color due to ambient reflection

     '  gl_Position = u_pvMat * vertexPosition; \n' +
     '  vec3 eyeDirection = normalize(u_eyePosWorld - vertexPosition.xyz); \n' +
	
    '  vec3 N = normal2; \n' +
    '  vec3 L = lightDirection; \n' +
    '  float lambertian = nDotL; \n' +
    '  float specular = 0.0; \n' +
    '  if(lambertian > 0.0) { \n' +
    '    vec3 R = reflect(L, N);      // Reflected light vector \n' +
    '    vec3 V = normalize(-eyeDirection); // Vector to viewer \n' +
    '    float specAngle = max(dot(R, V), 0.0); \n' +
    '    specular = pow(specAngle, u_shininessVal); \n' +
    '  } \n' +
    '  v_color = vec4(u_Ka * u_ambientColor + \n' +
    '               u_Kd * nDotL * u_diffuseColor  + \n' +
'                   u_Ks * specular * u_specularColor, 1.0); \n' +

     '  if(u_lightMode == 2) v_color = vec4(u_Ka * u_ambientColor, 1.0); \n' +
    // '  if(mode == 3) color = vec4(Kd * lambertian * diffuseColor, 1.0); \n' +
    // '  if(mode == 4) color = vec4(Ks * specular * specularColor, 1.0); \n' +
    '} \n'

  // SHADED, sphere-like dots:
  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec4 v_color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_color; \n' +
    '}\n';

  var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
  var sq2 = Math.sqrt(2.0);
  // for surface normals:
  var sq23 = Math.sqrt(2.0 / 3.0)
  var sq29 = Math.sqrt(2.0 / 9.0)
  var sq89 = Math.sqrt(8.0 / 9.0)
  var thrd = 1.0 / 3.0;

  this.vboContents = makeSphere()

  this.vboVerts = this.vboContents.length / 7;							// # of vertices held in 'vboContents' array;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
  // bytes req'd by 1 vboContents array element;
  // (why? used to compute stride and offset 
  // in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;
  // (#  of floats in vboContents array) * 
  // (# of bytes/float).
  this.vboStride = this.vboBytes / this.vboVerts;
  // (== # of bytes to store one complete vertex).
  // From any attrib in a given vertex in the VBO, 
  // move forward by 'vboStride' bytes to arrive 
  // at the same attrib for the next vertex.

  //----------------------Attribute sizes
  this.vboFcount_a_Pos1 = 4;    // # of floats in the VBO needed to store the
  // attribute named a_Pos1. (4: x,y,z,w values)
  this.vboFcount_a_Colr1 = 3;   // # of floats for this attrib (r,g,b values)
  this.vboFcount_a_Normal = 0;  // # of floats for this attrib (just one!)   
  console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
    this.vboFcount_a_Colr1 +
    this.vboFcount_a_Normal) *   // every attribute in our VBO
    this.FSIZE == this.vboStride, // for agreeement with'stride'
    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

  //----------------------Attribute offsets
  this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
  // of 1st a_Pos1 attrib value in vboContents[]
  this.vboOffset_a_Colr1 = (this.vboFcount_a_Pos1) * this.FSIZE;
  // == 4 floats * bytes/float
  //# of bytes from START of vbo to the START
  // of 1st a_Colr1 attrib value in vboContents[]
  this.vboOffset_a_Normal = (this.vboFcount_a_Pos1 +
    this.vboFcount_a_Colr1) * this.FSIZE;
  // == 7 floats * bytes/float
  // # of bytes from START of vbo to the START
  // of 1st a_PtSize attrib value in vboContents[]

  //-----------------------GPU memory locations:                                
  this.vboLoc;									// GPU Location for Vertex Buffer Object, 
  // returned by gl.createBuffer() function call
  this.shaderLoc;								// GPU Location for compiled Shader-program  
  // set by compile/link of VERT_SRC and FRAG_SRC.
  //------Attribute locations in our shaders:

  this.positionLoc;
  this.normalLoc;
  this.projectionLoc
  this.modelviewLoc
  this.normalMatLoc;
  this.modeLoc;
  this.KaLoc;
  this.KdLoc;
  this.KsLoc;
  this.shininessValLoc;
  this.ambientColorLoc;
  this.diffuseColorLoc;
  this.specularColorLoc;
  this.lightPosLoc;
  this.u_eyePosWorldLoc;

  this.ModelMatrix = new Matrix4()
  this.projection = new Matrix4()
  this.modelview = new Matrix4()
  this.normalMat = new Matrix4()

};


VBObox1.prototype.init = function () {

  this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name +
      '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

  gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

  // b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log(this.constructor.name +
      '.init() failed to create VBO in GPU. Bye!');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
    this.vboLoc);				  // the ID# the GPU uses for this buffer.

  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
    this.vboContents, 		// JavaScript Float32Array
    gl.STATIC_DRAW);			// Usage hint.  



  this.positionLoc = gl.getAttribLocation(this.shaderLoc, 'a_position');
  this.normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_normal');
  this.projectionLoc = gl.getUniformLocation(this.shaderLoc, 'u_pvMat');
  this.modelviewLoc = gl.getUniformLocation(this.shaderLoc, 'u_modelMat');
  this.normalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_normalMat');
  this.modeLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightMode');
  this.KaLoc = gl.getUniformLocation(this.shaderLoc, 'u_Ka');
  this.KdLoc = gl.getUniformLocation(this.shaderLoc, 'u_Kd');
  this.KsLoc = gl.getUniformLocation(this.shaderLoc, 'u_Ks');
  this.shininessValLoc = gl.getUniformLocation(this.shaderLoc, 'u_shininessVal');
  this.ambientColorLoc = gl.getUniformLocation(this.shaderLoc, 'u_ambientColor');
  this.diffuseColorLoc = gl.getUniformLocation(this.shaderLoc, 'u_diffuseColor');
  this.specularColorLoc = gl.getUniformLocation(this.shaderLoc, 'u_specularColor');
  this.lightPosLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightPos');
  this.u_eyePosWorldLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');

  if (
    this.positionLoc < 0 ||
    this.normalLoc < 0 ||
    !this.projectionLoc ||
    !this.modelviewLoc ||
    !this.normalMatLoc ||
    !this.modeLoc ||
    !this.KaLoc ||
    !this.KdLoc ||
    !this.KsLoc ||
    !this.shininessValLoc ||
    !this.ambientColorLoc ||
    !this.diffuseColorLoc ||
    !this.specularColorLoc ||
    !this.lightPosLoc ||
    !this.u_eyePosWorldLoc
  ) {
    console.log(
      this.positionLoc + ' ' +
      this.normalLoc + ' ' +
      !this.projectionLoc + ' ' +
      !this.modelviewLoc + ' ' +
      !this.normalMatLoc + ' ' +
      !this.modeLoc + ' ' +
      !this.KaLoc + ' ' +
      !this.KdLoc + ' ' +
      !this.KsLoc + ' ' +
      !this.shininessValLoc + ' ' +
      !this.ambientColorLoc + ' ' +
      !this.diffuseColorLoc + ' ' +
      !this.specularColorLoc + ' ' +
      !this.lightPosLoc
    );
    console.log('Failed to get the storage location');
    return;
  }
}

VBObox1.prototype.switchToMe = function () {

  gl.useProgram(this.shaderLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
    this.vboLoc);			// the ID# the GPU uses for our VBO.

  gl.vertexAttribPointer(this.positionLoc, this.vboFcount_a_Pos1,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Pos1);
  gl.vertexAttribPointer(this.normalLoc, this.vboFcount_a_Pos1,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Pos1);

  gl.enableVertexAttribArray(this.positionLoc);
  gl.enableVertexAttribArray(this.normalLoc);
}

VBObox1.prototype.isReady = function () {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
    console.log(this.constructor.name +
      '.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
    console.log(this.constructor.name +
      '.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox1.prototype.adjust = function () {

  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.adjust() call you needed to call this.switchToMe()!!');
  }

  //  gl.uniform3f(this.u_LightColorLoc, 0.8, 0.8, 0.8);
  // Set the light direction (in the world coordinate)
  gl.uniform1i(this.modeLoc, 1)
  gl.uniform1f(this.KaLoc, 1.0)
  gl.uniform1f(this.KdLoc, 1.0)
  gl.uniform1f(this.KsLoc, 1.0)
  gl.uniform1f(this.shininessValLoc, 55.0)
  gl.uniform3f(this.ambientColorLoc, 0.2, 0.2, 0.2);
  gl.uniform3f(this.diffuseColorLoc, 0.8, 0.2, 0.2);
  gl.uniform3f(this.specularColorLoc, 0.8, 0.8, 0.8);
  gl.uniform3f(this.lightPosLoc, 2.0, 1.0, 1.0);
  gl.uniform3f(this.u_eyePosWorldLoc, g_eye_point_v[0], g_eye_point_v[1], g_eye_point_v[2]);


  this.ModelMatrix.setRotate(g_angleNow0, 0, 0, 1);
  //this.ModelMatrix.translate(0.35, -0.15, 0.1);
  gl.uniformMatrix4fv(this.modelviewLoc, false, this.ModelMatrix.elements)

  
  var mvpMat = new Matrix4()
  mvpMat.set(g_projMatrix).multiply(g_viewMatrix)
  gl.uniformMatrix4fv(this.projectionLoc, false, mvpMat.elements);

  this.normalMat.setInverseOf(this.ModelMatrix)
  this.normalMat.transpose()
  gl.uniformMatrix4fv(this.normalMatLoc, false, this.normalMat.elements);

}

VBObox1.prototype.draw = function () {
  //=============================================================================
  // Send commands to GPU to select and render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.draw() call you needed to call this.switchToMe()!!');
  }

  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vboVerts)
}


VBObox1.prototype.reload = function () {
  //=============================================================================
  // Over-write current values in the GPU for our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.

  gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
    0,                  // byte offset to where data replacement
    // begins in the VBO.
    this.vboContents);   // the JS source-data array used to fill VBO
}

/*
VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
function VBObox2() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox2' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.

  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!

  this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_ModelMatrix;\n' +
    'attribute vec4 a_Position;\n' +
    'attribute vec3 a_Color;\n' +
    'attribute float a_PtSize; \n' +
    'varying vec3 v_Colr;\n' +
    //
    'void main() {\n' +
    '  gl_PointSize = a_PtSize;\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '	 v_Colr = a_Color;\n' +
    ' }\n';

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec3 v_Colr;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Colr, 1.0);\n' +
    //  'gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n' +
    '}\n';

  this.vboContents = //---------------------------------------------------------
    new Float32Array([					// Array of vertex attribute values we will
      // transfer to GPU's vertex buffer object (VBO)
      // 1 vertex per line: pos x,y,z,w;   color; r,g,b;   point-size; 
      -0.3, 0.5, 0.0, 1.0, 1.0, 0.3, 0.3, 7.0,   // (bright red)
      -0.3, -0.3, 0.0, 1.0, 0.3, 1.0, 0.3, 14.0,   // (bright green)
      0.3, -0.3, 0.0, 1.0, 0.3, 0.3, 1.0, 21.0,   // (bright blue)
      0.3, 0.3, 0.0, 1.0, 0.5, 0.5, 0.5, 18.0,   // (gray)
    ]);

  this.vboVerts = 4;							// # of vertices held in 'vboContents' array;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
  // bytes req'd by 1 vboContents array element;
  // (why? used to compute stride and offset 
  // in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;
  // (#  of floats in vboContents array) * 
  // (# of bytes/float).
  this.vboStride = this.vboBytes / this.vboVerts;
  // From any attrib in a given vertex, 
  // move forward by 'vboStride' bytes to arrive 
  // at the same attrib for the next vertex. 
  // (== # of bytes used to store one vertex) 

  //----------------------Attribute sizes
  this.vboFcount_a_Position = 4;  // # of floats in the VBO needed to store the
  // attribute named a_Position (4: x,y,z,w values)
  this.vboFcount_a_Color = 3;   // # of floats for this attrib (r,g,b values)
  this.vboFcount_a_PtSize = 1;  // # of floats for this attrib (just one!)
  //----------------------Attribute offsets
  this.vboOffset_a_Position = 0;
  //# of bytes from START of vbo to the START
  // of 1st a_Position attrib value in vboContents[]
  this.vboOffset_a_Color = (this.vboFcount_a_Position) * this.FSIZE;
  // == 4 floats * bytes/float
  //# of bytes from START of vbo to the START
  // of 1st a_Color attrib value in vboContents[]
  this.vboOffset_a_PtSize = (this.vboFcount_a_Position +
    this.vboFcount_a_Color) * this.FSIZE;
  // == 7 floats * bytes/float
  // # of bytes from START of vbo to the START
  // of 1st a_PtSize attrib value in vboContents[]

  //-----------------------GPU memory locations:
  this.vboLoc;									// GPU Location for Vertex Buffer Object, 
  // returned by gl.createBuffer() function call
  this.shaderLoc;								// GPU Location for compiled Shader-program  
  // set by compile/link of VERT_SRC and FRAG_SRC.
  //------Attribute locations in our shaders:
  this.a_PositionLoc;							// GPU location: shader 'a_Position' attribute
  this.a_ColorLoc;								// GPU location: shader 'a_Color' attribute
  this.a_PtSizeLoc;								// GPU location: shader 'a_PtSize' attribute

  //---------------------- Uniform locations &values in our shaders
  this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
  this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform
};


VBObox2.prototype.init = function () {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // 
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!

  // a) Compile,link,upload shaders---------------------------------------------
  this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name +
      '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

  gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

  // b) Create VBO on GPU, fill it----------------------------------------------
  this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log(this.constructor.name +
      '.init() failed to create VBO in GPU. Bye!');
    return;
  }
  // Specify the purpose of our newly-created VBO.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
    this.vboLoc);				// the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & managemt: use 
  //		gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
    this.vboContents, 		// JavaScript Float32Array
    gl.STATIC_DRAW);			// Usage hint.
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
  if (this.a_PositionLoc < 0) {
    console.log(this.constructor.name +
      '.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
  this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
  if (this.a_ColorLoc < 0) {
    console.log(this.constructor.name +
      '.init() failed to get the GPU location of attribute a_Color');
    return -1;	// error exit.
  }
  this.a_PtSizeLoc = gl.getAttribLocation(this.shaderLoc, 'a_PtSize');
  if (this.a_PtSizeLoc < 0) {
    console.log(this.constructor.name +
      '.init() failed to get the GPU location of attribute a_PtSize');
    return -1;	// error exit.
  }
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
  this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  if (!this.u_ModelMatrixLoc) {
    console.log(this.constructor.name +
      '.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }
}

VBObox2.prototype.switchToMe = function () {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.

  // a) select our shader program:
  gl.useProgram(this.shaderLoc);
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  

  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
  gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
    this.vboLoc);			// the ID# the GPU uses for our VBO.

  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
  //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
    this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
    this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
    gl.FLOAT,		  // type == what data type did we use for those numbers?
    false,				// isNormalized == are these fixed-point values that we need
    //									normalize before use? true or false
    this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
    // stored attrib for this vertex to the same stored attrib
    //  for the next vertex in our VBO.  This is usually the 
    // number of bytes used to store one complete vertex.  If set 
    // to zero, the GPU gets attribute values sequentially from 
    // VBO, starting at 'Offset'.	 (Our vertex size in bytes: 
    // 4 floats for Position + 3 for Color + 1 for PtSize = 8).
    this.vboOffset_a_Position);
  // Offset == how many bytes from START of buffer to the first
  // value we will actually use?  (We start with a_Position).
  gl.vertexAttribPointer(this.a_ColorLoc, this.vboFcount_a_Color,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Color);
  gl.vertexAttribPointer(this.a_PtSizeLoc, this.vboFcount_a_PtSize,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_PtSize);
  // --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PositionLoc);
  gl.enableVertexAttribArray(this.a_ColorLoc);
  gl.enableVertexAttribArray(this.a_PtSizeLoc);
}

VBObox2.prototype.isReady = function () {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

  var isOK = true;
  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
    console.log(this.constructor.name +
      '.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
    console.log(this.constructor.name +
      '.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox2.prototype.adjust = function () {
  //=============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update the VBO's contents, and (if needed) each 
  // attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.adjust() call you needed to call this.switchToMe()!!');
  }

  // Adjust values for our uniforms;-------------------------------------------
  this.ModelMatrix.setTranslate(-0.3, 0.0, 0.0); //Shift origin leftwards,
  this.ModelMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,

  //  Transfer new uniforms' values to the GPU:--------------------------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	  // GPU location of the uniform
    false, 										// use matrix transpose instead?
    getMVPMatrix(this.ModelMatrix).elements);	// send data from Javascript.
  // Adjust values in VBOcontents array-----------------------------------------
  // Make one dot-size grow/shrink;
  this.vboContents[15] = 15.0 * (1.0 + Math.cos(Math.PI * 3.0 * g_angleNow1 / 180.0)); // radians
  // change y-axis value of 1st vertex
  this.vboContents[1] = g_posNow0;
  // Transfer new VBOcontents to GPU-------------------------------------------- 
  this.reload();
}

VBObox2.prototype.draw = function () {
  //=============================================================================
  // Render current VBObox contents.
  // check: was WebGL context set to use our VBO & shader program?
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.draw() call you needed to call this.switchToMe()!!');
  }

  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.POINTS, 		    // select the drawing primitive to draw,
    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
    0, 								// location of 1st vertex to draw;
    this.vboVerts);		// number of vertices to draw on-screen.

  gl.drawArrays(gl.LINE_LOOP,     // draw lines between verts too!
    0,
    this.vboVerts);
}

VBObox2.prototype.reload = function () {
  //=============================================================================
  // Over-write current values in the GPU for our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // 'vboContents' to our VBO, but without changing any GPU memory allocations.

  gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
    0,                  // byte offset to where data replacement
    // begins in the VBO.
    this.vboContents);   // the JS source-data array used to fill VBO
}
/*
VBObox2.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any
// shader programs, attributes, uniforms, textures, samplers or other claims on
// GPU memory.  However, make sure this step is reversible by a call to
// 'restoreMe()': be sure to retain all our Float32Array data, all values for
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox2.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any
// shader programs, attributes, uniforms, textures, samplers or other claims on
// GPU memory.  Use our retained Float32Array data, all values for  uniforms,
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
//=============================================================================
