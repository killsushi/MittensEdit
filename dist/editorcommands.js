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

// Various editor functions that are not line operations (ie. pass through doToAllOrSelected) and aren't complex enough to deserve their own files.


/**
 * Increments or decrements the run of spacing at the caret(s) by 1px.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {boolean} right - Is it incrementing spaces (nudging to the right)?
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function adjustSpace(view, right) {
  const { state } = view;

  const ranges = state.selection.ranges;
  const changes = [];
  
  ranges.forEach((r) => {
    const pos = r.to;

    const line = state.doc.lineAt(pos);

    const spacesbeforecaret = (state.doc.sliceString(line.from, pos).match(spaceatend) != null) ?
      state.doc.sliceString(line.from, pos).match(spaceatend).join("")
      : "";
    const spacesaftercaret = (state.doc.sliceString(pos, line.to).match(spaceatstart) != null) ?
      state.doc.sliceString(pos, line.to).match(spaceatstart).join("")
      : "";
    
    let spaceatcaret = measureLine(spacesbeforecaret) + measureLine(spacesaftercaret);

    // Right now I can start nudging forward from a zero space region
    // Unlike OrinrinEditor, where you cannot.
    // Uncomment the if for OrinrinEditor behavior.
    //if (spaceatcaret > 0) {
    if (right) spaceatcaret++;
    else       spaceatcaret--;
    //}
    if (spaceatcaret < 0) spaceatcaret = 0;
    
    if (useUnicodeSp) {
      changes.push({
        from: pos - spacesbeforecaret.length,
        to: pos + spacesaftercaret.length,
        insert: generateSpacing(spaceatcaret)
      });
    }
    else {
      let newspaces = DocPaddingSpace(spaceatcaret);  // DocPaddingSpace used directly to match OrinrinEditor's behavior
      // Detect if space generation failed. If yes, do nothing.
      // Generated spaces can be identical to the preexisting ones.
      // This pollutes undo history and needs to be detected.
      // Codemirror doesn't add "do nothing" transactions to the undo history, apparently.
      if (newspaces === null || newspaces == spacesbeforecaret + spacesaftercaret) changes.push({
        from: pos,
        to: pos,
        insert: ""
      });
      else changes.push({
        from: pos - spacesbeforecaret.length,
        to: pos + spacesaftercaret.length,
        insert: newspaces[0]
      });
    }
  });

  // Deduplicate changes
  const seen = new Set();
  const uniquechanges = changes.filter(ch => {
    const duplicate = seen.has(ch.to);
    seen.add(ch.to);
    return !duplicate;
  });

  // maps changes .to fields through the insertion to find out where cursors should be placed
  const changeDesc = view.state.changes(uniquechanges);
  const newranges = uniquechanges.map(ch => {
    const pos = changeDesc.mapPos(ch.to, 1);
    return EditorSelection.cursor(pos);
  });

  view.dispatch({
    changes: uniquechanges,
    selection: EditorSelection.create(newranges)
  });

  return true;
}


/**
 * Increments or decrements the run of spacing at the caret by 1px.
 * For use with the Layerbox textareas.
 * Only editor function that's both easy to implement for them and actually useful.
 * @param {HTMLTextAreaElement} area - The target Layerbox textarea.
 * @param {number} pos - The caret position inside the Layerbox.
 * @param {boolean} right - Is it incrementing spaces (nudging to the right)?
 */
function adjustSpaceLayerbox(area, pos, right) {
  let start, end, space;
  let spacesbeforecaret, spacesaftercaret, newspacestr;
  const s = area.value;
  
  spacesbeforecaret = [...s].slice(0, pos).join("").match(spaceatend);
  if (spacesbeforecaret === null) spacesbeforecaret = "";
  else spacesbeforecaret = spacesbeforecaret.join("");
  
  spacesaftercaret = [...s].slice(pos).join("").match(spaceatstart);
  if (spacesaftercaret === null) spacesaftercaret = "";
  else spacesaftercaret = spacesaftercaret.join("");
  
  space = measureLine(spacesbeforecaret) + measureLine(spacesaftercaret);
  
  if (space > 0) {
    if (right) space++;
    else       space--;
    
    start = pos - spacesbeforecaret.length;
    end = pos + spacesaftercaret.length;
    
    newspacestr = generateSpacing(space);
    
    area.setRangeText(newspacestr, start, end, "end");
  }
}

