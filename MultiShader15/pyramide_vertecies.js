function make_pyramide_vertecies() {

  var p0 = [-1,-1,0,1]
  var p1 = [1,-1,0,1]
  var p2 = [1,1,0,1]
  var p3 = [-1,1,0,1]
  var pt = [0,0,1,1]

  var n0 = crossPt(p0, p2, p1)
  var n1 = crossPt(p0, p1, pt)
  var n2 = crossPt(p1, p2, pt)
  var n3 = crossPt(p2, p3, pt)
  var n4 = crossPt(p3, p0, pt)

  return new Float32Array([
    p0,n0, p1,n0, p2,n0,
    p0,n0, p2,n0, p3,n0,

    p0,n1, p1,n1, pt,n1,
    p1,n2, p2,n2, pt,n2,
    p2,n3, p3,n3, pt,n3,
    p3,n4, p0,n4, pt,n4,
  ].flat())
}