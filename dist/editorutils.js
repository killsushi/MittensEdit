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



function splitRangeByLine(state, range) {
  const doc = state.doc;

  const startLine = doc.lineAt(range.from).number;
  const endLine = doc.lineAt(range.to).number;

  if(startLine == endLine)
    return [{ from: range.from, to: range.to }];

  const split = [];
  split.push({ from: range.from, to: doc.line(startLine).to });
  for (let i = startLine + 1; i <= endLine - 1; i++) {
    split.push({ from: doc.line(i).from, to: doc.line(i).to });
  }
  split.push({ from: doc.line(endLine).from, to: range.to });

  return split;
}

function splitRangesByLine(state, ranges) {
  let splitranges = [].concat.apply([], ranges.map(r => (splitRangeByLine(state, r))));

  return splitranges;
}

function splitRangesByLineFilterEmpty(state, ranges) {
  //const ranges = state.selection.ranges;
  
  let splitranges = [].concat.apply([], ranges.map(r => (splitRangeByLine(state, r))));
  splitranges = splitranges.filter((range) => range.from != range.to);

  return splitranges;
}

// Goes over an array of numbers and returns objects indicating the starts and ends of all runs of consecutive numbers in it.
// Used in mirrorVerticallyByLine to merge selections in case of multiple starting and ending on the same line.
function linesToRanges(arr) {
  if (arr.length === 0) return [];

  const result = [];

  // Initialize the first run
  let start = arr[0];
  let prev = arr[0];

  for (let i = 1; i < arr.length; i++) {
    const curr = arr[i];

    if (curr === prev + 1) {
      prev = curr;
      continue;
    }

    result.push({ start: start, end: prev });

    // Start a new run
    start = curr;
    prev = curr;
  }

  // Push last run
  result.push({ start: start, end: prev });

  return result;
}


function longestLineInString(str) {
  var lines = splitLines(str);
  var longest = lines.reduce(
    function (a, b) {
      return measureLine(a) > measureLine(b) ? a : b;
    }
  );
  return measureLine(longest);
}

function longestWidthInAllOrSelected(view) {
  const { state } = view;
  let longest = 0;

  const ranges = state.selection.ranges;
  //const splitranges = splitRangesByLineFilterEmpty(state, state.selection.ranges);
  const rangesfiltered = ranges.filter((range) => range.from != range.to);
  
  if (rangesfiltered.length != 0) {
    const splitranges = splitRangesByLine(state, ranges);
    const linesset = new Set();

    // If two selections are on one line, make sure that the function isn't run twice for it
    splitranges.forEach((r) => {
      linesset.add(state.doc.lineAt(r.from).number);
    });
    
    [...linesset].forEach((l) => {
      const lengthofline = measureLine(state.doc.line(l).text);
      if (lengthofline > longest) longest = lengthofline;
    });
  }
  else {
    for (let i = 1; i <= state.doc.lines; i++) {
      const lengthofline = measureLine(state.doc.line(i).text);
      if (lengthofline > longest) longest = lengthofline;
    }
  }
  
  return longest;
}

// Takes a function that outputs a transaction that edits one line,
// Runs it for either the whole document or only the selected lines.
function doToAllOrSelected(view, lineTransactionGenerator) {
  const { state } = view;
  const changes = [];
  //let newranges = [];

  const ranges = state.selection.ranges;
  // Filter out ranges that are just cursors
  const rangesfiltered = ranges.filter((range) => range.from != range.to);
  
  if (rangesfiltered.length != 0) {
    const linesset = new Set();
    const splitranges = splitRangesByLine(state, rangesfiltered);

    // If two selections are on one line, make sure that the function isn't run twice for it
    splitranges.forEach((r) => {
      linesset.add(state.doc.lineAt(r.from).number);
    });
    
    [...linesset].forEach((l) => {
      const line = state.doc.line(l);
      const transaction = lineTransactionGenerator(state, line);
      if (transaction != false) changes.push(transaction);
    });

    const changeDesc = view.state.changes(changes);
    const newranges = rangesfiltered.map(r => {
      const startLinePos = changeDesc.mapPos(state.doc.lineAt(r.from).from, -1);
      const endLinePos = changeDesc.mapPos(state.doc.lineAt(r.to).to, 1);
      return EditorSelection.range(startLinePos, endLinePos);
    });
    /*const newranges = [...linesset].map(l => {
      const line = state.doc.line(l);
      return EditorSelection.range(line.from, line.to).map(changeDesc);
    });*/

    view.dispatch({
      changes: changes,
      selection: EditorSelection.create(newranges)
    });
  }
  else {
    for (let i = 1; i <= state.doc.lines; i++) {
      const line = state.doc.line(i);
      const transaction = lineTransactionGenerator(state, line);
      if (transaction != false) changes.push(transaction);
    }

    view.dispatch({
      changes: changes,
    });
  }

  return true;
}