// Throttles inputs for Layerbox space adjustment
let tickingSpaceAdjust = false;

/**
 * Event listener for keydown events in Layerboxes to detect when user is trying to adjust spacing in one.
 * Added to each Layerbox textarea by the LayerboxController function.
 * @param {KeyboardEvent} event - The event object.
 */
function adjustSpaceLayerboxInputHandler(event) {
  if (event.ctrlKey && event.key === 'ArrowLeft') {
    event.preventDefault();
    if (!tickingSpaceAdjust) {
      window.requestAnimationFrame(() => {
        adjustSpaceLayerbox(event.target, event.target.selectionStart, false);
        tickingSpaceAdjust = false;
      });
      tickingSpaceAdjust = true;
    }
    //adjustSpaceLayerbox(event.target, event.target.selectionStart, false);
  }
  if (event.ctrlKey && event.key === 'ArrowRight') {
    event.preventDefault();
    if (!tickingSpaceAdjust) {
      window.requestAnimationFrame(() => {
        adjustSpaceLayerbox(event.target, event.target.selectionStart, true);
        tickingSpaceAdjust = false;
      });
      tickingSpaceAdjust = true;
    }
    //adjustSpaceLayerbox(event.target, event.target.selectionStart, true);
  }
}


/**
 * Extracts an AA fragment from the document with spacing intact based on the active selection.
 * Adds padding to starts of lines to prevent misalignment.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {string} The extracted AA.
 */
function extractAA(view) {
  const { state } = view;
  //const ranges = state.selection.ranges;
  
  //let splitranges = [].concat.apply([], ranges.map(r => (splitRangeByLine(state, r))));
  //splitranges = splitranges.filter((range) => range.from != range.to);

  const splitranges = splitRangesByLineFilterEmpty(state, state.selection.ranges);

  if (splitranges.length === 0) return true;
  
  const result = splitranges.map(r => {
    const line = state.doc.lineAt(r.from);
    let prefixwidth;
    if (r.from === line.from) prefixwidth = 0;
    else prefixwidth = measureLine(
      state.doc.sliceString(line.from, r.from)
    );
    return { line: line.number, 
             prefix: prefixwidth, 
             contents: state.doc.sliceString(r.from, r.to)
           };
  }).filter(r => !onlyspaces.test(r.contents)); // Filter out ranges that were composed of empty space. Hopefully this doesn't break anything.

  const minspace = result.reduce(function(prev, curr) {
    return prev.prefix < curr.prefix ? prev : curr;
  }).prefix;
  /*const startline = result.reduce(function(prev, curr) {
    return prev.line < curr.line ? prev : curr;
  }).line;
  const endline = result.reduce(function(prev, curr) {
    return prev.line > curr.line ? prev : curr;
  }).line;*/
  const startline = result[0].line;

  result.map(r => {
    r.line = r.line - startline;
    r.prefix = r.prefix - minspace;
  });

  const endline = result[result.length - 1].line;

  let linestocomposite = new Array(endline + 1).fill("");

  result.forEach((r) => {
    linestocomposite[r.line] = compositeAALine(
      linestocomposite[r.line],
      r.contents,
      r.prefix
    );
  });

  //console.log(linestocomposite);

  const output = linestocomposite.join("\n");
  //navigator.clipboard.writeText(output);

  //console.log(result);
  return output;
}

/**
 * Extracts an AA fragment to clipboard with spacing intact.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function extractionCopy(view) {
  const extractedAA = extractAA(view);
  navigator.clipboard.writeText(extractedAA);
  return true;
}

/**
 * Extracts an AA fragment to clipboard with spacing intact, then replaces selections with spaces matching the original
 * AA fragement. "Cuts" it out of the AA without damaging spacing.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function extractionCut(view) {
  extractionCopy(view);
  replaceSelectionWithSpaces(view);
  return true;
}


/**
 * Replaces the selection(s) with spaces.
 * Tries to have the spacing approximately match after replacement.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {string} brush - Does nothing here.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function replaceSelectionWithSpaces(view, brush) {
  const { state } = view;
  view.dispatch(state.changeByRange(range => {
    if (range.empty) return { changes: [], range };
    const rangeparts = splitRangeByLine(state, range);
    const newspaces = rangeparts.map(r => 
      {
        return generateSpacing(
          measureLine(
            state.doc.sliceString(r.from, r.to)
          )
        )
      }).join("\n");
    return {
      changes: { from: range.from, to: range.to, insert: newspaces },
      range: EditorSelection.range(range.from + [...newspaces].length, range.from + [...newspaces].length)
    }
  }));
  return true;
}


/**
 * Takes a brush string and tries to make it match a target length.
 * @param {string} brush - A short string used for "painting" AA.
 * @param {number} length - The target length for the brush string.
 * @returns {string} The brush string repeated to match the target length.
 */
