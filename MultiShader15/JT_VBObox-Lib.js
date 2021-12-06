
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

  this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name +
      '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

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

    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                            //		   w==0.0 for distant light from x,y,z direction 
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +


    'attribute vec4 a_position; \n' +
    'attribute vec4 a_normal; \n' +

    'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
	  'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
	

    'uniform mat4 u_pvMat, u_modelMat, u_normalMat; \n' +
    'uniform int u_lightMode;    \n' +
    
    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    
    'varying vec4 v_color;  \n' +

    'void main(){ \n' +

    '  vec4 vertexPosition = u_modelMat * a_position;\n' +
    '  vec3 normal = normalize(vec3(u_normalMat * a_normal));\n' +
    '  vec3 lightDirection = normalize(u_LampSet[0].pos - vertexPosition.xyz);\n' +
    '  vec3 eyeDirection = normalize(u_eyePosWorld - vertexPosition.xyz); \n' +
    
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    
    '  float specular = 0.0; \n' +
    '  if(u_lightMode == 0) { \n' +
    '    vec3 H = normalize(lightDirection + eyeDirection); \n' +
  	'    float nDotH = max(dot(H, normal), 0.0); \n' +
    '    specular = pow(nDotH, float(u_MatlSet[0].shiny)); \n' +
    '  } else { \n' +
    '    vec3 R = reflect(lightDirection, normal);      // Reflected light vector \n' +
    '    vec3 V = normalize(eyeDirection); // Vector to viewer \n' +
    '    float specAngle = max(dot(-R, V), 0.0); \n' +
    '    specular = pow(specAngle, float(u_MatlSet[0].shiny)); \n' +
    '  } \n' +
    
    '	 vec3 emissive = 										u_MatlSet[0].emit;' +
    '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
    '  vec3 diffuse = u_LampSet[0].diff * u_MatlSet[0].diff * nDotL;\n' +
    '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * specular;\n' +
    '  v_color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
    
    '  gl_Position = u_pvMat * vertexPosition; \n' +
    '} \n'

  // SHADED, sphere-like dots:
  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec4 v_color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_color; \n' +
    '}\n';

    this.sphere_verts = makeSphere()
    this.pyramide_verts = make_pyramide_vertecies()
    this.tor_verts = make_tor_vertecies()
    this.cyl_verts = make_cyl_vertecies()
    console.log(this.tor_verts.length);

    var size = this.sphere_verts.length 
    + this.pyramide_verts.length
    + this.tor_verts.length
    + this.cyl_verts.length

    this.vboContents = new Float32Array(size)

    var i = 0						
    this.sphere_start = i;
    for (j = 0; j < this.sphere_verts.length; i++, j++) {
      this.vboContents[i] = this.sphere_verts[j];
    }
    this.pyra_start = i;	
    for (j = 0; j < this.pyramide_verts.length; i++, j++) {
      this.vboContents[i] = this.pyramide_verts[j];
    }
    this.tor_start = i;	
    for (j = 0; j < this.tor_verts.length; i++, j++) {
      this.vboContents[i] = this.tor_verts[j];
    }
    this.cyl_start = i;	
    for (j = 0; j < this.cyl_verts.length; i++, j++) {
      this.vboContents[i] = this.cyl_verts[j];
    }
    
    
    //this.vboContents = makeSphere()
  console.log(this.vboContents);

  this.vboVerts = this.vboContents.length / 8;							// # of vertices held in 'vboContents' array;
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
  this.vboFcount_a_Normal = 4;  // # of floats for this attrib (just one!)   
  console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
    this.vboFcount_a_Normal) *   // every attribute in our VBO
    this.FSIZE == this.vboStride, // for agreeement with'stride'
    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

  //----------------------Attribute offsets
  this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
  // of 1st a_Pos1 attrib value in vboContents[]
  this.vboOffset_a_Normal = (this.vboFcount_a_Pos1) * this.FSIZE;

  //-----------------------GPU memory locations:                                
  this.vboLoc;									// GPU Location for Vertex Buffer Object, 
  // returned by gl.createBuffer() function call
  this.shaderLoc;								// GPU Location for compiled Shader-program  
  // set by compile/link of VERT_SRC and FRAG_SRC.
  //------Attribute locations in our shaders:

  this.a_positionLoc;
  this.a_normalLoc;
  this.u_pvMatLoc
  this.u_modelMatLoc
  this.u_normalMatLoc;
  this.u_lightModeLoc;
  this.u_eyePosWorldLoc;

  this.ModelMatrix = new Matrix4()
  this.projection = new Matrix4()
  this.modelview = new Matrix4()
  this.normalMat = new Matrix4()

  this.lamp0 = new LightsT();

  this.matlSel= MATL_RED_PLASTIC;				// see keypress(): 'm' key changes matlSel
  this.matl0 = new Material(this.matlSel);	
};


