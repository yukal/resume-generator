// A4:
// 595.28 x 841.89 (pt)
// 21.0   x 29.7   (cm)
// 210    x 297    (mm)
//
// 1pt = 0,035 277 777 778    (cm)
// 1pt = 0,352 777 777 777 78 (mm)
// 1cm = 28,346 456 692 913   (pt)
// 1mm = 2,834 645 669 291 3  (pt)

const PT2CM = 0.035277777778;
const PT2MM = 0.35277777777778;
const CM2PT = 28.346456692913;
const MM2PT = 2.8346456692913;

const pointsToCentimeters = (pt) => pt * PT2CM;
const pointsToMillimeters = (pt) => pt * PT2MM;
const centimetersToPoints = (cm) => cm * CM2PT;
const millimetersToPoints = (mm) => mm * MM2PT;

module.exports = {
  cm: { toPoints: centimetersToPoints },
  mm: { toPoints: millimetersToPoints },
  pt: {
    toCentimeters: pointsToCentimeters,
    toMillimeters: pointsToMillimeters,
  },
};