function generateBrushString(brush, length) {
  let string = "";
  const units = Math.round(length / measureLine(brush));
  
  //if (units == 0) return brush;

  for (let i = 0; i < units; i++) string += brush;
  //console.log(length - measureLine(string))
  return string;
}


/**
 * Replaces the selection(s) with a brush string.
 * Tries to have the spacing approximately match after replacement.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {string} brush - The string the selections get replaced with.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function replaceSelectionWithBrush(view, brush) {
  const { state } = view;
  view.dispatch(state.changeByRange(range => {
    if (range.empty) return { changes: [], range };
    const rangeparts = splitRangeByLine(state, range);
    const newstr = rangeparts.map(r => 
      {
        return generateBrushString(
          brush, 
          measureLine(
            state.doc.sliceString(r.from, r.to)
          ));
      }).join("\n");
    return {
      changes: { from: range.from, to: range.to, insert: newstr },
      range: EditorSelection.range(range.from + [...newstr].length, range.from + [...newstr].length)
    }
  }));
  return true;
}


/**
 * Replaces all runs of spaces in the selection(s) with a brush string.
 * Tries to have the spacing approximately match after replacement.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {string} brush - The string spaces get replaced with.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function replaceSelectionSpacesWithBrush(view, brush) {
  const { state } = view;
  view.dispatch(state.changeByRange(range => {
    if (range.empty) return { changes: [], range };
    const rangeparts = splitRangeByLine(state, range);
    const newstr = rangeparts.map(r => 
      {
        const str = state.doc.sliceString(r.from, r.to);
        return str.replace(
          matchallspaces,
          match => {
            let brushstring = generateBrushString(brush, measureLine(match));
            return brushstring === "" ? match : brushstring; // Avoid collapsing spaces when a brush string is too long to fit even once
          }
        );
      }).join("\n");
    return {
      changes: { from: range.from, to: range.to, insert: newstr },
      range: EditorSelection.range(range.from + [...newstr].length, range.from + [...newstr].length)
    }
  }));
  return true;
}


// Declaration for the brush Compartment. Probably shouldn't be here.
const brushCompartment = new Compartment();


/**
 * Activates brush mode by adding a mouseup eventhandler extension to an editor Compartment.
 * Brush functions are those that replace selected text on mouseup events.
 * Existing options: replaceSelectionWithSpaces, replaceSelectionWithBrush, replaceSelectionSpacesWithBrush
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {function} brushfunction - A function for replacing selections on mouseup. One of the three - replaceSelectionWithSpaces, replaceSelectionWithBrush, replaceSelectionSpacesWithBrush
 * @param {string} brush - The brush string.
 */
function brushActive(view, brushfunction, brush) {
  const extension = EditorView.domEventHandlers({
    mouseup(event, view) {
      brushfunction(view, brush);
    }
  });

  view.dispatch({
    effects: brushCompartment.reconfigure(extension)
  });
}


/**
 * Clears the brush compartment to disable brush mode.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 */
function brushInactive(view) {
  view.dispatch({
    effects: brushCompartment.reconfigure([])
  });
}


/**
 * Enables free drawing mode by adding event listeners to the brushCompartment.
 * Pastes inputed brush text at the mouse position as it is held down based on pixel/line thresholds. Disables text selection.
 * Might be worth adding interpolation and throttling to this, would stop occasional jumps.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {string} brush - string to be pasted under mouse position.
 */
