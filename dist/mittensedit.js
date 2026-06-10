/*
MittensEdit
Copyright (C) 2026 killsushi!Basque9Dpk

This file incorporates work covered by the following copyright:
Orinrin Editor : AsciiArt Story Editor for Japanese Only (https://github.com/SikigamiHNQ/OrinrinEditor/)
Copyright (C) 2011 - 2013 Orinrin/SikigamiHNQ

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program.
If not, see <http://www.gnu.org/licenses/>.
*/

// For highlighting spaces
const unicodespacematcher = /[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003]/gu;
const spacematcher = /[\u0020\u3000]/gu;


const mouseposition = document.getElementById('mouseposition');

const mousePositionListener = EditorView.domEventHandlers({
  mousemove(event, view) {
    const rect = view.contentDOM.getBoundingClientRect();
    xpos = Math.round(event.clientX - rect.left);
    ypos = Math.floor((event.clientY - rect.top) / 18);
    
    mouseposition.innerText = xpos + '[dot] ' + ypos + '[line]';
  },
  
  mouseleave() {
    mouseposition.innerText = '0[dot] 0[line]';
  }
});


const caretposition = document.getElementById('caretposition');

let timeoutCaretIndicator;
function updateCaretIndicator(state) {  
  timeoutCaretIndicator = setTimeout(function() {
    const head = state.selection.main.head;
    const line = state.doc.lineAt(head);
    const linenum = line.number;
    const charnum = head - line.from;
    const pxoffset = measureLine(state.doc.sliceString(line.from, head));
    caretposition.innerText = pxoffset + '[dot] ' + charnum + '[char] ' + linenum +'[line]';
  }, 50);
}

const caretPositionListener = EditorView.updateListener.of((update) => {
  if (update.selectionSet || update.docChanged) {
    updateCaretIndicator(update.state); 
  }
});


// Allows multi-selected areas to be dragged to a different location
const multiSelectionDragExtension = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (view.state.selection.ranges.length <= 1) return false; // Return early if normal selection.
    
    const clickPos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (clickPos === null) return false;
    
    // Check if the click occurred inside any of the active selections
    const isInsideSelection = view.state.selection.ranges.some(
      range => clickPos >= range.from && clickPos <= range.to
    );
    
    if (!isInsideSelection) return false;
    
    event.preventDefault();
    
    const startX = event.clientX;
    const startY = event.clientY;
    let isDragging = false;
    const dragThreshold = 4; // Distance in pixels considered a drag
    
    function handleMouseMove(e) {
      if (!isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // Check if cursor moved far enough to count as a drag action
        if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
          isDragging = true;
          view.dom.style.cursor = "move";
        }
      }
    }
    
    function handleMouseUp(upEvent) {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      view.dom.style.cursor = "";

      const dropPos = view.posAtCoords({ x: upEvent.clientX, y: upEvent.clientY });

      if (isDragging) {
        if (dropPos !== null) {
          const extractedAA = extractAA(view);
          
          const line = view.state.doc.lineAt(dropPos);
          const txtbeforecursor = view.state.doc.sliceString(line.from, dropPos);
          const offset = measureLine(txtbeforecursor);
          
          const insertions = rectangleInsert(view.state, extractedAA, line.number, offset);
          const removals = view.state.selection.ranges.map(r => {
            return {from: r.from, to: r.to, insert: ""};
          });
          
          const changes = [...removals, ...insertions];
          
          view.dispatch({
            changes: changes,
            selection: EditorSelection.cursor(dropPos)
          });
        }
      }
      else {
        // If it was a click without dragging, clear selections and move the caret like normal.
        view.dispatch({
          selection: EditorSelection.cursor(clickPos),
          userEvent: "select"
        });
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return true;
  }
});


/**
 * Higher-order function to move/extend only the primary (main) selection.
 * This exists because I was getting ticked off by only being able to multi-select by mouse.
 * @param {"left" | "right" | "up" | "down"} direction
 * @param {boolean} extend - True if extending selection (Shift), false if only moving caret.
 */
