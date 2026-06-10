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

/**
 * Composites a block of AA atop a document.
 * Generates a ChangeSpec replacing a set of contiguous lines, starting at the start of the
 * first line replaced and ending at the end of the last line replaced.
 * Used for pasting Layerboxes, blockpasting mode, frame drawing, free drawing, etc.
 * @param {EditorState} state - A Codemirror 6 state object.
 * @param {string} foreground - String containing the AA to be composited over the document.
 * @param {number} line - The line number at which to begin compositing.
 * @param {number} offset - The pixel offset from the left at which to composite.
 * @param {boolean} transparent - true if treating inner spaces as transparent during composite.
 * @returns {ChangeSpec} A change object {to, from, insert}
 */
function blockPaste(state, foreground, line, offset, transparent) {
  //const { state } = view;
  
  let output = "";

  let bglines = [];
  let fglines = splitLines(foreground);
  
  for (let i = (line < 1 ? Math.abs(line) + 1 : 0)
         , n = (line > state.doc.lines ? (line - state.doc.lines) : 0)
         ; i < fglines.length
         ; i++, n++) {
    let curline = (i + line <= state.doc.lines) ?
      state.doc.line(i + line).text
      : "";
    if (transparent) {
      bglines[n] = compositeAALineTransparent(
        curline,
        fglines[i],
        offset
      );
    }
    else {
      bglines[n] = compositeAALine(
        curline,
        fglines[i],
        offset
      );
    }
  }
  
  let startpos = 0;
  if (line < 1) startpos = 0;
  else if (line > state.doc.lines) startpos = state.doc.length; // apparently valid as an insertion point
  else startpos = state.doc.line(line).from;
  
  const endline = line + fglines.length - 1;
  let endpos = 0;
  if (endline < 1) endpos = 0;
  else if (endline > state.doc.lines) endpos = state.doc.length; // apparently valid as an insertion point
  else endpos = state.doc.line(endline).to;

  output = bglines.join("\n"); // Thank God undefined elements are converted to empty strings

  return ({
        from: startpos,
        to: endpos,
        insert: output
      });
}


/**
 * Inserts a block of AA at a document position without replacing the line contents after it.
 * Generates a ChangeSpec consisting of an array of insertions.
 * @param {EditorState} state - A Codemirror 6 state object.
 * @param {string} foreground - String containing the AA to be inserted into the document.
 * @param {number} line - The line number at which to begin inserting.
 * @param {number} offset - The pixel offset from the left at which to insert.
 * @returns {ChangeSpec} A array of change objects {to, from, insert}
 */
function rectangleInsert(state, foreground, line, offset) {
  let output = "";

  let changes = [];
  let fglines = splitLines(foreground);
  
  for (let i = (line < 1 ? Math.abs(line) + 1 : 0)
         , n = (line > state.doc.lines ? (line - state.doc.lines) : 0)
         ; i < fglines.length
         ; i++, n++) {
    //let curline = (i + line <= state.doc.lines) ?
    //  state.doc.line(i + line).text
    //  : "";
    let curlinetext;
    let linestart;
    let insertion;
    if(i + line <= state.doc.lines) {
      const curline = state.doc.line(i + line);
      curlinetext = curline.text;
      linestart = curline.from;
      insertion = insertAtOffset(curlinetext, fglines[i], offset);
    } else {
      curlinetext = "";
      linestart = state.doc.length;
      insertion = insertAtOffset(curlinetext, fglines[i], offset);
      insertion.insert = '\n' + insertion.insert;
    }
    
    changes.push({
      from: linestart + insertion.index,
      to: linestart + insertion.index,
      insert: insertion.insert
    });
  }
  
  return changes;
}



// To be honest I really don't like how I ended up handling blockpasting preview mode.
// The original prototype could do it really simply by repeatedly setting the value of a textarea
// but doing that with Codemirror's setState is kind of slow and crappy. And of course the prototype
// had no undo history to deal with.
// Had to do it "properly" with Widget Decorators.