function applyFreeDrawingMode(view, brush) {
  let isDragging = false;
  let startX = 0;
  let startline = 0;
  
  const brushWidth = longestLineInString(brush);
  
  const dragHandlers = EditorView.domEventHandlers({
    mousedown(event, view) {
      if (event.button !== 0) return false; // Respond to left clicks only
      
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos === null) return false;
      
      isDragging = true;
      startX = event.clientX + aaeditor.scrollDOM.scrollLeft;
      startline = view.state.doc.lineAt(pos).number;
      
      tr = blockPaste(view.state, brush, startline, Math.round(startX - brushWidth), enabletransparentpasting);
      view.dispatch({changes: tr});
      view.focus();
      
      // Stop browser drag/highlighting
      event.preventDefault();
      // Tell CodeMirror we handled the event, stops event from propagating into CodeMirror's own selection logic
      return true; 
    },
    
    mousemove(event, view) {
      if (!isDragging) return false;
      
      const currentX = event.clientX + aaeditor.scrollDOM.scrollLeft;
      const pos = view.posAtCoords({ x: currentX, y: event.clientY });
      
      if (pos === null) {
        event.preventDefault();
        return true; 
      }
      
      const currentline = view.state.doc.lineAt(pos).number;
      const horizontalDiff = Math.abs(currentX - startX);
      const lineDiff = Math.abs(currentline - startline);
      
      // Check thresholds, brushWidth pixels horizontally OR changed line vertically
      if (horizontalDiff >= brushWidth || lineDiff > 0) {
        // Calculate position relative to the left edge of the editor
        const editorRect = view.dom.getBoundingClientRect();
        const relativeX = currentX - editorRect.left;
        
        tr = blockPaste(view.state, brush, currentline, Math.round(currentX - brushWidth), enabletransparentpasting);
        view.dispatch({changes: tr});
        view.focus();
        
        // Reset start tracking to the new position to allow continuous triggering
        startX = currentX;
        startline = currentline;
      }
      
      event.preventDefault();
      return true;
    },
    
    mouseup(event, view) {
      if (isDragging) {
        isDragging = false;
        event.preventDefault();
        return true;
      }
      return false;
    },
    
    mouseleave(event, view) {
      // Stop dragging if the cursor leaves the editor bounds
      if (isDragging) {
        isDragging = false;
        return true;
      }
      return false;
    }
  });
  
  // CSS theme to stop text highlighting, just in case.
  // I'm pretty sure this actually does nothing.
  const disableSelectionTheme = EditorView.theme({
    ".cm-content": {
      userSelect: "none",
      WebkitUserSelect: "none"
    }
  });
  
  view.dispatch({
    selection: EditorSelection.cursor(0),
    effects: brushCompartment.reconfigure([
      dragHandlers,
      disableSelectionTheme
    ])
  });
}


/**
 * Replaces selection(s) with a given string.
 * Used for inserting from the sidebar.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {string} str - The string to be inserted.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function insertFromMenu(view, str){
  view.dispatch(view.state.replaceSelection(str));
  return true;
}


// Acts as an enum for types of template insertion behavior.
const templatebehavior = {
    InsertLayerbox: Symbol("InsertLayerbox"),
    InsertDirectly: Symbol("InsertDirectly"),
    InsertRectangle: Symbol("InsertRectangle"),
    Copy: Symbol("Copy"),
};
Object.freeze(templatebehavior);

// Stores the current template behavior setting.
let templatesetting = templatebehavior.InsertLayerbox;

/**
 * Inserts a template from the sidebar.
 * Depending on the global variable setting "templatesetting", will either
 * insert a layerbox, replace selections, or not insert and instead copy to clipboard.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {string} str - The string containing the template.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function insertTemplate(view, str){
  if (templatesetting === templatebehavior.InsertLayerbox) {
    const { state } = view;
    
    const line = state.doc.lineAt(state.selection.main.head);
    const txtbeforecursor = state.doc.sliceString(line.from, state.selection.main.head);
    const offset = measureLine(txtbeforecursor);
    createLayerBox(view, str, offset, line.number * 18 - 18);
  } else if (templatesetting === templatebehavior.InsertDirectly) {
    view.dispatch(view.state.replaceSelection(str));
  } else if (templatesetting === templatebehavior.InsertRectangle) {
    const { state } = view;
    
    const line = state.doc.lineAt(state.selection.main.head);
    const txtbeforecursor = state.doc.sliceString(line.from, state.selection.main.head);
    const offset = measureLine(txtbeforecursor);
    
    const insertions = rectangleInsert(state, str, line.number, offset);
    
    view.dispatch({
      changes: insertions
    });
  } else if (templatesetting === templatebehavior.Copy) {
    navigator.clipboard.writeText(str);
  }
  
  return true;
}


/** @type {number} - The width to attempt auto-adjusting to. */
let autoAdjustWidth = 790;