function moveMainCaretOnly(direction, extend) {
  return (view) => {
    const sel = view.state.selection;
    const mainrange = sel.main;
    
    let newmainrange;

    // Calculate next main caret position
    if (direction === "left") newmainrange = view.moveByChar(mainrange, false);
    else if (direction === "right") newmainrange = view.moveByChar(mainrange, true);
    else if (direction === "up") newmainrange = view.moveVertically(mainrange, false);
    else if (direction === "down") newmainrange = view.moveVertically(mainrange, true);

    if (!newmainrange) return false;

    const otherRanges = sel.ranges.filter((_, i) => i !== sel.mainIndex); // view.state.selection.mainIndex is the index of the selection Codemirror marks as main.

    if (!extend) {
      if (!mainrange.empty) {
        otherRanges.push(mainrange);
      }
      newmainrange = EditorSelection.cursor(newmainrange.head);
    }
    else {
      newmainrange = EditorSelection.range(mainrange.anchor, newmainrange.head);
    }

    // If the new selection overlaps old selections, wipe the old ones out.
    const filteredOtherRanges = otherRanges.filter((r) => {
      if (newmainrange.empty) return true;

      const maxFrom = Math.max(r.from, newmainrange.from);
      const minTo = Math.min(r.to, newmainrange.to);
      return maxFrom >= minTo; 
    });

    const finalranges = [...filteredOtherRanges, newmainrange];

    const newselection = EditorSelection.create(finalranges, finalranges.length - 1); // Second param sets main selection to last in array

    view.dispatch({
      selection: newselection,
      scrollIntoView: true
    });

    return true;
  };
}

// keymap for multi-selection thing
const keyboardMultiselectionShortcuts = keymap.of([
  // Independent main caret movement / splitting off
  { key: "Alt-ArrowLeft", run: moveMainCaretOnly("left", false) },
  { key: "Alt-ArrowRight", run: moveMainCaretOnly("right", false) },
  { key: "Alt-ArrowUp", run: moveMainCaretOnly("up", false) },
  { key: "Alt-ArrowDown", run: moveMainCaretOnly("down", false) },

  // Extend main caret selection
  { key: "Alt-Shift-ArrowLeft", run: moveMainCaretOnly("left", true) },
  { key: "Alt-Shift-ArrowRight", run: moveMainCaretOnly("right", true) },
  { key: "Alt-Shift-ArrowUp", run: moveMainCaretOnly("up", true) },
  { key: "Alt-Shift-ArrowDown", run: moveMainCaretOnly("down", true) },
]);


// StateEffects for line flashing.
const addFlashEffect = StateEffect.define();
const removeFlashEffect = StateEffect.define();

let flashIdCounter = 0;

const lineFlashExtension = [
  StateField.define({
    create() {
      return Decoration.none;
    },
    update(decorations, tr) {
      // Map existing decorations through document changes. Not sure if this is needed.
      decorations = decorations.map(tr.changes);

      for (let effect of tr.effects) {
        if (effect.is(addFlashEffect)) {
          const { pos, id, text } = effect.value; 

          // Assign the string to a data-attribute if it exists
          const attributes = { class: "cm-line-flash-red" };
          if (text) {
            attributes["data-flash-text"] = text; 
          }

          decorations = decorations.update({
            add: [
              Decoration.line({
                attributes: attributes,
                id: id
              }).range(pos)
            ]
          });
        } else if (effect.is(removeFlashEffect)) {
          const idToRemove = effect.value;
          // Filter out the decoration when its timer expires
          decorations = decorations.update({
            filter: (from, to, value) => value.spec.id !== idToRemove
          });
        }
      }
      return decorations;
    },
    provide: (f) => EditorView.decorations.from(f)
  }),

  // Theme injected into CodeMirror for line flash.
  EditorView.theme({
    "@keyframes cm-flash-red-anim": {
      "0%": { backgroundColor: "rgba(255, 0, 0)" },
      "100%": { backgroundColor: "transparent" },
    },
    ".cm-line-flash-red": {
      position: "relative",
      animation: "cm-flash-red-anim 1s steps(1)",
    },
    // Pseudo-element used for text overlay because I am lazy.
    ".cm-line-flash-red[data-flash-text]::after": {
      content: "attr(data-flash-text)", // Reads the string from the line decoration
      position: "absolute",
      left: "0",
      top: "0",
      height: "0",
      width: "0",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      color: "#ffff00",
      letterSpacing: '1px',
      textShadow: '1px 0, 0.5px 0',
      zIndex: 10,
      animation: "cm-flash-red-anim 0.9s steps(1)"
    }
  })
];

