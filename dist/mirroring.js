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


// Sourced from hantenX.txt used in OrinrinEditor
const mirrorX = [
  ["\u250c", "\u2510"],
  ["\u2514", "\u2518"],
  ["\u251c", "\u2524"],
  ["\u250f", "\u2513"],
  ["\u2517", "\u251b"],
  ["\u2523", "\u252b"],
  ["\u2520", "\u2528"],
  ["\u251d", "\u2525"],
  ["\u2208", "\u220b"],
  ["\u2286", "\u2287"],
  ["\u2282", "\u2283"],
  ["\uff3c", "\uff0f"],
  ["\uff1c", "\uff1e"],
  ["\u226a", "\u226b"],
  ["\u2266", "\u2267"],
  ["\u2220", "\uff9d\uff64"],
  ["\u0028", "\u0029"],
  ["\uff08", "\uff09"],
  ["\u3010", "\u3011"],
  ["\u005b", "\u005d"],
  ["\u3014", "\u3015"],
  ["\u007b", "\u007d"],
  ["\uff5b", "\uff5d"],
  ["\u003c", "\u003e"],
  ["\u3008", "\u3009"],
  ["\u300a", "\u300b"],
  ["\u2192", "\u2190"],
  ["\u0395", "\u2203"],
  ["\u039d", "\u0418"],
  ["\u042f", "\uff32"],
  ["\u044f", "\u0052"],
  ["\u2173", "\u2175"],
  ["\u2163", "\u2165"],
  ["\u03b5", "\u0437"],
  ["\u30fe", "\u30c3"],
  ["\u3003", "\uff9e\u30c3"],
  ["\u309e", "\uff9e\uff68"],
  ["\uff92", "\uff77"],
  ["\u004c", "\u005f\u006c"],
  ["\u0070", "\u0071"],
  ["\uff50", "\uff51"],
  ["\uff42", "\uff44"],
  ["\u0062", "\u0064"],
  ["\uff2b", "\u003e\u0021"],
  ["\uff3a", "\uff2e"],
  ["\uff2a", "\uff9a"],
  ["\u3044", "\u0072\u0020\u006a"],
  ["\u3068", "\u3064"],
  ["\u30df\u005f", "\u5f61"],
  ["\u304f", "\uff9d"],
  ["\u00b4", "\uff40"],
  ["\u2019", "\u2018"],
  ["\u201c", "\u201d"],
  ["\u0022", "\u309b"],
  ["\uff93", "\uff96"],
  ["\uff72", "\uff84"],
  ["\u002c\u0072\u0027", "\u30fd"],
  ["\u002c\u0020\u0027\u0020", "\u4e36"],
  ["\u002f", "\uff9e\uff49"],
  ["\uff89", "\u0028\u002c"],
  ["\u30ce", "\u0021\uff64"],
  ["\u305b", "\u30b5"],
  ["\uff7e", "\uff7b"],
  ["\u30e2", "\u30c6"],
  ["\u3055", "\u3061"],
  ["\u0061", "\u0065"],
  ["\u0031", "\u300c"],
  ["\u30ec", "\uff64\u002e\u007c"],
  ["\u0020\u002c\u002e", "\u3001"]
];

// Sourced from hantenY.txt used in OrinrinEditor
const mirrorY = [
  ["\u2514", "\u250c"],
  ["\u2518", "\u2510"],
  ["\u2534", "\u252c"],
  ["\u2517", "\u250f"],
  ["\u251b", "\u2513"],
  ["\u253b", "\u2533"],
  ["\u2537", "\u252f"],
  ["\u2538", "\u2530"],
  ["\uff0f", "\uff3c"],
  ["\u5f61", "\u30df"],
  ["\u309e", "\u30c4"],
  ["\u30fe", "\u30b7"],
  ["\u002f", "\uff8d"],
  ["\u2229", "\u222a"],
  ["\u2229", "\u222a"],
  ["\uff35", "\u03a0"],
  ["\u301d", "\u301f"],
  ["\u2191", "\u2193"],
  ["\u25bd", "\u25b3"],
  ["\u25bc", "\u25b2"],
  ["\u309c", "\u3002"],
  ["\uff9f", "\uff61"],
  ["\u2227", "\u2228"],
  ["\u2234", "\u2235"],
  ["\u0056", "\u0041"],
  ["\uff36", "\uff21"],
  ["\u0062", "\u0070"],
  ["\u0064", "\u0071"],
  ["\uff42", "\uff50"],
  ["\uff44", "\uff51"],
  ["\u0055", "\uff48"],
  ["\uff46", "\uff54"],
  ["\u006e", "\u0075"],
  ["\uff4e", "\uff55"],
  ["\u006d", "\u0077"],
  ["\uff4d", "\uff57"],
  ["\uff62", "\u004c"],
  ["\u0060", "\u002c\u002c"],
  ["\u007e", "\u005f"],
  ["\u00b4", "\uff64"],
  ["\uff40", "\u002c\u002e"],
  ["\u0414", "\u0426"],
  ["\u2200", "\u0410"],
  ["\u0046", "\uff8b"],
  ["\u3057", "\u300c\uff9e"],
  ["\uffe3", "\uff3f"],
  ["\u30fc", "\u002d\u2010"],
  ["\u4e0a", "\u4e0b"],
  ["\u5e72", "\u571f"],
  ["\u0069", "\u0021"],
  ["\u0036", "\u0039"],
  ["\u0057", "\u004d"],
  ["\u22a5", "\u0054"],
  ["\u0418", "\u039d"],
  ["\u03c3", "\u03c1"]
];