/**
 * Sets the line pixel length for use in automatic misalignment adjusting.
 * Based on OrinrinEditor's DocDiffAdjBaseSet
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function setAutoAdjustWidth(view) {
  const { state } = view;
  const lineatcaret = state.doc.lineAt(state.selection.main.head);
  
  if (lineatcaret) { autoAdjustWidth = measureLine(lineatcaret.text); }
  
  const autoadjustindicator = document.getElementById('autoAdjustWidth');
  autoadjustindicator.innerText = autoAdjustWidth + '[dot]';
  
  return true;
}

/**
 * Executes the misalignment adjustment (Attempts aligning line width to autoAdjustWidth).
 * Operates on whatever run of spaces the caret is positioned on.
 * Based on OrinrinEditor's DocDiffAdjExec
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function executeAutoAdjust(view) {
  const { state } = view;
  
  const ranges = state.selection.ranges;
  const changes = [];
  
  // Two carets on one line not allowed
  const seen = new Set();
  const uniqueranges = ranges.filter(r => {
    const linenum = state.doc.lineAt(r.head).number;
    const duplicate = seen.has(linenum);
    seen.add(linenum);
    if (duplicate) { flashLine(view, state.doc.lineAt(r.head).from, "Caret discarded: Multiple carets on one line."); }
    return !duplicate;
  });
  
  for(const r of uniqueranges) {
    const caret = r.head;
    const lineatcaret = state.doc.lineAt(caret);
    const diff = autoAdjustWidth - measureLine(lineatcaret.text);
    
    const spacesbeforecaret = (state.doc.sliceString(lineatcaret.from, caret).match(spaceatend) != null) ?
      state.doc.sliceString(lineatcaret.from, caret).match(spaceatend).join("")
      : "";
    const spacesaftercaret = (state.doc.sliceString(caret, lineatcaret.to).match(spaceatstart) != null) ?
      state.doc.sliceString(caret, lineatcaret.to).match(spaceatstart).join("")
      : "";
    
    let spaceatcaret = measureLine(spacesbeforecaret) + measureLine(spacesaftercaret);
    
    if (spaceatcaret === 0) { flashLine(view, lineatcaret.from, "Failed adjustment: No spaces at cursor."); continue;}
    
    spaceatcaret += diff;
    
    if (spaceatcaret < 0) { flashLine(view, lineatcaret.from, "Failed adjustment: Not enough space."); continue;}
    
    if (useUnicodeSp) {
      changes.push({
        from: caret - spacesbeforecaret.length,
        to: caret + spacesaftercaret.length,
        insert: generateSpacing(spaceatcaret)
      });
    } else {
      const newspace = DocPaddingSpaceWithPeriod(spaceatcaret);
      
      if (spaceatcaret < 30 && measureLine(newspace) != spaceatcaret) {
        flashLine(view, lineatcaret.from, "Failed adjustment: Not enough space for perfect alignment without Unicode.");
        continue;
      }
      else {
        changes.push({
          from: caret - spacesbeforecaret.length,
          to: caret + spacesaftercaret.length,
          insert: newspace
        });
      }
    }
  }
  
  if (changes.length != 0) {
    const changeDesc = view.state.changes(changes);
    const newranges = changes.map(ch => {
      const pos = changeDesc.mapPos(ch.to, 1);
      return EditorSelection.cursor(pos);
    });
    
    view.dispatch({
      changes: changes,
      selection: EditorSelection.create(newranges)
    });
  }
  
  return true;
}


/**
 * Shifts all cursors down, keeping their left offset as unchanged as possible.
 * Adds spacing to the end of a line if needed to keep the cursor fixed at that offset (the main purpose of this function).
 * I don't like this code.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function shiftCursorsDown(view) {
  const { state } = view;

  const ranges = state.selection.ranges;
  let cursorpositions = [];
  let changes = [];
  
  ranges.forEach((r) => {
    const pos = r.head;

    const line = state.doc.lineAt(pos);
    const txtbeforecursor = state.doc.sliceString(line.from, pos);
    const offset = measureLine(txtbeforecursor);
    
    cursorpositions.push({
      destinationline: line.number + 1,
      leftoffset: offset
    });
  });
  
  let linenumbers = new Map();
  for (const c of cursorpositions) {
    if (!linenumbers.has(c.destinationline) || c.leftoffset > linenumbers.get(c.destinationline)) {
      linenumbers.set(c.destinationline, c.leftoffset);
    }
  }
  
  let newlines = new Map();
  for (const [linenum, offset] of linenumbers) {
    if (linenum <= state.doc.lines) {
      const line = state.doc.line(linenum);
      const length = measureLine(line.text);
      if (length < offset) {
        const newspace = generateSpacing(offset - length);
        changes.push({
          from: line.to,
          to: line.to,
          insert: newspace
        });
        
        newlines.set(linenum, line.text + newspace);
      }
    } else {
      const newspace = generateSpacing(offset);
      
      changes.push({
        from: state.doc.length,
        to: state.doc.length,
        insert: '\n' + newspace
      });
      
      newlines.set(linenum, newspace);
    }
  }
  
  const changeDesc = view.state.changes(changes);
  let newranges = cursorpositions.map(c => {
    if (c.destinationline <= state.doc.lines) {
      let newcaretpos;
      let linetext;
      const lineatcursor = state.doc.line(c.destinationline);
      if (newlines.has(c.destinationline)) {
        linetext = newlines.get(c.destinationline);
        if (c.leftoffset === linenumbers.get(c.destinationline)) {
          newcaretpos = changeDesc.mapPos(lineatcursor.to, 1);
          return EditorSelection.cursor(newcaretpos);
        }
      } else {
        linetext = lineatcursor.text;
      }
      newcaretpos = changeDesc.mapPos(lineatcursor.from)
          + indexClosestToPxOffset(linetext, c.leftoffset, 0);
      return EditorSelection.cursor(newcaretpos);
    } else {
      let newcaretpos;
      if (c.leftoffset === linenumbers.get(c.destinationline)) {
        newcaretpos = changeDesc.mapPos(state.doc.length, 1);
      } else {
        newcaretpos = changeDesc.mapPos(state.doc.length)
        + indexClosestToPxOffset(newlines.get(c.destinationline), c.leftoffset, 0) + 1; // + 1 to account for the added newline?
      }
      return EditorSelection.cursor(newcaretpos);
    }
  });
    
  view.dispatch({
    changes: changes,
    selection: EditorSelection.create(newranges)
  });
  
  // Just testing to see if this sort of thing actually speeds up garbage collection
  changes = null;
  newranges = null;
  cursorpositions = null;
  linenumbers = null;
  newlines = null;

  return true;
}

/**
 * Finds the closest character to the current cursor position on each line, then adds one pixel of space to each position,
 * effectively splitting each line in some middle position.
 * Based on OrinrinEditor's DocCentreWidthShift
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function nudgeRightFromCaret(view) {
  const { state } = view;
  const changes = [];
  const lineatcursor = state.doc.lineAt(state.selection.main.head);
  const cursorlinenumber = lineatcursor.number;
  const txtbeforecursor = state.doc.sliceString(lineatcursor.from, state.selection.main.head);
  const offset = measureLine(txtbeforecursor);
  let changeoncursorline;
  let cursoroffset = offset;
  let newcursor;
  
  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);

    if(measureLine(line.text) > offset) {
      const pos = line.from + indexClosestToPxOffset(line.text, offset, -1);
      
      const spacesbeforecaret = (state.doc.sliceString(line.from, pos).match(spaceatend) != null) ?
        state.doc.sliceString(line.from, pos).match(spaceatend).join("")
        : "";
      const spacesaftercaret = (state.doc.sliceString(pos, line.to).match(spaceatstart) != null) ?
        state.doc.sliceString(pos, line.to).match(spaceatstart).join("")
        : "";
      
      let spaceatcaret = measureLine(spacesbeforecaret) + measureLine(spacesaftercaret);
      spaceatcaret++;
      
      const change = {
          from: pos - spacesbeforecaret.length,
          to: pos + spacesaftercaret.length,
          insert: generateSpacing(spaceatcaret > 0 ? spaceatcaret : 0)
        }
      
      if (line.number === cursorlinenumber) { changeoncursorline = change; } // Keep track of which line the cursor was on for repositioning
      if (line.number === cursorlinenumber && spacesaftercaret === "" && measureLine(spacesbeforecaret) < 11 ) { cursoroffset++; } // Mimics OrinrinEditor behavior.
      
      changes.push(change);
    }
  }

  const changeDesc = view.state.changes(changes);
  if (changeoncursorline != undefined) {
    // If the line the cursor was on has changed, construct that changed line before dispatching to search it for the new position
    const prechange = [...lineatcursor.text].slice(0, changeoncursorline.from - lineatcursor.from).join("");
    const postchange = [...lineatcursor.text].slice(changeoncursorline.to - lineatcursor.from).join("");
    const changedlineatcursor = prechange + changeoncursorline.insert + postchange;
    
    const newcaretpos = changeDesc.mapPos(lineatcursor.from)
      + indexClosestToPxOffset(changedlineatcursor, cursoroffset, 0);
    
    newcursor = EditorSelection.cursor(newcaretpos);
  }
  else {
    // Otherwise, cursor position is unchanged.
    newcursor = EditorSelection.cursor(changeDesc.mapPos(state.selection.main.head));
  }
  
  view.dispatch({
    changes: changes,
    selection: newcursor
  });
  
  return true;
}


/**
 * Finds the closest character to the current cursor position on each line, then removes one pixel of space from each position,
 * effectively splitting each line in some middle position. If there aren't spaces to contract, a character is removed from the right
 * and replaced with its width - 1.
 * Based on OrinrinEditor's DocCentreWidthShift
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function nudgeLeftFromCaret(view) {
  const { state } = view;
  const changes = [];
  const lineatcursor = state.doc.lineAt(state.selection.main.head);
  const cursorlinenumber = lineatcursor.number;
  const txtbeforecursor = state.doc.sliceString(lineatcursor.from, state.selection.main.head);
  const offset = measureLine(txtbeforecursor);
  let changeoncursorline;
  let cursoroffset = offset;
  let newcursor;
  
  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);

    if(measureLine(line.text) > offset) {
      const pos = line.from + indexClosestToPxOffset(line.text, offset, -1);
      
      const spacesbeforecaret = (state.doc.sliceString(line.from, pos).match(spaceatend) != null) ?
        state.doc.sliceString(line.from, pos).match(spaceatend).join("")
        : "";
      let spacesaftercaret = (state.doc.sliceString(pos, line.to).match(spaceatstart) != null) ?
        state.doc.sliceString(pos, line.to).match(spaceatstart).join("")
        : "";
      
      // If there aren't spaces to contract, treat the character immediately after the caret position as if it were space.
      if (spacesbeforecaret === "" && spacesaftercaret === "") { spacesaftercaret = state.doc.sliceString(pos, pos + 1); }
      
      let spaceatcaret = measureLine(spacesbeforecaret) + measureLine(spacesaftercaret);
      spaceatcaret--;
      
      const change = {
          from: pos - spacesbeforecaret.length,
          to: pos + spacesaftercaret.length,
          insert: generateSpacing(spaceatcaret > 0 ? spaceatcaret : 0)
        }
      
      if (line.number === cursorlinenumber) { changeoncursorline = change; } // Keep track of which line the cursor was on for repositioning
      
      changes.push(change);
    }
  }

  const changeDesc = view.state.changes(changes);
  if (changeoncursorline != undefined) {
    // If the line the cursor was on has changed, construct that changed line before dispatching to search it for the new position
    const prechange = [...lineatcursor.text].slice(0, changeoncursorline.from - lineatcursor.from).join("");
    const postchange = [...lineatcursor.text].slice(changeoncursorline.to - lineatcursor.from).join("");
    const changedlineatcursor = prechange + changeoncursorline.insert + postchange;
    
    const newcaretpos = changeDesc.mapPos(lineatcursor.from)
      + indexClosestToPxOffset(changedlineatcursor, cursoroffset, 0);
    
    newcursor = EditorSelection.cursor(newcaretpos);
  }
  else {
    // Otherwise, cursor position is unchanged.
    newcursor = EditorSelection.cursor(changeDesc.mapPos(state.selection.main.head));
  }
  
  view.dispatch({
    changes: changes,
    selection: newcursor
  });
  
  return true;
}