VBObox1.prototype.init = function () {

  this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name +
      '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  
  gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

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

  this.a_positionLoc = gl.getAttribLocation(this.shaderLoc, 'a_position');
  this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_normal');
  this.u_pvMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_pvMat');
  this.u_modelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_modelMat');
  this.u_normalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_normalMat');
  this.u_lightModeLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightMode');
  this.u_eyePosWorldLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');

  if (
    this.a_positionLoc < 0 ||
    this.a_normalLoc < 0 ||
    !this.u_pvMatLoc ||
    !this.u_modelMatLoc ||
    !this.u_normalMatLoc ||
    !this.u_lightModeLoc ||
    !this.u_eyePosWorldLoc
  ) {
    console.log('Failed to get the storage location');
    //return;
  }

  this.lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');	
  this.lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  this.lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  this.lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  this.matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
	this.matl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
	this.matl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
	this.matl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
	this.matl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
	if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
			  	  		    || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
		 ) {
		console.log('Failed to get GPUs Reflectance storage locations');
		return;
	}

}

VBObox1.prototype.switchToMe = function () {

  gl.useProgram(this.shaderLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
    this.vboLoc);			// the ID# the GPU uses for our VBO.

  gl.vertexAttribPointer(this.a_positionLoc, this.vboFcount_a_Pos1,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Pos1);
  gl.vertexAttribPointer(this.a_normalLoc, this.vboFcount_a_Normal,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Normal);

  gl.enableVertexAttribArray(this.a_positionLoc);
  gl.enableVertexAttribArray(this.a_normalLoc);
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

  gl.uniform1i(this.u_lightModeLoc, 0)
  gl.uniform3f(this.u_eyePosWorldLoc, g_eye_point_v[0], g_eye_point_v[1], g_eye_point_v[2]);
  
  this.lamp0.I_pos.elements.set( [6.0, 5.0, 5.0]);
  this.lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  this.lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  this.lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);


  gl.uniform3fv(this.lamp0.u_pos,  this.lamp0.I_pos.elements.slice(0,3));
  gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);		// ambient
  gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);		// diffuse
  gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);		// Specular

	//---------------For the Material object(s):
	gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
	gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
	gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
	gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 

  
  var pvMat = new Matrix4()
  pvMat.set(g_projMatrix).multiply(g_viewMatrix)
  gl.uniformMatrix4fv(this.u_pvMatLoc, false, pvMat.elements);
  this.reload()
}

VBObox1.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.draw() call you needed to call this.switchToMe()!!');
  }
  this.ModelMatrix.setTranslate( 0,0, 0);
  this.ModelMatrix.rotate(g_angleNow0, 0, 0, 1);
  setModelMatNormalMat(this)
  gl.drawArrays(gl.TRIANGLE_STRIP, this.sphere_start, this.sphere_verts.length / 8)

  this.ModelMatrix.setTranslate( 0,-3, 0);
  this.ModelMatrix.rotate(g_angleNow0, 0, 0, 1);
  setModelMatNormalMat(this)
  gl.drawArrays(gl.TRIANGLES, this.pyra_start / 8, this.pyramide_verts.length / 8)


  this.ModelMatrix.setTranslate( 0,3, 0);
  this.ModelMatrix.rotate(g_angleNow0, 0, 0, 1);
  setModelMatNormalMat(this)
  gl.drawArrays(gl.TRIANGLE_STRIP, this.tor_start / 8, this.tor_verts.length / 8 )

  
  this.ModelMatrix.setTranslate( -3,0, 0);
  this.ModelMatrix.rotate(g_angleNow0, 0, 0, 1);
  setModelMatNormalMat(this)
  gl.drawArrays(gl.TRIANGLE_STRIP, this.cyl_start / 8, this.cyl_verts.length / 8 )
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

