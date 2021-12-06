function make_tor_vertecies() {
        var rbar = 0.5
        var verts = makeTorus(rbar)
        var verts_n = makeTorus(rbar + 1)
        for(i = 0; i < verts_n.length; i++){
                verts_n[i] = verts_n[i] - verts[i]
        }
        var verts_norm = new Float32Array(2* verts.length)
        for(i = 0; i < verts.length; i += 4) {
                for(j = 0; j < 4; j++) {
                        verts_norm[2*i + j] = verts[i + j]
                        verts_norm[2*i + 4 + j] = verts_n[i + j]
                }
        }
        console.log(verts.length);
        console.log(verts_n.length);
        return verts_norm
}
function makeTorus(rbar) {
  
  var rbend = 1.0;											// radius of the bar we bent to form torus
  var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
                                      // more segments for more-circular torus
  var barSides = 13;										// # of sides of the bar (and thus the 

  var torVerts = new Float32Array(4*(2*barSides*barSlices +2));

  var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
  var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
                                        // (WHY HALF? 2 vertices per step in phi)
    // s counts slices of the bar; v counts vertices within one slice; j counts
    // array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
    for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
      for(v=0; v< 2*barSides; v++, j+=4) {		// for each vertex in this slice:
        if(v%2==0)	{	// even #'d vertices at bottom of slice,
          torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
                                               Math.cos((s)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
                                               Math.sin((s)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
        else {				// odd #'d vertices at top of slice (s+1);
                      // at same phi used at bottom of slice (v-1)
          torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
                                               Math.cos((s+1)*thetaStep);
                  //	x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
                                               Math.sin((s+1)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;		// w
        }
      }
    }
    // Repeat the 1st 2 vertices of the triangle strip to complete the torus:
    torVerts[j  ] = rbend + rbar;	// copy vertex zero;
            //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
    torVerts[j+1] = 0.0;
            //  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
    torVerts[j+2] = 0.0;
            //  z = -rbar  *   sin(phi==0)
    torVerts[j+3] = 1.0;		// w
    
    j+=4; // go to next vertex:
    torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
            //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
    torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
            //  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
    torVerts[j+2] = 0.0;
            //  z = -rbar  *   sin(phi==0)
    torVerts[j+3] = 1.0;		// w

    return torVerts;
}