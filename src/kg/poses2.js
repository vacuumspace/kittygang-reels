// Extra Kitty Gang poses for game reels (2026-11-26, user: "if characters need new poses, create them and use them").
// Same rig as kg.js / garba.js: each arm is [elbow, hand, tilt] in the 240 x 400 character frame (shoulders near
// x 78 / 162, y 200; head centred near x 120, y 120). Hands come from the existing hand library (open, relaxed, grip).
// To add a pose: add an entry here, render the pose sheet (node scripts/kg/pose-sheet.js) and check every character.
const { POSE6, HANDS6, putH, alongDeg } = require('./kg');

const openAt = (c, E, H, side) => putH(HANDS6.open(c, side), H, alongDeg(E, H) + 180, 0.95);
const relaxAt = (c, E, H, side) => putH(HANDS6.relaxed(c, side), H, alongDeg(E, H), 0.95);
const DOWN_L = [[78, 246], [76, 288], 0], DOWN_R = [[162, 246], [164, 288], 0];

const ADD = {
  // both arms up, open hands: winning, cheering
  cheer: { L: [[58, 184], [40, 120], 0], R: [[182, 184], [200, 120], 0], hands: (c, P) => openAt(c, P.L[0], P.L[1], 1) + openAt(c, P.R[0], P.R[1], -1) },
  // screen-right arm stretched forward and down: picking something up from a table or the floor
  reach: { L: DOWN_L, R: [[188, 252], [222, 286], 0], hands: (c, P) => relaxAt(c, P.L[0], P.L[1], 1) + openAt(c, P.R[0], P.R[1], -1) },
  // screen-right hand points up: "listen!", an idea, calling out a rule
  pointUp: { L: DOWN_L, R: [[184, 222], [196, 170], 0], hands: (c, P) => relaxAt(c, P.L[0], P.L[1], 1) + openAt(c, P.R[0], P.R[1], -1) },
  // palms up at the sides: "what?", "I don't know"
  shrug: { L: [[58, 240], [40, 222], 0], R: [[182, 240], [200, 222], 0], hands: (c, P) => openAt(c, P.L[0], P.L[1], 1) + openAt(c, P.R[0], P.R[1], -1) },
  // screen-right hand on the chin: thinking, deciding (the 3-second rule)
  thinking: { L: [[84, 250], [120, 252], 0], R: [[172, 236], [140, 176], 0], hands: (c, P) => relaxAt(c, P.L[0], P.L[1], 1) + relaxAt(c, P.R[0], P.R[1], -1) },
  // screen-right hand on the forehead: caught out, embarrassed
  facepalm: { L: DOWN_L, R: [[176, 222], [146, 124], 0], hands: (c, P) => relaxAt(c, P.L[0], P.L[1], 1) + openAt(c, P.R[0], P.R[1], -1) },
  // screen-right open palm held out at waist height: "here, like this", presenting a prop
  present: { L: DOWN_L, R: [[186, 238], [218, 236], 0], hands: (c, P) => relaxAt(c, P.L[0], P.L[1], 1) + openAt(c, P.R[0], P.R[1], -1) },
};
for (const [k, v] of Object.entries(ADD)) if (!POSE6[k]) POSE6[k] = v;
// where the screen-right hand ends up, as an offset from her feet per unit of scale (frame: centre x 120, feet y 400)
const handR = (pose) => { const P = POSE6[pose] || POSE6.wave; return [P.R[1][0] - 120, P.R[1][1] - 400]; };
module.exports = { ADD, handR };