function setModelMatNormalMat(self) {
  gl.uniformMatrix4fv(self.u_modelMatLoc, false, self.ModelMatrix.elements)

  self.normalMat.setInverseOf(self.ModelMatrix)
  self.normalMat.transpose()
  gl.uniformMatrix4fv(self.u_normalMatLoc, false, self.normalMat.elements);

}

//=============================================================================
//=============================================================================
function VBObox2() {
  
  this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    //--------------- GLSL Struct Definitions:
    
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +

    'attribute vec4 a_position; \n' +
    'attribute vec4 a_normal; \n' +
  
    'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  
    'uniform mat4 u_pvMat, u_modelMat, u_normalMat; \n' +
    
    'varying vec4 v_color;  \n' +
    'varying vec3 v_Kd;  \n' +
    'varying vec4 v_Position;  \n' +
    'varying vec3 v_Normal;  \n' +
    
    'void main(){ \n' +
    '  gl_Position = u_pvMat * u_modelMat * a_position;\n' +
    '  v_Position = u_modelMat * a_position; \n' +
	  '  v_Normal = normalize(vec3(u_normalMat * a_normal));\n' +
	  //'	 v_Kd = u_Kd; \n' +		// find per-pixel diffuse reflectance from per-vertex
	  '	 v_Kd = u_MatlSet[0].diff; \n' +
    '	 v_color = vec4(1.0,1.0,1.0,1.0); \n' +		// find per-pixel diffuse reflectance from per-vertex
    '} \n'
    
    // SHADED, sphere-like dots:
    this.FRAG_SRC = 
    'precision highp float;\n' +
    'precision highp int;\n' +
    //
    //--------------- GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    //		   w==0.0 for distant light from x,y,z direction 
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +
    //
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    
    'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
    
    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform int u_lightMode;    \n' +
    
    'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
    'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
    'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
    
    'varying vec4 v_color;\n' +
    'void main() {\n' +
    '  vec3 normal = normalize(v_Normal); \n' +
    '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
    '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +

    '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
    

    '  float specular = 0.0; \n' +
    '  if(u_lightMode == 0) { \n' +
    '    vec3 H = normalize(lightDirection + eyeDirection); \n' +
  	'    float nDotH = max(dot(H, normal), 0.0); \n' +
    '    specular = pow(nDotH, float(u_MatlSet[0].shiny)); \n' +
    '  } else { \n' +
    '    vec3 R = reflect(lightDirection, normal);      // Reflected light vector \n' +
    '    vec3 V = normalize(eyeDirection); // Vector to viewer \n' +
    '    float specAngle = max(dot(-R, V), 0.0); \n' +
    '    specular = pow(specAngle, float(u_MatlSet[0].shiny)); \n' +
    '  } \n' +

    '	 vec3 emissive = 										u_MatlSet[0].emit;' +
    '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
    '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
    '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * specular;\n' +
    '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
    '}\n';

/*
  // SHADED, sphere-like dots:
  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  
  'void main() { \n' +
     	// Normalize! !!IMPORTANT!! TROUBLE if you don't! 
     	// normals interpolated for each pixel aren't 1.0 in length any more!

  '}\n';
*/
  this.vboContents = makeSphere()

  this.vboVerts = this.vboContents.length / 8;							// # of vertices held in 'vboContents' array;
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
  this.vboFcount_a_Normal = 4;  // # of floats for this attrib (just one!)   
  console.assert((this.vboFcount_a_Pos1 +     // check the size of each and
    this.vboFcount_a_Normal) *   // every attribute in our VBO
    this.FSIZE == this.vboStride, // for agreeement with'stride'
    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

  //----------------------Attribute offsets
  this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
  // of 1st a_Pos1 attrib value in vboContents[]
  this.vboOffset_a_Normal = (this.vboFcount_a_Pos1) * this.FSIZE;


  //-----------------------GPU memory locations:                                
  this.vboLoc;									// GPU Location for Vertex Buffer Object, 
  // returned by gl.createBuffer() function call
  this.shaderLoc;								// GPU Location for compiled Shader-program  
  // set by compile/link of VERT_SRC and FRAG_SRC.
  //------Attribute locations in our shaders:

  this.a_positionLoc;
  this.a_normalLoc;
  this.u_pvMatLoc
  this.u_modelMatLoc
  this.u_normalMatLoc;
  this.u_lightModeLoc;
  this.u_eyePosWorldLoc;

  this.ModelMatrix = new Matrix4()
  this.projection = new Matrix4()
  this.modelview = new Matrix4()
  this.normalMat = new Matrix4()


  this.lamp0 = new LightsT();

  this.matlSel= MATL_RED_PLASTIC;				// see keypress(): 'm' key changes matlSel
  this.matl0 = new Material(this.matlSel);	

};


VBObox2.prototype.init = function () {
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



  this.a_positionLoc = gl.getAttribLocation(this.shaderLoc, 'a_position');
  this.a_normalLoc = gl.getAttribLocation(this.shaderLoc, 'a_normal');
  this.u_pvMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_pvMat');
  this.u_modelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_modelMat');
  this.u_normalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_normalMat');
  this.u_lightModeLoc = gl.getUniformLocation(this.shaderLoc, 'u_lightMode');
  this.u_eyePosWorldLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');

  if (
    this.a_positionLoc < 0 ||
    this.a_normalLoc < 0 ||
    !this.u_pvMatLoc ||
    !this.u_modelMatLoc ||
    !this.u_normalMatLoc ||
    !this.u_lightModeLoc ||
    !this.u_eyePosWorldLoc
  ) {
    console.log('Failed to get the storage location');
    //return;
  }

  this.lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');	
  this.lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  this.lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  this.lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  this.matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
	this.matl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
	this.matl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
	this.matl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
	this.matl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
	if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
			  	  		    || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
		 ) {
		console.log('Failed to get GPUs Reflectance storage locations');
		return;
	}
}