let blockpasting = false; // true if a preview is already active
let currentPastePreview = null; // Stores current blockpaste preview changeSpec for full-doc preview to access

const pastePreviewCompartment = new Compartment();
const previewTheme = EditorView.theme({
  "&": {
    backgroundColor: "#89cc7333",
    //transition: "background-color 0.2s ease"
  },
  ".cm-paste-preview": {
    display: "block",
    backgroundColor: "#89cc7333",
  },
  // I want to stop selection when blockpasting but this does NOT work. Leaving it for now.
  /*".cm-content": {
    userSelect: "none",
    WebkitUserSelect: "none"
  },*/
  ".cm-cursorLayer": {
    // Hiding the cursor during paste preview stops horrible jittering and scrollbar oddities from if the cursor is right on the widget
    display: "none !important"
  }
});

// StateEffect to transport the change data to previewDecorationField
const setPreviewEffect = StateEffect.define();

// Widget for previewing a blockPaste line replacement.
// Takes the string that needs to be previewed and turns it into DOM with elements for lines
// and proper highlighting for unicode spaces and bad spaces.
// I don't highlight normal FWS and HWS with underlines for this, seems unnecessary here.
class PastePreviewWidget extends WidgetType {
  constructor(text) {
    super();
    this.text = text;
  }
  
  eq(other) { 
    return this.text === other.text; 
  }

  // Rendering logic for space highlighting
  renderLines(container) {
    const yetanotherspacematcher = /((?:^ +| {2,}))|([\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003]+)/gu;
    
    const lines = this.text.split(/\r?\n/);
    
    for (const line of lines) {
      const lineEl = document.createElement("div");
      lineEl.className = "cm-preview-line";
      
      if (line.length === 0) {
        // Prevent empty lines from collapsing vertically to 0px height
        lineEl.appendChild(document.createElement("br"));
      } else {
        let lastIndex = 0;
        let match;
        
        // Reset the regex state before parsing a new line
        yetanotherspacematcher.lastIndex = 0;
        
        while ((match = yetanotherspacematcher.exec(line)) !== null) {
          // Append any normal text leading up to the regex match
          if (match.index > lastIndex) {
            lineEl.appendChild(document.createTextNode(line.slice(lastIndex, match.index)));
          }
          
          // Wrap the matched space in a span
          const span = document.createElement("span");
          span.textContent = match[0];
          
          if (match[1]) {
            span.className = "cm-badspace-highlight";
          } else if (match[2]) {
            span.className = "cm-unispace-highlight";
          }
          
          lineEl.appendChild(span);
          lastIndex = yetanotherspacematcher.lastIndex;
        }
        
        // Append any remaining normal text after the last match
        if (lastIndex < line.length) {
          lineEl.appendChild(document.createTextNode(line.slice(lastIndex)));
        }
      }
      container.appendChild(lineEl);
    }
  }
  
  toDOM() {
    //console.log("DOM rebuilt");
    const el = document.createElement("div");
    el.className = "cm-paste-preview";
    this.renderLines(el);
    return el;
  }

  updateDOM(dom) {
    // Since eq() returned false, CodeMirror knows the text changed.
    // Instead of rebuilding the wrapper, clear and re-render the lines.
    //console.log("DOM updated");
    dom.textContent = "";
    this.renderLines(dom);
    return true; // Returning true prevents CodeMirror from destroying the widget
  }
}

