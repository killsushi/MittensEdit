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

// Line operations. All these editor commands pass through doToAllOrSelected.
// They all do some kind of line-based edit and will either run for the whole document or only for the selected lines at the time of invocation.

function prependInitialSpaces(view) {
  doToAllOrSelected(view, (state, line) => {
    return ({
        from: line.from,
        to: line.from,
        insert: "\u3000"
      });
  });
  return true;
}

function removeInitialSpaces(view) {
  doToAllOrSelected(view, (state, line) => {
    const match = spaceatstart.exec(line.text);
    const newspace = generateSpacing(measureLine(match) - 11);

    if (match && match[0].length > 0) {
      return ({
        from: line.from,
        to: line.from + match[0].length,
        insert: newspace
        });
    }
    else return false;
  });
  return true;
}

function incrementByOnePx(view) {
  doToAllOrSelected(view, (state, line) => {
    const match = spaceatstart.exec(line.text);
    const newspace = generateSpacing(measureLine(match) + 1);
    let leftoffset = 0;

    if (match && match[0].length > 0) {
      leftoffset = match[0].length;
    }

    return ({
        from: line.from,
        to: line.from + leftoffset,
        insert: newspace
    });
  });
  return true;
}

function decrementByOnePx(view) {
  doToAllOrSelected(view, (state, line) => {
    const match = spaceatstart.exec(line.text);
    let newspace = 0;
    let leftoffset = 0;

    if (match && match[0].length > 0) {
      leftoffset = match[0].length;
      newspace = generateSpacing(measureLine(match) - 1);
    }
    else {
      if ([...line.text][0] == undefined) return false;
      
      leftoffset = 1;
      newspace = generateSpacing(measureLine([...line.text][0]) - 1);
    }

    return ({
        from: line.from,
        to: line.from + leftoffset,
        insert: newspace
    });
  });
  return true;
}

function removeTrailingWhitespace(view) {
  doToAllOrSelected(view, (state, line) => {
    const match = spaceatend.exec(line.text);

    if (match && match[0].length > 0) {
      return ({
        from: line.to - match[0].length,
        to: line.to,
        insert: ""
        });
    }
    else return false;
  });
  return true;
}

function removeFinalChar(view) {
  doToAllOrSelected(view, (state, line) => {
    const notspaceatend = /[^\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+$/u;
    const match = notspaceatend.exec(line.text);

    if (match && match[0].length > 0) {
      return ({
        from: line.to - 1,
        to: line.to,
        insert: ""
        });
    }
    else return false;
  });
  return true;
}

function addBarToEnd(view) {
  const longest = longestWidthInAllOrSelected(view);
  
  if (useUnicodeSp) {
    doToAllOrSelected(view, (state, line) => {
      return ({
          from: line.to,
          to: line.to,
          insert: (generateSpacing(longest - measureLine(line.text) + 22) + "|")
      });
    });
  }
  else {
    doToAllOrSelected(view, (state, line) => {
      const leftpadding = longest - measureLine(line.text);
      const numFWS = Math.floor(leftpadding / 11);
      const remainderPx = leftpadding % 11;
      
      let newspace = "";
      
      for(let i = 0; i < numFWS; i++) newspace += "\u3000";
      newspace += gaatDotPtrnPeriod[remainderPx]; // Get remainder with period padding from array. All periods aligned to end _unlike_ DocPaddingSpaceWithPeriod,
      // For ease of deletion with removeFinalChar, since you can trim off the non-space chars added by calling it a bunch. Makes guideline cleanup easier.
      // OrinrinEditor does it this way. OrinrinEditor also uses a similar padding array for Unicode mode which aligns Unicode spaces to the very right.
      // I don't bother doing that.      
      
      return ({
          from: line.to,
          to: line.to,
          insert: (newspace + "|")
      });
    });
  }
  return true;
}

function alignToRight(view) {
  const longest = longestWidthInAllOrSelected(view);
  const rightpadding = rightguidelineoffset - longest;
  if (rightpadding <= 0) return true; // Do nothing
  
  doToAllOrSelected(view, (state, line) => {
    const match = spaceatstart.exec(line.text);
    let rightoffset = 0;
    const newspace = useUnicodeSp ? generateSpacing(measureLine(match) + rightpadding)
                                  : DocPaddingSpaceWithPeriod(measureLine(match) + rightpadding);

    if (match && match[0].length > 0) {
      rightoffset = match[0].length;
    }

    return ({
        from: line.from,
        to: line.from + rightoffset,
        insert: newspace
    });
    //return ({
    //    from: line.from,
    //    to: line.from,
    //    insert: rightpadding
    //});
  });
  return true;
}

function initialHWStoUnicode(view) {
  doToAllOrSelected(view, (state, line) => {
    if ([...line.text][0] == " ") {
      return ({
        from: line.from,
        to: line.from + 1,
        insert: "\u2004"
        });
    }
    else return false;
  });
  return true;
}

function normalizeSpacing(view) {
  doToAllOrSelected(view, (state, line) => {
    if (true) {
      const normalizedline = line.text.replace(
        matchallspaces,
        match => generateSpacing(measureLine(match))
      );
      return ({
        from: line.from,
        to: line.to,
        insert: normalizedline
        });
    }
    else return false;
  });
}

function spacingToSJISWithPeriod(view) {
  //const matchbadspaceorunispace = /^\u0020|\u0020(\u0020)+|[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003]/gu;
  
  // To whoever inevitably ends up working on this editor after me, I am so sorry.
  // Matches any run of spaces containing bad spaces OR a unicode space
  // OR matches a run of spaces starting with a HWS at the start of the string
  // Could probably be optimized.
  //const thehellregex = /^\u0020[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+|(?=[\u0020\u3000]*[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003]|[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*\u0020\u0020)[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+/gu;  
  //const thehellregex = /^\u0020[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+|[\u0020\u3000]*[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003][\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*/gu;
  
  //Working version
  //const thehellregex = /^\u0020[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+|[\u0020\u3000]*[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003][\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*|[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*\u0020\u0020[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*/gu;
  
  //const thehellregex = /^\u0020[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+|[\u0020\u3000]*[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003][\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*|[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u3000\u2003]*(?:\u0020[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u3000\u2003]+)*\u0020\u0020[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*/gu;
  
  const thehellregex = /^\u0020[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+|[\u0020\u3000]*[\u200A\u2009\u2006\u2005\u2004\u2002\u2007\u2003][\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]*|\u3000*(?: \u3000+)*  [ \u3000]*/gu;
  
  doToAllOrSelected(view, (state, line) => {
    // No point in changing lines when there's nothing to replace
    if (thehellregex.test(line.text)) {
      const normalizedline = line.text.replace(
        thehellregex,
        match => DocPaddingSpaceWithPeriod(measureLine(match))
      ).replace(
        /^\u0020\u3000\u0020/u,
        match => "......." // Get rid of initial HWS-FWS-HWS sequences
      );
      return ({
        from: line.from,
        to: line.to,
        insert: normalizedline
        });
    }
    else return false;
  });
}