VBObox2.prototype.switchToMe = function () {

  gl.useProgram(this.shaderLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
    this.vboLoc);			// the ID# the GPU uses for our VBO.

  gl.vertexAttribPointer(this.a_positionLoc, this.vboFcount_a_Pos1,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Pos1);
  gl.vertexAttribPointer(this.a_normalLoc, this.vboFcount_a_Normal,
    gl.FLOAT, false,
    this.vboStride, this.vboOffset_a_Normal);

  gl.enableVertexAttribArray(this.a_positionLoc);
  gl.enableVertexAttribArray(this.a_normalLoc);
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
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.adjust() call you needed to call this.switchToMe()!!');
  }

  //  gl.uniform3f(this.u_LightColorLoc, 0.8, 0.8, 0.8);
  // Set the light direction (in the world coordinate)
  gl.uniform1i(this.u_lightModeLoc, 0)
  gl.uniform3f(this.u_eyePosWorldLoc, g_eye_point_v[0], g_eye_point_v[1], g_eye_point_v[2]);

  this.lamp0.I_pos.elements.set( [6.0, 5.0, 5.0]);
  this.lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  this.lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  this.lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);

  gl.uniform3fv(this.lamp0.u_pos,  this.lamp0.I_pos.elements.slice(0,3));
  gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);		// ambient
  gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);		// diffuse
  gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);		// Specular

	//---------------For the Material object(s):
	gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
	gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
	gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
	gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 




  this.ModelMatrix.setTranslate( 0, 0, 0);
  this.ModelMatrix.rotate(g_angleNow0, 0, 0, 1);
  gl.uniformMatrix4fv(this.u_modelMatLoc, false, this.ModelMatrix.elements)

  
  var pvMat = new Matrix4()
  pvMat.set(g_projMatrix).multiply(g_viewMatrix)
  gl.uniformMatrix4fv(this.u_pvMatLoc, false, pvMat.elements);

  this.normalMat.setInverseOf(this.ModelMatrix)
  this.normalMat.transpose()
  gl.uniformMatrix4fv(this.u_normalMatLoc, false, this.normalMat.elements);

  this.reload()
}

VBObox2.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log('ERROR! before' + this.constructor.name +
      '.draw() call you needed to call this.switchToMe()!!');
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vboVerts)
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