// StateField for processing setPreviewEffect
// Takes from, to, and insert fields from setPreviewEffect and figures out what sort
// of Decoration widget to insert into the document based on it.
// There's a slight problem with this, replacing a single line will rebuild the DOM for its
// wrapper when the line shifts up. This is due to something about how Codemirror handles single line
// replacements internally. This might be a (slight?) performance issue in that edge case.
// Entering blockpaste preview mode on an empty document might cause problems.
const previewDecorationField = StateField.define({
  create() { return Decoration.none; },
  update(decos, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setPreviewEffect)) {
        const { from, to, insert } = effect.value;
        const doc = tr.state.doc;
        
        // Empty paste. Exit early and clear deco to prevent empty lines from being visually inserted.
        // Should only happen when blockpaste has a large negative line number that no line of the pasted AA clears.
        if (from === to && insert === "") {
          return Decoration.none;
        }

        const decosToSet = [];
        let displayString = insert;

        if (from < to) {
          // Replacing 1 or more lines.
          // Standard block replacement, works because from and to are line boundaries.
          decosToSet.push(Decoration.replace({
            widget: new PastePreviewWidget(displayString),
            block: true
          }).range(from, to));
          
        } else if (from === doc.length && doc.length != 0 && doc.line(doc.lines).length != 0) {
          // Appending at EOF (when EOF is not an empty line, in which case it needs to be hidden).
          
          // Codemirror appends an extra newline to block widgets below EOF to force them down.
          // I remove that to stop the preview from being too low by a line.
          displayString = displayString.replace(/^\r?\n/, '');
          decosToSet.push(Decoration.widget({
            widget: new PastePreviewWidget(displayString),
            block: true,
            side: 1 // side > 0 forces it below the EOF boundary
          }).range(from));
          
        } else {
          // Replacing a single empty line mid-document or at document end. Also runs if the document is empty.
          // A length-0 replacement acts as a widget insertion, which normally leaves the empty cm-line intact.
          // We fix this by hiding the target empty line.
          decosToSet.push(Decoration.widget({
            widget: new PastePreviewWidget(displayString),
            block: true,
            side: -1
          }).range(from));

          // Hide the actual empty line so it doesn't take up extra vertical space and shift the doc around.
          decosToSet.push(Decoration.line({
            attributes: { style: "display: none;" }
          }).range(from));
        }
        
        return Decoration.set(decosToSet);
      }
    }
    
    return tr.docChanged ? Decoration.none : decos;
  },
  provide: f => EditorView.decorations.from(f)
});

/**
 * Enters blockpaste preview mode.
 * @returns {boolean} Returns true.
 */
function enterPastePreview(view, pastetext, linenum, offset) {
  if (blockpasting) { return false; }
  blockpasting = true;
  
  //console.log("Started");
  
  // Set the editor readOnly and add the stateField and theme needed for preview
  view.dispatch({
    effects: pastePreviewCompartment.reconfigure([
      EditorState.readOnly.of(true),
      previewDecorationField,
      previewTheme
    ])
  });

  document.addEventListener("keydown", handleInput, true);
  renderPreview();
  
  function renderPreview() {
    const changeSpec = blockPaste(view.state, pastetext, linenum, offset, enabletransparentpasting);
    
    currentPastePreview = changeSpec; // Make the current preview changeSpec global for the Ctrl-B full document preview to access
    
    // Instead of dispatching a document change, we dispatch a visual effect
    view.dispatch({
      effects: setPreviewEffect.of({
        from: changeSpec.from,
        to: changeSpec.to,
        insert: changeSpec.insert
      })
    });
  }
  
  let tickinginput = false;
  
  function handleInput(event) {
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const actionKeys = ["Escape", "Enter"];
    const isArrow = arrowKeys.includes(event.key);
    const isAction = actionKeys.includes(event.key);
    
    // Kind of shoehorning this is here because Ctrl-Z cancelling paste preview mode is nice.
    // Meta key is for the sake of Mac keyboards, right? I should probably do that consistently...
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
    
    // If it's not a key we manage, exit early so it can propagate.
    if (!isArrow && !isAction) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (isAction) {
      if (event.key === "Escape") cancel();
      if (event.key === "Enter") finalize();
      return;
    }
    
    if (!tickinginput) {
      window.requestAnimationFrame(() => {
        switch (event.key) {
          case "ArrowUp": linenum--; break;
          case "ArrowDown": linenum++; break;
          case "ArrowLeft": offset--; break;
          case "ArrowRight": offset++; break;
        }
        renderPreview();
        tickinginput = false;
      });
      tickinginput = true;
    }
  }
  
  function cancel() {
    cleanup();
    // Emptying the compartment removes the readOnly lock and the decorations.
    view.dispatch({
      effects: pastePreviewCompartment.reconfigure([])
    });

    // If the preview pushed the horizontal editor limits, clear unneeded scrollbars.
    view.requestMeasure({
      read: () => {
        return view.scrollDOM.scrollWidth;
      },
      write: () => {
        // Strip the cached width limits.
        view.contentDOM.style.flexBasis = "";
        view.contentDOM.style.minWidth = "";
        view.contentDOM.style.width = "";
      }
    });
  }
  
  function finalize() {
    cleanup();
    
    //console.log("linenum" + linenum + " offset: " + offset);
    const finalchanges = blockPaste(view.state, pastetext, linenum, offset, enabletransparentpasting);
    
    // Find new caret position
    const changelines = splitLines(finalchanges.insert);
    let i, cursorline, cursorindex;
    for (i = 0; i < changelines.length; i++) {
      if (changelines[i] != '') {
        cursorline = changelines[i];
        break;
      }
    }
    if (cursorline != undefined) {
      cursorindex = finalchanges.from + i + indexClosestToPxOffset(cursorline, offset, 0);
    } else {
      cursorindex = 0;
    }
    
    view.dispatch({
      effects: pastePreviewCompartment.reconfigure([]),
      changes: finalchanges,
      selection: EditorSelection.cursor(cursorindex)
    });
  }

  function cleanup() {
    document.removeEventListener("keydown", handleInput, true);
    blockpasting = false;
    currentPastePreview = null;
  }
  
  return true;
}

