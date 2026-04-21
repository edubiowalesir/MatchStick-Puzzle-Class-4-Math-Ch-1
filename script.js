const SVG_NS = "http://www.w3.org/2000/svg";

function stickFromPoints(ax, ay, bx, by, id) {
  return {
    id,
    ax,
    ay,
    bx,
    by
  };
}

function scaleStick(stick, factor, dx = 0, dy = 0) {
  return stickFromPoints(
    stick.ax * factor + dx,
    stick.ay * factor + dy,
    stick.bx * factor + dx,
    stick.by * factor + dy,
    stick.id
  );
}

const staticFigureSticks = [
  stickFromPoints(46, 182, 90, 106),
  stickFromPoints(90, 106, 134, 182),
  stickFromPoints(46, 182, 134, 182),
  stickFromPoints(190, 182, 234, 106),
  stickFromPoints(234, 106, 278, 182),
  stickFromPoints(190, 182, 278, 182),
  stickFromPoints(334, 182, 378, 106),
  stickFromPoints(378, 106, 422, 182),
  stickFromPoints(334, 182, 422, 182)
];

const boardStart = [
  stickFromPoints(92, 278, 136, 202, "m1"),
  stickFromPoints(136, 202, 180, 278, "m2"),
  stickFromPoints(92, 278, 180, 278, "m3"),
  stickFromPoints(248, 278, 292, 202, "m4"),
  stickFromPoints(292, 202, 336, 278, "m5"),
  stickFromPoints(248, 278, 336, 278, "m6"),
  stickFromPoints(404, 278, 448, 202, "m7"),
  stickFromPoints(448, 202, 492, 278, "m8"),
  stickFromPoints(404, 278, 492, 278, "m9")
];

const movableTargets = {
  m1: stickFromPoints(248, 190, 324, 146, "m1"),
  m8: stickFromPoints(324, 146, 400, 190, "m8")
};

const movableIds = Object.keys(movableTargets);

const removeOriginalSticks = [
  stickFromPoints(55, 42, 125, 42, "r1"),
  stickFromPoints(55, 42, 90, 102, "r2"),
  stickFromPoints(125, 42, 90, 102, "r3"),
  stickFromPoints(90, 102, 178, 102, "r4"),
  stickFromPoints(90, 102, 55, 162, "r5"),
  stickFromPoints(55, 162, 125, 162, "r6"),
  stickFromPoints(90, 102, 125, 162, "r7"),
  stickFromPoints(212, 102, 177, 162, "r8"),
  stickFromPoints(177, 162, 247, 162, "r9"),
  stickFromPoints(212, 102, 247, 162, "r10"),
  stickFromPoints(292, 102, 257, 162, "r11"),
  stickFromPoints(257, 162, 327, 162, "r12"),
  stickFromPoints(292, 102, 327, 162, "r13")
];

const removeBoardSticks = removeOriginalSticks.map((stick) => scaleStick(stick, 1.3, 35, 18));
const removeIds = ["r1", "r2", "r3", "r4"];

const originalFigure = document.getElementById("original-figure");
const board = document.getElementById("interactive-board");
const resetBtn = document.getElementById("reset-btn");
const answerBtn = document.getElementById("answer-btn");
const statusText = document.getElementById("status-text");
const solutionNote = document.getElementById("solution-note");
const removeOriginalFigure = document.getElementById("remove-original-figure");
const removeBoard = document.getElementById("remove-board");
const removeResetBtn = document.getElementById("remove-reset-btn");
const removeAnswerBtn = document.getElementById("remove-answer-btn");
const removeStatusText = document.getElementById("remove-status-text");
const removeSolutionNote = document.getElementById("remove-solution-note");

const state = {
  placed: new Set()
};

const removeState = {
  removed: new Set()
};

