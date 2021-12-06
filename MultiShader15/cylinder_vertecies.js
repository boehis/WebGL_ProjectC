function make_cyl_vertecies() {
  var capVerts = 16
  var verts = makeCylinder(1,1,capVerts)

  var verts_norm = new Float32Array(2* verts.length)
  var i = 0
  for(i = 0; i < verts.length; i += 4) {
    for(j = 0; j < 4; j++) {
      verts_norm[2*i + j] = verts[i + j]
      if(
        (i/4 < (2*capVerts + 2) && j < 2 ) ||
        (i/4 >= (2*capVerts + 2) && i/4 <  verts.length/4 - (2*capVerts + 2) && j == 2 )  ||
        (i/4 >=  verts.length/4 - (2*capVerts + 2) && j < 2 ) 
      ){
        verts_norm[2*i + 4 + j] = 0
      }else {
        verts_norm[2*i + 4 + j] = verts[i + j]
      }
    }
  }
  return verts_norm
}


function makeCylinder(height, radius,capVerts) {
  //==============================================================================
  var floatsPerVertex = 4
   
   cylVerts = new Float32Array(  ((capVerts*6) + 6) * floatsPerVertex);
                      // # of vertices * # of elements needed to store them. 
  
    // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
    // v counts vertices: j counts array elements (vertices * elements per vertex)
    for(v=0,j=0; v<(2*capVerts + 2); v++,j+=floatsPerVertex) {
      // skip the first vertex--not needed.
      if(v%2==0)
      {				// put even# vertices at center of cylinder's top cap:
        cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
        cylVerts[j+1] = 0.0;	
        cylVerts[j+2] = height; 
        cylVerts[j+3] = 1.0;		
      }
      else { 	// put odd# vertices around the top cap's outer edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        cylVerts[j  ] = radius * Math.cos(Math.PI*(v-1)/capVerts);			// x
        cylVerts[j+1] = radius * Math.sin(Math.PI*(v-1)/capVerts);			// y
        //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
        //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
        cylVerts[j+2] = height;	// z
        cylVerts[j+3] = 1.0;	// w.		
      }
    }
    // Create the cylinder side walls, made of 2*capVerts vertices.
    // v counts vertices within the wall; j continues to count array elements
    console.log(j)
    for(v=0; v< (2*capVerts + 2); v++, j+=floatsPerVertex) {
      if(v%2==0)	// position all even# vertices along top cap:
      {		
          cylVerts[j  ] = radius * Math.cos(Math.PI*(v)/capVerts);		// x
          cylVerts[j+1] = radius * Math.sin(Math.PI*(v)/capVerts);		// y
          cylVerts[j+2] = height;	// z
          cylVerts[j+3] = 1.0;	// w.
      }
      else		// position all odd# vertices along the bottom cap:
      {
          cylVerts[j  ] = radius * Math.cos(Math.PI*(v-1)/capVerts);		// x
          cylVerts[j+1] = radius * Math.sin(Math.PI*(v-1)/capVerts);		// y
          cylVerts[j+2] =-height;	// z
          cylVerts[j+3] = 1.0;	// w.	
      }
    }
    console.log(cylVerts);
    // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
    // v counts the vertices in the cap; j continues to count array elements
    for(v=0; v < (2*capVerts + 2); v++, j+= floatsPerVertex) {
      if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
        cylVerts[j  ] = radius * Math.cos(Math.PI*(v)/capVerts);		// x
        cylVerts[j+1] = radius * Math.sin(Math.PI*(v)/capVerts);		// y
        cylVerts[j+2] =-height;	// z
        cylVerts[j+3] = 1.0;	// w.	
      }
      else {				// position odd#'d vertices at center of the bottom cap:
        cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
        cylVerts[j+1] = 0.0;	
        cylVerts[j+2] =-height; 
        cylVerts[j+3] = 1.0;		
      }
    }

    return cylVerts
  }