//function blockPasteTester(view, text, line, offset) {
//  const tr = blockPaste(view.state, text, line, offset)
//  console.log(tr);
//  view.dispatch({changes: tr});
//  return true;
//}



const pasteHandler = EditorView.domEventHandlers({
  paste(event, view) {
    //const text = event.clipboardData.getData("text/plain");
    //console.log(text);
    
    if (blockpasteenabled == 1 && !blockpasting) {
      //event.stopPropagation();
      event.preventDefault();
      
      const { state } = view;

      const text = event.clipboardData.getData("text/plain");
      
      const line = state.doc.lineAt(state.selection.main.head);
      const txtbeforecursor = state.doc.sliceString(line.from, state.selection.main.head);
      const offset = measureLine(txtbeforecursor);
      
      enterPastePreview(view, text, line.number, offset);
      
      return true;
    }
    if (blockpasteenabled == 2 /*&& !blockpasting*/) {
      //event.stopPropagation();
      event.preventDefault();

      const { state } = view;
  
      const text = event.clipboardData.getData("text/plain");

      const line = state.doc.lineAt(state.selection.main.head);
      const txtbeforecursor = state.doc.sliceString(line.from, state.selection.main.head);
      const offset = measureLine(txtbeforecursor);

      createLayerBox(view, text, offset, line.number * 18 - 18);

      return true;
    }
    
    return false;
  }
});

const pastemodestatus = document.getElementById('pasteModeStatus'); // Status bar button
let blockpasteenabled = 0; // 0 - paste normally, 1 - block paste preview, 2 - layerbox

/**
 * Toggles the active pastemode.
 * @returns {boolean} Returns true.
 */
function changeBlockpasteStatus() {
  blockpasteenabled = ++blockpasteenabled % 3;
    if (blockpasteenabled == 1) {
      //console.log("Block Pasting Enabled");
      pastemodestatus.innerText = "Block Pasting Enabled";
    }
    else if (blockpasteenabled == 2) {
      //console.log("Block Pasting Layer Box");
      pastemodestatus.innerText = "Block Pasting Layer Box";
    }
    else {
      //console.log("Block Pasting Disabled");
      pastemodestatus.innerText = "Block Pasting Disabled";
    }
  return true;
}

pastemodestatus.parentNode.onclick = changeBlockpasteStatus;
