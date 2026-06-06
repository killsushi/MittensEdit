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

This file additionally incorporates code from Codemirror 6 rectangular-selection.ts, covered by the following copyright and license:

MIT License

Copyright (C) 2018 by Marijn Haverbeke <marijn@haverbeke.berlin>, Adrian
Heine <mail@adrianheine.de>, and others

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Everything following here is based on existing RectangularSelection code in Codemirror's built-in extensions
// Modified to work with AA fonts.
// A lot of this was achieved by trial and error modification of the existing rectangular selection source code and online examples with very poor understanding of what I'm doing.

// StateField stuff for tracking if the last selection was rectangular. Used by vertical mirroring.
const setRectangleSelectEffect = StateEffect.define();

const isRectangularSelectionField = StateField.define({
  create() { return false; },
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(setRectangleSelectEffect)) return e.value;
    }
    if (tr.selection) return false;

    return value;
  }
});

// WeakSet holds references to the selections
const rectangularSelections = new WeakSet();

const rectSelectionExtender = EditorState.transactionExtender.of(tr => {
  if (tr.selection && rectangularSelections.has(tr.newSelection)) {
    return { effects: [setRectangleSelectEffect.of(true)] };
  }
  return null;
});

// Don't compute precise pixel positions for line offsets above this
// (since it could get expensive). Assume offset==column for them.
const MaxOff = /*2000*/ 3500;

function rectangleFor(state, a, b) {
  let startLine = Math.min(a.line, b.line);
  let endLine = Math.max(a.line, b.line);
  let ranges = [];

  // Fallback to offset-based selection if the lines are excessively long
  if (a.off > MaxOff || b.off > MaxOff || a.px < 0 || b.px < 0) {
    let startOff = Math.min(a.off, b.off);
    let endOff = Math.max(a.off, b.off);
    for (let i = startLine; i <= endLine; i++) {
      let line = state.doc.line(i);
      if (line.length <= endOff) {
        ranges.push(EditorSelection.range(line.from + startOff, line.to + endOff));
      }
    }
  } else {
    // Proportional selection using pixel widths
    let startPx = Math.min(a.px, b.px);
    let endPx = Math.max(a.px, b.px);

    for (let i = startLine; i <= endLine; i++) {
      let line = state.doc.line(i);

      // Find the character indices that correspond to our pixel boundaries
      let startIdx = indexClosestToPxOffset(line.text, startPx);
      let endIdx = indexClosestToPxOffset(line.text, endPx);

      // If the pixel offset exceeds the line's rendered width, fallback to the line's end
      if (startIdx < 0) startIdx = line.length;
      if (endIdx < 0) endIdx = line.length;

      // If both bounds are past the end of the line, just place a cursor at the end
      if (startIdx === line.length && endIdx === line.length) {
        //ranges.push(EditorSelection.cursor(line.to));
      } else {
        ranges.push(EditorSelection.range(line.from + startIdx, line.from + endIdx));
      }
    }
  }
  return ranges;
}

function absolutePx(view, x) {
  // Use the top-left of the viewport to determine the visual left-margin of the text
  let ref = view.coordsAtPos(view.viewport.from);
  return ref ? Math.max(0, x - ref.left) : -1;
}

function getPos(view, event) {
  let offset = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
  if (offset === null) offset = view.viewport.from;

  let line = view.state.doc.lineAt(offset);
  let off = offset - line.from;

  // Calculate the pixel offset from the start of the line text
  let px;
  if (off > MaxOff) {
    px = -1;
  } else if (off === line.length) {
    // If the mouse is past the end of the text, calculate pixel offset directly from clientX
    px = absolutePx(view, event.clientX);
  } else {
    // Measure the text string exactly up to the character offset
    px = measureLine(line.text.slice(0, off));
  }

  return { line: line.number, px, off };
}

function rectangleSelectionStyle(view, event) {
  let start = getPos(view, event);
  let startSel = view.state.selection;
  if (!start) return null;

  return {
    update(update) {
      // Map the selection anchor correctly if the document changes while dragging
      if (update.docChanged) {
        let newStart = update.changes.mapPos(update.startState.doc.line(start.line).from);
        let newLine = update.state.doc.lineAt(newStart);
        start = {
          line: newLine.number, 
          px: start.px, // Retain the same visual X pixel anchor
          off: Math.min(start.off, newLine.length) 
        };
        startSel = startSel.map(update.changes);
      }
    },
    get(event, _extend, multiple) {
      let cur = getPos(view, event);
      let sel;
      
      if (!cur) {
        sel = startSel;
      } else {
        let ranges = rectangleFor(view.state, start, cur);
        if (!ranges.length) sel = startSel;
        else if (multiple) sel = EditorSelection.create(ranges.concat(startSel.ranges));
        else sel = EditorSelection.create(ranges);
      }

      // Add these selections to the WeakSet to keep track of which were created by the rectangular selection.
      rectangularSelections.add(sel);
      return sel;
    }
  };
}

/// Create an extension that enables rectangular selections. By
/// default, it will react to left mouse drag with the Alt key held
/// down. Compatible with proportional fonts.
function rectangularSelection(options) {
  let filter = options?.eventFilter || (e => e.altKey && e.button === 0);
  return [
    isRectangularSelectionField,
    rectSelectionExtender,
    EditorView.mouseSelectionStyle.of((view, event) => 
      filter(event) ? rectangleSelectionStyle(view, event) : null
    )
  ];
}



