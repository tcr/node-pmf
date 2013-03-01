// Normalization

var pmf = require('pmf');

var p = pmf.createPmf();
for (var x = 1; x < 7; x++) {
  p.set(x, 1);
}
p.normalize();
console.log(p.toJSON());



// Bowl of vanilla and chocolate cookies

z = pmf.createPmf();
z.set('Bowl 1', 0.5);
z.set('Bowl 2', 0.5);
z.multiply('Bowl 1', 0.75);
z.multiply('Bowl 2', 0.5);
z.normalize();
console.log(z.probability('Bowl 1'));





// Determine the number of sides of a die.

var dice = pmf.createSuite([4, 6, 8, 12, 20]);
dice.likelihood = function (numSides, outcome) {
  if (outcome > numSides || outcome <= 0) {
    return 0;
  } else {
    return 1 / numSides;
  }
};
dice.update([6, 4, 8, 7, 7, 2]);
console.log(dice.toJSON());




// Number of trians. Between 100 and 1000. You spot locomotive #321.

function xrange(b0, b1, quantum) {
  if (!quantum) { quantum = 1; }
  if (!b1) { b1 = b0; b0 = 0; }
  out = [];
  for (var i = b0, idx = 0; i < b1; i += quantum, idx++) {
    out[idx] = i;
  }
  return out;
}
var train = pmf.createSuite(xrange(100, 1001));
train.likelihood = function (hypo, data) {
  // hypo = hypothetical number of trains
  // data = train serial #
  if (data > hypo || data <= 0) {
    return 0;
  } else {
    return 1 / hypo;
  }
};
train.update([321, 500, 5]);
console.log(train.peak());





// Determining if the Euro is biased or fair

var euro = pmf.createSuite(xrange(0, 101));
euro.likelihood = function (hypo, data) {
  var x = hypo / 100.0;
  if (data == 'H') {
    return x;
  } else {
    return 1.0-x;
  }
}
euro.update('HHHHTTTT'.split(''));
console.log(euro.toJSON());