function createSvgEl(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

function setMatchPosition(group, { ax, ay, bx, by }) {
  group.dataset.ax = String(ax);
  group.dataset.ay = String(ay);
  group.dataset.bx = String(bx);
  group.dataset.by = String(by);

  group.querySelector(".shadow-line").setAttribute("x1", String(ax + 6));
  group.querySelector(".shadow-line").setAttribute("y1", String(ay + 8));
  group.querySelector(".shadow-line").setAttribute("x2", String(bx + 6));
  group.querySelector(".shadow-line").setAttribute("y2", String(by + 8));

  group.querySelector(".wood").setAttribute("x1", String(ax));
  group.querySelector(".wood").setAttribute("y1", String(ay));
  group.querySelector(".wood").setAttribute("x2", String(bx));
  group.querySelector(".wood").setAttribute("y2", String(by));

  const tipLeft = group.querySelector(".tip-left");
  const tipRight = group.querySelector(".tip-right");
  tipLeft.setAttribute("cx", String(ax));
  tipLeft.setAttribute("cy", String(ay));
  tipRight.setAttribute("cx", String(bx));
  tipRight.setAttribute("cy", String(by));
}

function createMatchstick(stick, options = {}) {
  const classes = ["match"];
  if (options.movable) {
    classes.push("movable", "highlight");
  }
  if (options.removable) {
    classes.push("removable", "highlight");
  }

  const group = createSvgEl("g", {
    class: classes.join(" ")
  });

  if (stick.id) {
    group.dataset.id = stick.id;
  }

  const shadow = createSvgEl("line", {
    class: "shadow-line",
    "stroke-width": "10",
    "stroke-linecap": "round"
  });

  const wood = createSvgEl("line", {
    class: "wood",
    "stroke-width": "10",
    "stroke-linecap": "round",
    stroke: "url(#wood-gradient)"
  });

  const tipLeft = createSvgEl("circle", {
    class: "tip-left",
    r: "7.2",
    fill: "url(#tip-gradient)"
  });

  const tipRight = createSvgEl("circle", {
    class: "tip-right",
    r: "7.2",
    fill: "url(#tip-gradient)"
  });

  group.append(shadow, wood, tipLeft, tipRight);
  setMatchPosition(group, stick);

  return group;
}

function addDefs(svg) {
  const defs = createSvgEl("defs");

  const woodGradient = createSvgEl("linearGradient", {
    id: "wood-gradient",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%"
  });
  woodGradient.append(
    createSvgEl("stop", { offset: "0%", "stop-color": "#9e6c3f" }),
    createSvgEl("stop", { offset: "50%", "stop-color": "#d6b37a" }),
    createSvgEl("stop", { offset: "100%", "stop-color": "#7f5631" })
  );

  const tipGradient = createSvgEl("radialGradient", {
    id: "tip-gradient",
    cx: "50%",
    cy: "50%",
    r: "50%"
  });
  tipGradient.append(
    createSvgEl("stop", { offset: "0%", "stop-color": "#f28e68" }),
    createSvgEl("stop", { offset: "100%", "stop-color": "#a93621" })
  );

  defs.append(woodGradient, tipGradient);
  svg.append(defs);
}

function renderOriginalFigure() {
  addDefs(originalFigure);
  const backdrop = createSvgEl("rect", {
    x: "0",
    y: "0",
    width: "520",
    height: "230",
    fill: "transparent"
  });
  originalFigure.append(backdrop);
  staticFigureSticks.forEach((stick) => {
    originalFigure.append(createMatchstick(stick));
  });
}

function renderRemoveOriginalFigure() {
  addDefs(removeOriginalFigure);
  removeOriginalFigure.append(
    createSvgEl("rect", {
      x: "0",
      y: "0",
      width: "360",
      height: "250",
      fill: "transparent"
    })
  );
  removeOriginalSticks.forEach((stick) => {
    removeOriginalFigure.append(createMatchstick(stick));
  });
}

function addBoardDecor() {
  addDefs(board);

  board.append(
    createSvgEl("rect", {
      x: "0",
      y: "0",
      width: "620",
      height: "430",
      fill: "transparent"
    })
  );

  const glow = createSvgEl("ellipse", {
    cx: "310",
    cy: "312",
    rx: "180",
    ry: "54",
    fill: "rgba(239, 197, 115, 0.18)"
  });
  board.append(glow);

  const targetLayer = createSvgEl("g", { id: "target-layer" });
  movableIds.forEach((id, index) => {
    const target = movableTargets[id];
    const slot = createSvgEl("line", {
      class: "target-slot",
      "data-slot-id": id,
      x1: String(target.ax),
      y1: String(target.ay),
      x2: String(target.bx),
      y2: String(target.by)
    });
    targetLayer.append(slot);

    const ringX = (target.ax + target.bx) / 2;
    const ringY = (target.ay + target.by) / 2 - 36;
    const ring = createSvgEl("circle", {
      class: "target-ring",
      cx: String(ringX),
      cy: String(ringY),
      r: "16"
    });
    const label = createSvgEl("text", {
      class: "target-number",
      x: String(ringX),
      y: String(ringY + 6),
      "text-anchor": "middle"
    });
    label.textContent = String(index + 1);
    targetLayer.append(ring, label);
  });
  board.append(targetLayer);

  const flatLayout = createSvgEl("g", { class: "flat-layout", id: "flat-layout" });
  boardStart.forEach((stick) => {
    flatLayout.append(createMatchstick(stick, { movable: movableIds.includes(stick.id) }));
  });
  board.append(flatLayout);

  const arrowLayer = createSvgEl("g", { id: "arrow-layer" });
  movableIds.forEach((id) => {
    const start = boardStart.find((stick) => stick.id === id);
    const target = movableTargets[id];
    const arrow = createSvgEl("path", {
      class: "move-arrow",
      d: `M ${(start.ax + start.bx) / 2} ${(start.ay + start.by) / 2 - 26} Q ${((start.ax + start.bx) / 2 + (target.ax + target.bx) / 2) / 2} ${Math.min(start.ay, target.ay) - 70} ${(target.ax + target.bx) / 2} ${(target.ay + target.by) / 2 - 18}`
    });
    arrowLayer.append(arrow);
  });
  board.append(arrowLayer);

  const solved = createSolvedIllustration();
  board.append(solved);
}

function createSolvedIllustration() {
  const group = createSvgEl("g", { class: "solved-illustration", id: "solved-illustration" });

  const hiddenFace = createSvgEl("polygon", {
    class: "face-fill",
    points: "230,255 310,205 390,255",
    fill: "rgba(208, 169, 119, 0.22)",
    stroke: "rgba(154, 108, 64, 0.55)",
    "stroke-dasharray": "8 7"
  });

  const leftFace = createSvgEl("polygon", {
    class: "face-fill",
    points: "310,100 230,255 310,205",
    fill: "rgba(245, 196, 116, 0.55)",
    stroke: "rgba(190, 132, 47, 0.6)"
  });

  const rightFace = createSvgEl("polygon", {
    class: "face-fill",
    points: "310,100 310,205 390,255",
    fill: "rgba(230, 173, 94, 0.5)",
    stroke: "rgba(180, 115, 33, 0.6)"
  });

  const frontFace = createSvgEl("polygon", {
    class: "face-fill",
    points: "310,100 230,255 390,255",
    fill: "rgba(255, 230, 176, 0.42)",
    stroke: "rgba(202, 155, 73, 0.5)"
  });

  const label = createSvgEl("text", {
    x: "310",
    y: "348",
    "text-anchor": "middle",
    fill: "#8a5a2b",
    "font-size": "24",
    "font-weight": "800"
  });
  label.textContent = "4 triangular faces: 3 visible + 1 hidden";

  const faceLabels = [
    { x: 268, y: 192, text: "Face 1" },
    { x: 352, y: 192, text: "Face 2" },
    { x: 310, y: 272, text: "Face 3" },
    { x: 310, y: 228, text: "Face 4 hidden", hidden: true }
  ].map(({ x, y, text, hidden }) => {
    const node = createSvgEl("text", {
      class: `face-label${hidden ? " hidden" : ""}`,
      x: String(x),
      y: String(y),
      "text-anchor": "middle"
    });
    node.textContent = text;
    return node;
  });

  const solvedSticks = [
    stickFromPoints(310, 100, 230, 255),
    stickFromPoints(310, 100, 390, 255),
    stickFromPoints(230, 255, 390, 255),
    stickFromPoints(310, 100, 310, 205),
    stickFromPoints(230, 255, 310, 205),
    stickFromPoints(310, 205, 390, 255)
  ];

  group.append(hiddenFace, leftFace, rightFace, frontFace);
  solvedSticks.forEach((stick) => group.append(createMatchstick(stick)));
  faceLabels.forEach((node) => group.append(node));
  group.append(label);
  return group;
}

function addRemoveBoardDecor() {
  addDefs(removeBoard);

  removeBoard.append(
    createSvgEl("rect", {
      x: "0",
      y: "0",
      width: "520",
      height: "320",
      fill: "transparent"
    })
  );

  const glow = createSvgEl("ellipse", {
    cx: "255",
    cy: "248",
    rx: "180",
    ry: "48",
    fill: "rgba(239, 197, 115, 0.14)"
  });
  removeBoard.append(glow);

  const flatLayout = createSvgEl("g", { id: "remove-layout" });
  removeBoardSticks.forEach((stick, index) => {
    flatLayout.append(
      createMatchstick(stick, { removable: removeIds.includes(removeBoardSticks[index].id) })
    );
  });
  removeBoard.append(flatLayout);

  const answerOverlay = createSvgEl("g", {
    id: "remove-answer-overlay",
    class: "solved-illustration"
  });

  const labels = [
    { x: 139, y: 255, text: "Triangle 1" },
    { x: 305, y: 255, text: "Triangle 2" },
    { x: 409, y: 255, text: "Triangle 3" }
  ];
  labels.forEach(({ x, y, text }) => {
    const node = createSvgEl("text", {
      class: "face-label",
      x: String(x),
      y: String(y),
      "text-anchor": "middle"
    });
    node.textContent = text;
    answerOverlay.append(node);
  });

  const note = createSvgEl("text", {
    x: "260",
    y: "292",
    class: "face-label",
    "text-anchor": "middle"
  });
  note.textContent = "Only 3 triangles remain";
  answerOverlay.append(note);
  removeBoard.append(answerOverlay);
}

function getMatches() {
  return Array.from(board.querySelectorAll(".match[data-id]"));
}

function getMatchById(id) {
  return board.querySelector(`.match[data-id="${id}"]`);
}

function getSlotById(id) {
  return board.querySelector(`.target-slot[data-slot-id="${id}"]`);
}

function getRemoveMatchById(id) {
  return removeBoard.querySelector(`.match[data-id="${id}"]`);
}

function updateStatus() {
  if (state.placed.size === movableIds.length) {
    statusText.textContent = "Solved! The answer is a 3D tetrahedron with 4 triangular faces.";
  } else {
    statusText.textContent = `Click ${movableIds.length - state.placed.size} more glowing stick${movableIds.length - state.placed.size === 1 ? "" : "s"} to move ${movableIds.length - state.placed.size === 1 ? "it" : "them"} into place.`;
  }
}

function placeMatch(match, target) {
  setMatchPosition(match, target);
  state.placed.add(match.dataset.id);
  match.classList.remove("active");
  getSlotById(match.dataset.id).classList.add("filled");
}

function resetMatch(match) {
  const start = boardStart.find((stick) => stick.id === match.dataset.id);
  setMatchPosition(match, start);
  match.classList.remove("active");
  getSlotById(match.dataset.id).classList.remove("filled");
}

function checkSolved() {
  if (state.placed.size !== movableIds.length) {
    return;
  }

  board.classList.add("solved");
  const solvedIllustration = document.getElementById("solved-illustration");
  solvedIllustration.classList.add("visible");
  solutionNote.hidden = false;
  updateStatus();
}

function handleBoardClick(event) {
  if (board.classList.contains("solved")) {
    return;
  }

  const match = event.target.closest(".match.movable");
  if (match && !state.placed.has(match.dataset.id)) {
    match.classList.add("active");
    placeMatch(match, movableTargets[match.dataset.id]);
    updateStatus();
    checkSolved();
    return;
  }
}

function resetBoard() {
  state.placed.clear();
  board.classList.remove("solved");
  solutionNote.hidden = true;
  document.getElementById("solved-illustration").classList.remove("visible");

  getMatches().forEach((match) => resetMatch(match));
  updateStatus();
}

function showAnswer() {
  resetBoard();
  movableIds.forEach((id) => {
    placeMatch(getMatchById(id), movableTargets[id]);
  });
  updateStatus();
  checkSolved();
}

function updateRemoveStatus() {
  if (removeState.removed.size === removeIds.length) {
    removeStatusText.textContent = "Solved! After removing 4 sticks, only 3 triangles remain.";
  } else {
    removeStatusText.textContent = `Remove ${removeIds.length - removeState.removed.size} more glowing stick${removeIds.length - removeState.removed.size === 1 ? "" : "s"}.`;
  }
}

function resetRemoveBoard() {
  removeState.removed.clear();
  removeBoard.classList.remove("solved");
  removeSolutionNote.hidden = true;
  removeBoard.querySelector("#remove-answer-overlay").classList.remove("visible");
  removeBoard.querySelectorAll(".match.removable").forEach((match) => {
    match.classList.remove("removed");
  });
  updateRemoveStatus();
}

function checkRemoveSolved() {
  if (removeState.removed.size !== removeIds.length) {
    return;
  }

  removeBoard.classList.add("solved");
  removeSolutionNote.hidden = false;
  removeBoard.querySelector("#remove-answer-overlay").classList.add("visible");
  updateRemoveStatus();
}

function handleRemoveBoardClick(event) {
  const match = event.target.closest(".match.removable");
  if (!match || match.classList.contains("removed")) {
    return;
  }

  match.classList.add("removed");
  removeState.removed.add(match.dataset.id);
  updateRemoveStatus();
  checkRemoveSolved();
}

function showRemoveAnswer() {
  resetRemoveBoard();
  removeIds.forEach((id) => {
    const match = getRemoveMatchById(id);
    if (match) {
      match.classList.add("removed");
      removeState.removed.add(id);
    }
  });
  updateRemoveStatus();
  checkRemoveSolved();
}

renderOriginalFigure();
addBoardDecor();
updateStatus();
renderRemoveOriginalFigure();
addRemoveBoardDecor();
updateRemoveStatus();

board.addEventListener("click", handleBoardClick);
resetBtn.addEventListener("click", resetBoard);
answerBtn.addEventListener("click", showAnswer);
removeBoard.addEventListener("click", handleRemoveBoardClick);
removeResetBtn.addEventListener("click", resetRemoveBoard);
removeAnswerBtn.addEventListener("click", showRemoveAnswer);