// Recomputing the map and regex each time is a bit silly, I should compute those once and cache them
function replaceMirrored(str, mirrorArray, reverseOrder = false) {
  const map = new Map();
  for (const [a, b] of mirrorArray) {
    map.set(a, b);
    map.set(b, a);
  }
  const keys = [...map.keys()].sort((a, b) => b.length - a.length);
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!reverseOrder) {
    const regex = new RegExp(keys.map(escape).join("|"), "gu");
    return str.replace(regex, match => map.get(match));
  } else {
    const regex = new RegExp(keys.map(escape).join("|") + "|[\\s\\S]", "gu");
    const tokens = [];
    
    for (const match of str.matchAll(regex)) {
      const val = match[0];
      tokens.push(map.has(val) ? map.get(val) : val);
    }
    return tokens.reverse().join("");
  }
}

function mirrorHorizontallyByLine(view) {
  const longest = longestWidthInAllOrSelected(view);
  
  doToAllOrSelected(view, (state, line) => {
    if (line.text === "") return false;
    
    //let reversedline = [...line.text].reverse().join("");
    const reversedline = replaceMirrored(line.text, mirrorX, true);
    const padding = generateSpacing(longest - measureLine(line.text));

    return ({
        from: line.from,
        to: line.to,
        insert: padding + reversedline
    });
  });
  return true;
}

function mirrorHorizontallyBySelection(view) {
  const { state } = view;
  view.dispatch(state.changeByRange(range => {
    if (range.empty) return { changes: [], range };
    const splitrange = splitRangeByLine(state, range);
    //console.log(splitrange);
    let reversedline = splitrange.map(r => {
      const lineStr = state.doc.sliceString(r.from, r.to);
      return replaceMirrored(lineStr, mirrorX, true);
    }).join("\n");
    
    return {
      changes: { from: range.from, to: range.to, insert: reversedline },
      range: EditorSelection.range(range.from, range.from + [...reversedline].length)
    }
  }));
  return true;
}

function mirrorVerticallyByLine(view) {
  const { state } = view;
  const changes = [];

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
    
    const startAndEndLines = linesToRanges([...linesset]);

    startAndEndLines.forEach((r) => {
      const startline = state.doc.line(r.start);
      const endline = state.doc.line(r.end);

      let mirrored = state.doc.sliceString(startline.from, endline.to).split("\n").reverse().join("\n");
      mirrored = replaceMirrored(mirrored, mirrorY);
      
      changes.push({
        from: startline.from,
        to: endline.to,
        insert: mirrored
      });
    });

    const changeDesc = view.state.changes(changes);
    const newranges = startAndEndLines.map(r => {
      const startLine = state.doc.line(r.start);
      const endLine = state.doc.line(r.end);
      return EditorSelection.range(startLine.from, endLine.to).map(changeDesc);
    });

    view.dispatch({
      changes: changes,
      selection: EditorSelection.create(newranges)
    });
  }
  else {
    let mirrored = state.doc.toString().split("\n").reverse().join("\n");
    mirrored = replaceMirrored(mirrored, mirrorY);

    view.dispatch({
      changes: {from: 0,
                to: state.doc.line(state.doc.lines).to,
                insert: mirrored
               }
    });
  }
  
  return true;
}

function mirrorVerticallyRectangleSelect(view) {
  const { state } = view;
  const changes = [];
  const lines = [];
  const rangestoreplace = [];

  const ranges = state.selection.ranges;
  //console.log(ranges);

  const startline = state.doc.lineAt(ranges[0].from);
  const endline = state.doc.lineAt(ranges[ranges.length - 1].from);

  for (let i = startline.number, n = 0; i <= endline.number; i++) {
    if (state.doc.lineAt(ranges[n].from).number != i) {
      lines.push("");
      rangestoreplace.push({
        from: state.doc.line(i).to,
        to: state.doc.line(i).to
      });
      continue;
    }
    
    const mirroredline = replaceMirrored(state.doc.sliceString(ranges[n].from, ranges[n].to), mirrorY);
    lines.push(mirroredline);
    rangestoreplace.push(ranges[n]);
    n++;
  }
  //console.log(lines);
  //if (rangestoreplace.length == lines.length) console.log("yippee");

  for (let i = 0, n = lines.length - 1; i < lines.length; i++, n--) {
    changes.push({
        from: rangestoreplace[i].from,
        to: rangestoreplace[i].to,
        insert: lines[n]
      });
  }
  //console.log(changes);

  // Selections aren't set properly if a non-empty selection was mirrored into an empty line.
  // To be honest, I can't be bothered to fix this. This isn't important at all.
  // This code here does nothing.
  /*const changeDesc = view.state.changes(changes);
  const newranges = rangestoreplace.map(r => {
    return EditorSelection.range(r.from, r.to).map(changeDesc);
  });*/
  
  view.dispatch({
      changes: changes//,
      //selection: EditorSelection.create(newranges)
    });

  return true;
}

function mirrorVertically(view) {
  const isRectangular = view.state.field(isRectangularSelectionField, false);

  if (isRectangular) {
    mirrorVerticallyRectangleSelect(view);
  } else {
    mirrorVerticallyByLine(view);
  }

  return true;
}