/**
 * Triggers a brief red flash on a given line, with an optional text overlay.
 * Used by automatic space adjustment to indicate failures to adjust.
 * @param {EditorView} view - The CodeMirror editor view.
 * @param {number} lineStartPos - The document position where the line starts.
 * @param {string} [overlayText=""] - The string to flash as an overlay.
 */
function flashLine(view, lineStartPos, overlayText = "") {
  const id = flashIdCounter++;

  view.dispatch({
    effects: addFlashEffect.of({ pos: lineStartPos, id, text: overlayText })
  });

  // Clean up the decoration after the CSS animation finishes
  setTimeout(() => {
    if (view.dom.isConnected) {
      view.dispatch({
        effects: removeFlashEffect.of(id)
      });
    }
  }, 1000); // Matches the CSS animation duration
}


// Really lazy way of blocking commands from modifying the document during blockpaste preview.
// They still run but the transaction gets ignored. Fix that later.
const allowChangesDuringReadOnly = Annotation.define();

const globalReadOnlyGuard = EditorState.changeFilter.of((tr) => {
  if (tr.state.readOnly && tr.docChanged) {
    // Only allow blockpaste preview to go through
    if (tr.annotation(allowChangesDuringReadOnly)) {
      return true;
    }
    return false; // Block everything else
  }
  return true;
});


const layerBoxPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    // Cache the container directly on the view instance so it survives state resets
    if (!view.cmLayerBoxContainer) {
      view.cmLayerBoxContainer = document.createElement("div");
      view.cmLayerBoxContainer.className = "cm-layerbox-container";

      const layerboxorigin = document.createElement("div");
      layerboxorigin.className = "cm-layerbox-origin";
      view.cmLayerBoxContainer.appendChild(layerboxorigin);
    }

    this.dom = view.cmLayerBoxContainer;

    // Ensure it is attached to the current scrollDOM if it isn't already
    if (this.dom.parentNode !== view.scrollDOM) {
      view.scrollDOM.appendChild(this.dom);
    }
  }
  
  update() {
    // Might be worth adding some geometry update logic to ensure the layerboxes
    // are always synced up with the background.
  }

  destroy() {
    // Never remove this plugin, it stays attached to view.scrollDOM during state swaps
    //this.dom.remove();
  }
});

const tracePlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    if (!view.cmTraceBg) {
      view.cmTraceBg = document.createElement("div");
      view.cmTraceBg.className = "cm-trace-bg";

      const traceimage = document.createElement("img");
      traceimage.src = "res/mittens.gif";
      traceimage.className = "cm-trace-img";
      view.cmTraceBg.appendChild(traceimage);
    }

    this.dom = view.cmTraceBg;

    // Ensure it is attached to the current scrollDOM if it isn't already
    if (this.dom.parentNode !== view.scrollDOM) {
      view.scrollDOM.appendChild(this.dom);
    }
  }
  
  update() {
  }

  destroy() {
    // Never remove this plugin, it stays attached to view.scrollDOM during state swaps
    //this.dom.remove();
  }
});

const unicodespaceDecorator = new MatchDecorator({
  regexp: unicodespacematcher,
  decoration: () => Decoration.mark({ class: "cm-unispace-highlight" })
});

const spaceDecorator = new MatchDecorator({
  regexp: spacematcher,
  decoration: () => Decoration.mark({ class: "cm-space-highlight" })
});

const badspaceDecorator = new MatchDecorator({
  regexp: /^\u0020(\u0020)*|\u0020(\u0020)+|\t(\t)*/gu, // Detects tab characters too in case they get pasted in
  decoration: () => Decoration.mark({ class: "cm-badspace-highlight" })
});

const unicodespaceDecoratorPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = unicodespaceDecorator.createDeco(view);
  }
  update(update) {
    this.decorations = unicodespaceDecorator.updateDeco(update, this.decorations);
  }
}, {
  decorations: v => v.decorations
});

const spaceDecoratorPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = spaceDecorator.createDeco(view);
  }
  update(update) {
    this.decorations = spaceDecorator.updateDeco(update, this.decorations);
  }
}, {
  decorations: v => v.decorations
});

const badspaceDecoratorPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = badspaceDecorator.createDeco(view);
  }
  update(update) {
    this.decorations = badspaceDecorator.updateDeco(update, this.decorations);
  }
}, {
  decorations: v => v.decorations
});


const AATheme = EditorView.theme({
  "&": {
    fontFamily: "Saitamaar",
    fontSize: "16px",
    lineHeight: "18px",
    backgroundColor: "#EFEFEF",
    //width: "100%",
    height: "100%",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-content": {
    fontFamily: "Saitamaar",
    fontSize: "16px",
    lineHeight: "18px",
    padding: "0",
    zIndex: "1",
  },
  ".cm-line": {
    padding: "0",
    paddingLeft: "0px",
  },
  ".cm-space-highlight": {
    boxShadow: "0px 2px 0.1px -1px #bbb",
  },
  ".cm-unispace-highlight": {
    backgroundColor: "#ccfc",
  },
  ".cm-badspace-highlight": {
    backgroundColor: "#ff000055",
  },
  "& .cm-cursor": {
    width: "2px",
    borderLeft: "none",
    borderRight: "1.2px solid #8000ff",
  },
  ".cm-layerbox-container": {
    position: "absolute",
    pointerEvents: "none",
    width: "100%",
    height: "100%",
    overflow: "none",
    contain: "style size",
  },
  ".cm-layerbox-origin": {
    position: "absolute",
    pointerEvents: "none",
    top: "-1px",
    left: "-1px",
    width: "0",
    height: "0",
    contain: "style size",
  },
  ".cm-layerbox": {
    position: "absolute",
    zIndex: "100",
    pointerEvents: "auto",
    boxSizing: "border-box",
    padding: "0",
    cursor: "move",
  },
  ".cm-layerbox textarea": {
    display: "block",
    boxSizing: "border-box",
    whiteSpace: "pre",
    overflowWrap: "normal",
    overflow: "hidden",
    fontFamily: "Saitamaar",
    fontSize: "16px",
    lineHeight: "18px",
    border: "1px solid black",
    backgroundColor: "#f1f1f1f3",
    margin: "0",
    //marginTop: "-1px", // Negative margins used to stop text inside layerbox
    //marginLeft: "-1px", // from being offset from main editor due to border width
    marginBottom: "0px",  // Nevermind, fixed by changing origin position instead.
    padding: "0 !important",
    minWidth: "100px",
    color: "#000",
  },
  ".cm-layerbox textarea[disabled]": {
    pointerEvents: "none",
    color: "#000000",
    //color: "#931d1d",
    //color: "#992020",
    //backgroundColor: "#f1f1f1dd",
    backgroundColor: "#f3f3f3c6",
    //backgroundColor: "#efefefcf",
    //backgroundColor: "#efefefd4",
    //backgroundColor: "#efefefc5",
    border: "1px solid transparent",//"1px solid #39808073", //#39808063
    boxShadow: "0 0 2px #0004",
    //textShadow: "1px 1px #fff3, -1px -1px #fff3, 1px -1px #fff3, -1px 1px #fff3, 0 0 3px #fff",
    //textShadow: "0 0 3px #fff",
    //textShadow: "0 0 6px #3777324a",
    //textShadow: "0 0 6px #ededed",
  },
  ".cm-layerbox:focus, .cm-framebox:focus": {
    outline: "none",
  },
  ".cm-layerbox:focus textarea, .cm-layerbox textarea:focus, .cm-framebox:focus .cm-framebox-frame": {
    outline: "1px solid #12f80e43",
    outlineOffset: "-3px",
    //boxShadow: "0 0 6px 3px #98ea6b33",
  },
  ".cm-layerbox textarea:focus": {
    boxShadow: "0 0 6px 3px #98ea6b33",
  },
  ".layerbox-menu button, .framebox-menu button, .cm-guideline button": {
    boxSizing: "border-box",
    border: "1px solid black",
    borderRadius: "0",
    height: "20px",
    width: "20px",
    padding: "0px",
    margin: "0",
    lineHeight: "0px",
    float: "right",
    marginLeft: "5px",
    marginRight: "1px",
    marginTop: "1px",
    fontFamily: "sans-serif",
    backgroundColor: "transparent",
    background: "linear-gradient(135deg, #09009f11, 60%, #0004)",
    boxShadow: "inset 1px 1px 0 #fff9, inset -1px -1px 0 #59595990, 1px 1px 0 #b2b2b2",
    cursor: "pointer",
  },
  ".layerbox-menu .x-button, .framebox-menu .x-button, .cm-guideline .x-button": {
    marginLeft: "0px",
    backgroundColor: "#ff000055",
    background: "linear-gradient(135deg, #f005, 60%, #8005)",
    boxShadow: "inset 1px 1px 0 #fff9, inset -1px -1px 0 #88455990, 1px 1px 0 #b2b2b2",
  },
  ".layerbox-menu": {
    height: "22px",
    position: "relative",
    boxSizing: "border-box",
  },
  ".layerbox-menu:before": {
    content: '""',
    overflow: "none",
    position: "absolute",
    height: "20px",
    top: "1px",
    left: "0px",
    right: "104px",
    //backgroundColor: "#f3f3f3d8",
    backgroundColor: "#39808043",
    boxSizing: "border-box",
    clipPath: "polygon(0% 0%, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%)",
    //boxShadow: "inset 1.2px 1.2px #39808073, inset -1.2px -1.2px #39808073",
  },
  ".cm-line:not(:has(br)):after": {
    content: '"↓"',
    color: "#008080",
    position: "absolute",
  },
  ".cm-line:not(:last-of-type):has(br):before": {
    content: '"↓"',
    color: "#008080",
    position: "absolute",
  },
  ".cm-line:last-of-type:has(br):before": {
    content: '"[EOF]"',
    color: "#008080",
    position: "absolute",
  },
  ".cm-line:last-of-type:not(:has(br)):after": {
    content: '"[EOF]"',
    color: "#008080",
    position: "absolute",
  },
  ".cm-trace-bg": {
    display: "none",
    position: "absolute",
    pointerEvents: "none",
    zIndex: "0",
    padding: "0",
    margin: "0",
  },
  ".cm-trace-img": {
    display: "block",
    margin: "0",
    padding: "0",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    //backgroundColor: "#d4f0d4"
    //backgroundColor: "#d8ead8"
    backgroundColor: "#89cc7333"
  },
  ".cm-selectionBackground": {
    //backgroundColor: "#d8ead8"
    backgroundColor: "#89cc7333"
  },
  "&.cm-editor ::selection": {
    //backgroundColor: "#d4f0d4"
    //backgroundColor: "#d8ead8"
    backgroundColor: "#89cc7333"
  },
  ".cm-framebox": {
    position: "absolute",
    zIndex: "100",
    pointerEvents: "auto",
    boxSizing: "border-box",
    padding: "0",
    cursor: "move",
    margin: "0",
    padding: "0",
  },
  ".cm-framebox-frame": {
    position: "relative",
    background: "transparent",
    border: "1px solid transparent",
    boxShadow: "0 0 5px #0004",
    margin: "0",
    padding: "0",
  },
  ".cm-framebox-draggable": {
    height: "100%",
    width: "100%",
    margin: "0",
    padding: "0",
    overflow: "clip",
  },
  ".cm-framebox-resize-right": {
    position: "absolute",
    width: "8px",
    height: "100%",
    right: "-1px",
    bottom: "0",
    background: "transparent",
    cursor: "e-resize",
  },
  ".cm-framebox-resize-left": {
    position: "absolute",
    width: "8px",
    height: "100%",
    left: "-1px",
    bottom: "0",
    background: "transparent",
    cursor: "e-resize",
  },
  ".cm-framebox-resize-top": {
    position: "absolute",
    height: "8px",
    width: "100%",
    right: "0",
    top: "-1px",
    background: "transparent",
    cursor: "n-resize",
  },
  ".cm-framebox-resize-bottom": {
    position: "absolute",
    height: "8px",
    width: "100%",
    right: "0",
    bottom: "-1px",
    background: "transparent",
    cursor: "n-resize",
  },
  ".cm-framebox-resize-topright": {
    position: "absolute",
    width: "8px",
    height: "8px",
    right: "-1px",
    top: "-1px",
    background: "transparent",
    cursor: "ne-resize",
  },
  ".cm-framebox-resize-bottomright": {
    position: "absolute",
    width: "8px",
    height: "8px",
    right: "-1px",
    bottom: "-1px",
    background: "transparent",
    cursor: "nw-resize",
  },
  ".cm-framebox-resize-topleft": {
    position: "absolute",
    width: "8px",
    height: "8px",
    left: "-1px",
    top: "-1px",
    background: "transparent",
    cursor: "nw-resize",
  },
  ".cm-framebox-resize-bottomleft": {
    position: "absolute",
    width: "8px",
    height: "8px",
    left: "0",
    bottom: "0",
    background: "transparent",
    cursor: "ne-resize",
  },
  ".frame-wrapper": {
    whiteSpace: "pre",
    fontFamily: "Saitamaar",
    fontSize: "16px",
    lineHeight: "18px",
    overflow: "clip",
    userSelect: "none",
    WebkitUserSelect: "none",
    margin: "0",
    padding: "0",
  },
  ".frame-wrapper span": {
    backgroundColor: "#efefef",
    display: "inline-block",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  ".framebox-menu": {
    position: "absolute",
    bottom: "100%",
    minWidth: "100px",
    display: "flex",
    flexWrap: "nowrap",
    //backgroundColor: "#39808043",
  },
  ".cm-framebox select": {
    borderRadius: "0",
    border: "1px solid #888",
    background: "#f1f1f1dd",
    font: '13px "MS PGothic"',
  },
  ".framebox-menu *:focus ": {
    outline: "1px solid #12f80eaa",
    outlineOffset: "-2px",
  },
  ".cm-guideline-origin": {
    position: "absolute",
    pointerEvents: "none",
    top: "0",
    left: "0",
    width: "0",
    height: "0",
    contain: "style size",
    zIndex: "10",
  },
  ".cm-guideline": {
    position: "absolute",
    pointerEvents: "auto",
  },
  ".cm-guideline .x-button": {
    position: "absolute",
    left: "-9px",
  },
  ".cm-guideline-breakout": {
    borderImage: "conic-gradient(#00f2 0 0) fill 0//1000vh 0",
    width: "1px",
    height: "1px",
  },
});

// Codemirror has built-in line-copy / line-cut behavior by default, disable that.
const disableEmptyCopyCut = EditorView.domEventHandlers({
  copy(event, view) {
    if (view.state.selection.main.empty) return true; // Return true if selection is empty to stop copy
    return false; // Otherwise let it propagate
  },
  cut(event, view) {
    if (view.state.selection.main.empty) return true;
    return false;
  }
});

// Needed because minimalsetup includes indentation
const noIndent = keymap.of([
  {
    key: "Enter",
    run: (view) => {
      view.dispatch(view.state.replaceSelection("\n"));
      return true;
    }
  }
]);

const keyboardShortcuts = keymap.of([
  {key: "Ctrl-Space", run: changeBlockpasteStatus},
  {key: "Ctrl-ArrowRight", run: (view) => {adjustSpace(view, true); return true;}},
  {key: "Ctrl-ArrowLeft", run: (view) => {adjustSpace(view, false); return true;}},
  {key: "Ctrl-Alt-c", run: extractionCopy},
  {key: "Ctrl-Alt-x", run: extractionCut},
  {key: "Ctrl-Shift-e", run: setAutoAdjustWidth},
  {key: "Ctrl-e", run: executeAutoAdjust},
  {key: "Shift-Enter", run: shiftCursorsDown},
  {key: "Alt-u", run: (view) => {return true;}}, // Alt-u is by default redo. I want it to do nothing so that the document-level EventListener for toggling unicode-mode will handle it.
  {key: "Ctrl-Shift-z", run: redo, preventDefault: true},
  {key: "Ctrl-Shift-ArrowRight", run: incrementByOnePx},
  {key: "Ctrl-Shift-ArrowLeft", run: decrementByOnePx},
  {key: "Ctrl-Alt-r", run: addBarToEnd},
  {key: "Ctrl-Shift-g", run: removeFinalChar},
  {key: "Ctrl-g", run: removeTrailingWhitespace},
  {key: "Ctrl-Alt-g", run: replaceSelectionWithSpaces},
  {key: "Ctrl-i", run: prependInitialSpaces},
  {key: "Ctrl-u", run: removeInitialSpaces, preventDefault: true},
]);

const aaeditor = new EditorView({
  doc: defaultstring,
  extensions: [
    mousePositionListener,
    caretPositionListener,
    
    globalReadOnlyGuard,
    pastePreviewCompartment.of([]),
      
    lineFlashExtension,
  
    tracePlugin,
    layerBoxPlugin,
    
    unicodespaceDecoratorPlugin,
    spaceDecoratorPlugin,
    badspaceDecoratorPlugin,
    
    EditorState.allowMultipleSelections.of(true),

    rectangularSelection(),
    crosshairCursor(),

    brushCompartment.of([]),
    
    multiSelectionDragExtension,
    
    keyboardMultiselectionShortcuts,

    keyboardShortcuts,
    /*keymap.of([{key: "Ctrl-Space", run: changeBlockpasteStatus}]),
    keymap.of([{key: "Ctrl-ArrowRight", run: (view) => {adjustSpace(view, true); return true;}}]),
    keymap.of([{key: "Ctrl-ArrowLeft", run: (view) => {adjustSpace(view, false); return true;}}]),
    keymap.of([{key: "Ctrl-Alt-c", run: extractionCopy}]),
    keymap.of([{key: "Ctrl-Alt-x", run: extractionCut}]),
    keymap.of([{key: "Ctrl-Shift-e", run: setAutoAdjustWidth}]),
    keymap.of([{key: "Ctrl-e", run: executeAutoAdjust}]),
    keymap.of([{key: "Shift-Enter", run: shiftCursorsDown}]),
    keymap.of([{key: "Alt-k", run: nudgeLeftFromCaret}]),
    keymap.of([{key: "Alt-l", run: nudgeRightFromCaret}]),
    keymap.of([{key: "Ctrl-u", run: (view) => {return true;}}]), // Ctrl-u is by default undo. I want it to do nothing so that the document-level EventListener for toggling unicode-mode will handle it
    //keymap.of([{key: "Alt-m", run: mirrorHorizontallyByLine}]),
    //keymap.of([{key: "Alt-n", run: mirrorHorizontallyBySelection}]),
    //keymap.of([{key: "Ctrl-m", run: mirrorVertically}]),
    //keymap.of([{key: "Ctrl-Alt-m", run: mirrorVerticallyRectangleSelect}]),
    keymap.of([{key: "Ctrl-Shift-z", run: redo, preventDefault: true}]),*/

    pasteHandler,

    //keymap.of([{key: "Ctrl-Shift-z", run: console.log("lol")}]),
    
    history({
      minDepth: 1000,
      newGroupDelay: 0,
      joinToEvent: () => false
    }),
    
    AATheme,
    EditorState.tabSize.of('1px'), // I should probably stop tabs from being allowed in the editor.

    disableEmptyCopyCut,
    noIndent,
    minimalSetup
  ],
  parent: document.getElementById('inputContainer')
})



