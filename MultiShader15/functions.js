function cross(a,b) {
	return [
		a[1]*b[2] - a[2]*b[1],
		a[2]*b[0] - a[0]*b[2],
		a[0]*b[1] - a[1]*b[0],
    0
	]
}

function crossPt(p0, p1, p2){
  return cross(vec_from_to(p0, p1),vec_from_to(p0, p2))
}

function vec_from_to(p0, p1) {
  return p1.map(function(item, index) {
    return item - p0[index];
  })
}