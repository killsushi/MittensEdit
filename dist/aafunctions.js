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

// Editor-independent AA editing code.

const splitLines = (str) => str.split(/\r?\n/);

//const spaceatstart = /^[        　 ]+/u;
//const spaceatend = /[        　 ]+$/u;
const matchallspaces = /[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+/gu;
const spaceatstart = /^[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+/u;
const spaceatend = /[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+$/u;
const onlyspaces = /^[\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+$/u;;
const notspacesornewlines = /[^\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003\r\n]+/gu;

// There might be better ways of doing this.
// I am assuming that this will only ever return exact pixel amounts, which is true because it AA fonts
// are bitmap fonts, but this may fail when a character falls outsize the range covered by the font,
// and then break everything terribly. Test that later.
// UPDATE: I added Math.round to it because it was returning non-integer values on Linux
// I now need to test if Math.round ever adds an extra pixel from rounding up, or if I need to use Math.floor instead.
// (Further testing shows that it does not return extra pixels.)
/*function measureLine(txt) {
  if (measureLine.c === undefined) {
    measureLine.c = document.createElement("canvas");
    measureLine.ctx = measureLine.c.getContext("2d");
    measureLine.ctx.font = "16px Saitamaar";
  }
  if (txt == null) return 0;
  return Math.round(measureLine.ctx.measureText(txt).width);
}*/


/*function measureLine(text) {
  if (measureLine.c === undefined) {
    measureLine.c = document.createElement("canvas");
    measureLine.ctx = measureLine.c.getContext("2d");
    measureLine.ctx.font = "16px Saitamaar";
  }
  if (text === null) return 0;
  let totalwidth = 0;
  
  for (const char of text) {
      if (!charCache.has(char)) {
          // Measure once and cache it forever
          let width = Math.round(measureLine.ctx.measureText(char).width);
          charCache.set(char, width);
      }
      totalwidth += charCache.get(char);
  }
  
  return totalwidth;
}*/

const charCache = new Map();

/**
 * Takes a string and returns its length in pixels in an AA font.
 * @param {string} str - The string to measure.
 * @returns {number} The length in pixels.
 */
function measureLine(text) {
  if (measureLine.c === undefined) {
    measureLine.c = document.createElement("canvas");
    measureLine.c.height = '300px';
    measureLine.c.width = '4000px';
    measureLine.ctx = measureLine.c.getContext("2d");
    measureLine.ctx.font = "16px Saitamaar";
  }
  if (text === null) return 0;
  
  // There are a few crappy functions that pass arrays resulting from regex matches into here instead of text
  // Should all be fixed now though. Probably.
  if (Array.isArray(text)) { console.log("DID A FUCKY"); text = text[0]; }
  
  let totalwidth = 0;
  
  for (const char of text) {
    if (!charCache.has(char)) {
      // Measure each char individually and cache it forever
      let width = Math.round(measureLine.ctx.measureText(char).width / 1);
      charCache.set(char, width);
    }
    totalwidth += charCache.get(char);
  }

  return totalwidth;
}


/**
 * Finds the character index closest to a given pixel offset using a binary search.
 * I should probably modify compositeAALine to use this instead of having two slightly different
 * binary searches baked into it.
 * @param {string} str - The string to measure.
 * @param {number} offset - The target pixel offset.
 * @param {number} roundMode - 0: nearest boundary, -1: strict previous, 1: strict next.
 * @returns {number} The character index boundary.
 */
function indexClosestToPxOffset(str, offset, roundMode = 0) {
  const chars = [...str];
  
  // If offset overshoots the whole string, return the end.
  if (offset >= measureLine(str)) {
    return chars.length;
  }
  
  let low = 0;
  let high = chars.length;
  let leftBoundary = 0;
  
  // Binary search to find the closest boundary to the left of the offset
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    let curWidth = measureLine(chars.slice(0, mid).join(""));
    
    if (curWidth <= offset) {
      leftBoundary = mid;
      low = mid + 1;   // Push right to see if we can get closer without overshooting
    } else {
      high = mid - 1;  // Too wide, push left
    }
  }
  
  let rightBoundary = leftBoundary + 1;
  
  let leftWidth = measureLine(chars.slice(0, leftBoundary).join(""));
  let rightWidth = measureLine(chars.slice(0, rightBoundary).join(""));
      
  if (leftWidth === offset) {
    return leftBoundary; // We landed exactly on a character boundary
  }
  
  if (roundMode < 0) {
    return leftBoundary;
  } else if (roundMode > 0) {
    return rightBoundary;
  } else {
    // Round to nearest, compare the absolute distances
    let leftDist = offset - leftWidth;
    let rightDist = rightWidth - offset;
    
    return (leftDist <= rightDist) ? leftBoundary : rightBoundary;
  }
}

// I assumed that not calling measureLine over and over again and instead doing what measureLine
// itself does and iterating over the string by chars and accumulating the length right in here
// would be faster, but somehow the original performed (visually) faster (no real benchmarking done).
// Too busy to think about this. Probably doing something really stupid. Kind of in a rush.
/*function indexClosestToPxOffset(str, offset, roundMode = 0) {
  if (indexClosestToPxOffset.c === undefined) {
    indexClosestToPxOffset.c = document.createElement("canvas");
    indexClosestToPxOffset.c.height = '300px';
    indexClosestToPxOffset.c.width = '4000px';
    indexClosestToPxOffset.ctx = indexClosestToPxOffset.c.getContext("2d");
    indexClosestToPxOffset.ctx.font = "16px Saitamaar";
  }
  const chars = [...str];
    
  let rightBoundary = 0;
  let leftBoundary = 0;
  let rightwidth = 0;
  let leftwidth = 0;
  
  for (const char of chars) {
    if (rightwidth >= offset) break;
    
    if (!charCache.has(char)) {
    // Measure each char individually and cache it forever
      let width = Math.round(indexClosestToPxOffset.ctx.measureText(char).width / 1);
      charCache.set(char, width);
    }
    
    leftwidth = rightwidth;
    leftBoundary = rightBoundary;
    rightwidth += charCache.get(char);
    rightBoundary++;
    
    console.log('left' + leftwidth + ' ' + leftBoundary);
    console.log('right' + rightwidth + ' ' + rightBoundary);
  }
  
  if (rightwidth === offset) {
      return rightBoundary; // We landed exactly on a character boundary
  }
  
  if (roundMode < 0) {
    return leftBoundary;
  } else if (roundMode > 0) {
    return rightBoundary;
  } else {
    // Round to nearest, compare the absolute distances
    let leftDist = offset - leftwidth;
    let rightDist = rightwidth - offset;
    
    return (leftDist <= rightDist) ? leftBoundary : rightBoundary;
  }
}*/

// TO DO: Go through all the OrinrinEditor space generation functions and give them descriptive names and variable names.

// Ported from OrinrinEditor.
// Adjust the number of spaces used by subtracting.
// Returns array with new number of full-width and half-width spaces.
// Returns null if failure.
function SpaceWidthAdjust(dDot, dZen, dHan)
{
  let size;

  do
  {
    size = (dZen * 11) + (dHan * 5);

    if( dDot == size )
    {
      return (/*arr =*/ [dZen, dHan]);
    }

    dZen--; // Full SP: 11dots, half SP: 5dots, so
    dHan += 2; // Reduce all SP and increase half SP 2 to shrink by 1 dot
  }
  while(  0 <= dZen );  // Out when all SP is exhausted

  return null;
}

// Ported from OrinrinEditor
// Returns a string of full-width spaces and half-width spaces.
// dZen = number of full-width spaces
// dHan = number of half-width (ascii) spaces
function SpaceStrAlloc(dZen, dHan)
{
  let cchSize;
  let ptStr = [];

  cchSize = dZen + dHan; // total number of spaces needed

  for(let i = (cchSize - 1); 0 <= i; )
  {
    if( 0 < dHan )
    {
      ptStr[i--] = " ";
      dHan--;
      if( 0 >  i )  break;
    }

    if( 0 < dZen )
    {
      ptStr[i--] = "\u3000";
      dZen--;
      if( 0 >  i )  break;
    }
  }

  return ptStr.join("");
}

// Ported from OrinrinEditor
// Returns an array where:
// arr[0] = string of spaces
// arr[1] = number of full-width spaces
// arr[2] = number of half-width spaces
// If failed to generate string, returns null.
function DocPaddingSpace(dTgtDot) {
  let dZen, dHan, dUni;
  let iCnt = 0, iRem = 0;
  let dRslt = [];
  let ptStr = "";
  
  // Can't generate string if target dot count is 0 or less
  if( 0 >= dTgtDot )  return "";
  
  iCnt = Math.floor(dTgtDot / 11); // Fill in as many full-width spaces as possible
  iRem = dTgtDot % 11; // Remaining space not filled by full-width spaces
  
  dZen = iCnt; // Number of full-width spaces for now
  
  if( 1 <= iRem && iRem <= 5 ) // Fill remainder with half-width space
  {
    dHan = 1;
  }
    else if( 6 <= iRem && iRem <= 10 ) // Fill remainder with full-width space
  {
    dHan = 0;
    dZen++;
  }
  else // it was perfect
  {
    dHan = 0;
  }

  // number adjustment
  dRslt = SpaceWidthAdjust(dTgtDot, dZen, dHan);
  
  if(dRslt != null)
  {
    dZen = dRslt[0];
    dHan = dRslt[1];

    // Create string of spaces
    ptStr = SpaceStrAlloc(dZen, dHan);

    return (/*arr =*/ [ptStr, dZen, dHan]);
  }
  
  return null;
}

// Ported from OrinrinEditor
const gaatPaddingSpDotW = [
  [""], // 0 pixels, no space
  ["\u200A"], // 1 pixel, HAIR SPACE
  ["\u2009"], // 2 pixels, THIN SPACE
  ["\u2006"], // 3 pixels, SIX-PER-EM SPACE
  ["\u2005"], // 4 pixels, FOUR-PER-EM SPACE
  [" "], // 5 pixels, half-width space (normal ascii)
  ["\u200A", " "], // 6 pixels, HAIR SPACE + half-width space (normal ascii)
  ["\u2009", " "], // 7 pixels, THIN SPACE + half-width space (normal ascii)
  ["\u2002"], // 8 pixels, EN SPACE
  ["\u2005", " "], // 9 pixels, FOUR-PER-EM SPACE + half-width space (normal ascii)
  ["\u2007"]  // 10 pixels, FIGURE SPACE
];

// Ported from OrinrinEditor
// Generates a space string of a target pixel length. Uses Unicode spaces to fill in extra space.
function DocPaddingSpaceUni(dTgtDot) {
  let dZen, dHan, dUni;
  let iCnt = 0, iRem = 0;
  let i = 0;
  let ptStr = "";
  
  // Can't generate string if target dot count is 0 or less
  if( 0 >= dTgtDot )  return "";
  
  iCnt = Math.floor(dTgtDot / 11); // Fill in as many full-width spaces as possible
  iRem = dTgtDot % 11; // Remaining space not filled by full-width spaces
  
  dZen = iCnt; // Number of full-width spaces for now
  
  switch(iRem) // Figure out number of half-width or unicode spaces needed based on remainder.
  {
    case  1:  dUni = 1;  dHan = 0;  break;
    case  2:  dUni = 1;  dHan = 0;  break;
    case  3:  dUni = 1;  dHan = 0;  break;
    case  4:  dUni = 1;  dHan = 0;  break;
    case  5:  dUni = 0;  dHan = 1;  break;
    case  6:  dUni = 1;  dHan = 1;  break;
    case  7:  dUni = 1;  dHan = 1;  break;
    case  8:  dUni = 1;  dHan = 0;  break;
    case  9:  dUni = 1;  dHan = 1;  break;
    case 10:  dUni = 1;  dHan = 0;  break;
    default:  dUni = 0;  dHan = 0;  break;
  }

  for(i = 0; dZen > i; i++ ) ptStr = ptStr + "\u3000";
  
  switch( iRem ) // Add the remainder
  {
    case  1:  ptStr = ptStr + gaatPaddingSpDotW[1][0]; break;
    case  2:  ptStr = ptStr + gaatPaddingSpDotW[2][0]; break;
    case  3:  ptStr = ptStr + gaatPaddingSpDotW[3][0]; break;
    case  4:  ptStr = ptStr + gaatPaddingSpDotW[4][0]; break;
    case  5:  ptStr = ptStr + gaatPaddingSpDotW[5][0]; break;
    case  6:  ptStr = ptStr + gaatPaddingSpDotW[6][0] + gaatPaddingSpDotW[6][1]; break;
    case  7:  ptStr = ptStr + gaatPaddingSpDotW[7][0] + gaatPaddingSpDotW[7][1]; break;
    case  8:  ptStr = ptStr + gaatPaddingSpDotW[8][0]; break;
    case  9:  ptStr = ptStr + gaatPaddingSpDotW[9][0] + gaatPaddingSpDotW[9][1]; break;
    case 10:  ptStr = ptStr + gaatPaddingSpDotW[10][0];  break;
    default:  break;
  }

  return ptStr;
}

// Ported from OrinrinEditor
// Generates string of spaces, attempting to hit a pixel width. May be inexact or fail.
// Uses only S_JIS spaces (HWS and FWS)
// Returns array, ["string of spaces", num_FWS_used, num_HWS_used]
function DocPaddingSpaceWithGap(dTgtDot/*, PINT pdZenSp, PINT pdHanSp */)
{
	let		cchSize, i;
	let spaceStrArr = null;

	if( 16 <= dTgtDot )	// Google translated from OrinrinEditor: "Find a range that fits while increasing the width."
	{
		i = 0;

		do
		{
			if( 22 < i )	return null;	// Google translated from OrinrinEditor: "Prevents infinite loops. I think it should be fine."

			spaceStrArr = DocPaddingSpace(dTgtDot);
			dTgtDot++;	i++;

		}while(spaceStrArr === null);

		return spaceStrArr;
	}

	if( 7 >= dTgtDot )	// Ignore one half-width space
	{
    spaceStrArr = [' ', 0, 1];
	}
	else if( 8 <= dTgtDot && dTgtDot <= 15 )	// Fudge with one full-width space
	{
    spaceStrArr = ['\u3000', 1, 0];
	}

	return spaceStrArr;
}

// Ported from OrinrinEditor
const gaatDotPtrnPeriod = [
  "　　", // 22 0
  "　....", // 23 1
  " 　 .", // 24 2
  "　　.", // 25 3
  "　.....", // 26 4
  "　　 ", // 27 5
  "　　..", // 28 6
  "　......", // 29 7
  "　　 .", // 30 8
  "　　...", // 31 9
  "　 　 " // 32 10
];

// Ported from OrinrinEditor
const gaatPaddingSpDot = [
	"",		//	0
	"",		//	1	0 // Originally had this as "." but this might be better.
	".",		//	2	3
	".",		//	3	3
	".",		//	4	3
	" ",		//	5
	"..",		//	6
	"..",		//	7	6
	". ",		//	8
	"...",		//	9
	"　",		//	10	11
	"　",		//	11
	"....",		//	12
	".　",		//	13	14
	".　",		//	14
	".....",		//	15
	"　 ",		//	16
	".　.",		//	17
	"......",		//	18
	". 　",		//	19
	"..　.",		//	20
	" 　 ",		//	21
	"　　",		//	22
	"..　..",		//	23
	"　 . ",		//	24
	".　　",		//	25
	"...　..",		//	26
	"　 　",		//	27
	".　　.",	//	28
	"...　...",	//	29
	".　 　",	//	30
	".　.　.",	//	31
	"　 　 ",	//	32
	"　　　"		//	33
];

// Ported from OrinrinEditor
// Generate space with periods
function DocPaddingSpaceWithPeriod(dTgtDot) {
  if (dTgtDot <= 0) return "";
  
	let	dZenSp, dHanSp, dPrdSp, m, dPre;
	let	ptSpace = null, ptPlus = null;
	let	cchSize, cchPlus;


	dPre = dTgtDot;
	dPrdSp = 0;

	do{
		dZenSp =  0;	dHanSp =  0;
		ptSpace = DocPaddingSpace( dTgtDot );

		//	Check if DocPaddingSpace was able to generate a string
		if( ptSpace === null || (ptSpace[1] < ptSpace[2]) )	//	(dZenSp + 1)
		{
		  dPrdSp++;	dTgtDot -= 3; // A period is 3 pixels
		}
		else	//	If the string was generated properly, stop.
		{
			break;
		}

	}while( dTgtDot >= 19 );	//	Anything less than 19 is impossible? The OrinrinEditor comment says something along those lines...

	if( /*ptSpace === null && bFull */ dPre <= 33) // If it's too small, take from fixed table. Original decided to do this or not based on a boolean
	{
		dPrdSp = 0;
		dTgtDot = dPre;
    
    //ptSpace = [gaatPaddingSpDot[dTgtDot], 0, 0];
    
    return gaatPaddingSpDot[dTgtDot];
	}

	if( ptSpace != null )
	{
    ptPlus = ptSpace[0];

		//	Add the periods
		for( m = 0; dPrdSp > m; m++ ){ ptPlus += "."; }
	}

  // Original used pointers to indicate how much of each char was used but I don't use that anywhere.
	//if( pdZen  )	*pdZen = dZenSp;
	//if( pdHan  )	*pdHan = dHanSp;
	//if( pdPrd  )	*pdPrd = dPrdSp;

	return ptPlus;
}


// Almost identical to OrinrinEditor's DocPaddingSpaceMake
// Originally started off at its own thing early in the project before it slowly converged on imitating OrinrinEditor.
// Generates a string of spaces of a given pixel width.
// If useUnicodeSp == true, will exactly match the target pixels,
// otherwise will match as close as possible.
function generateSpacing(px) {
  let str = "", arr;
  let dZenSp, dHanSp;
  
  if (px <= 0) return "";
  
  if (useUnicodeSp) {
    
    arr = DocPaddingSpace(px);
    
    if (arr == null || (arr[1] < arr[2])) {
      str = DocPaddingSpaceUni(px);
    }
    else {
      str = arr[0];
    }
    
    /* DEBUG */// if(measureLine(str) != px) {
    /* DEBUG *///  console.log("Spaces generated incorrectly!");
    /* DEBUG *///  console.log(px + '"' + str + '"');
    /* DEBUG */// }
  }
  else {
    // Generates a string that uses only S_JIS spaces
    // May be not exact
    arr = DocPaddingSpaceWithGap(px);
    str = arr[0];
  }
  
  return str;
}

// OrinrinEditor's DocPaddingSpaceWithPeriod will generate unicode spaces if unicode is on, and period padding otherwise.
// My version of it only generates with period padding, and this is the function that can either generate with unicode
// or with periods.
function generateSpacingWithPeriods(px) {
  if (useUnicodeSp) {
    return generateSpacing(px);
  } else {
    return DocPaddingSpaceWithPeriod(px);
  }
}


// Pastes one line atop another.
// Yes, I am aware that this is unreadably hideous and that there's three different search algorithms inside it.
// No, I currently have no plans of cleaning it up.
// It behaves perfectly and I fear ruining it.
// (I'll clean it up eventually.)
// This was actually the first thing I wrote, without referencing OrinrinEditor's source too.
// Changing this to use generateSpacingWithPeriods instead of generateSpacing was a last minute change, hopefully I broke nothing.
function compositeAALine(str, paste, offset) {
  var prepaste = "", postpaste = "";
  var curwidth = 0;
  var nopostpasteneeded = false;
  var firstindexoveroffset = 0, firstindexoverpaste = 0;
  var low = 0, high = 0, mid = 0;
  var tmp = "";
  var additionaloffset = 0;
  let newstr = "";

  paste = paste.replace(spaceatend, "");
  additionaloffset = measureLine(paste.match(spaceatstart) != null ? paste.match(spaceatstart)[0] : "");
  paste = paste.replace(spaceatstart, "");
  var pastewidth = measureLine(paste);

  offset = offset + additionaloffset;
  
  // Returning early if pastewidth is 0 stops the first char from getting cut off.
  // When searching for the index of postpaste, the index is always that of the first char just past the pasted region.
  // This cuts off the first char when pasting an empty string.
  // Also prevents unneeded spaces from being added when paste is an empty line.
  if (pastewidth == 0) return str;

  if (offset >= measureLine(str)) {
    str = str + generateSpacingWithPeriods(offset - measureLine(str) + 1);
    nopostpasteneeded = true;
  } else if (offset < 0) {
    tmp = "";

    for (let i = 0; i <= [...paste].length; i++) {
      curwidth = measureLine([...paste].slice(0, i).join(""));

      if (curwidth >= -offset) {
        tmp = [...paste].slice(i).join("");
        break;
      }
    }

    offset = pastewidth - Math.abs(offset) - measureLine(tmp);
    paste = tmp;
    pastewidth = measureLine(paste);
    
    if (offset < 0) offset = 0;

    // I think masking out that first bit for when paste gets cut off for negative positioning makes more sense,
    // but OrinrinEditor doesn't do that, and I'm sticking to that here.
    /* prepaste = generateSpacing(offset);
    noFirstBit = false;*/
  }
  
  // Attempt returning early again after changes to paste are made and a new pastewidth exists.
  if (pastewidth == 0) return str;

  low = 0;
  high = [...str].length;
  while (low != high) {
    mid = Math.floor((low + high) / 2);
    curwidth = measureLine([...str].slice(0, mid).join(""));
    if (curwidth <= offset) {
        low = mid + 1;
    }
    else {
        high = mid;
    }
  }
  firstindexoveroffset = low;
  
  tmp = [...str].slice(0, firstindexoveroffset - 1).join("");
  //console.log("tmp " + tmp);
  prepaste =
    tmp.replace(spaceatend, "")
    + generateSpacingWithPeriods(
        measureLine(tmp.match(spaceatend) != null ? tmp.match(spaceatend)[0] : "")
        + (offset - measureLine(tmp))
    );

  if(nopostpasteneeded) return (newstr = prepaste + paste);
  
  low = 0;
  high = [...str].length;
  while (low != high) {
    mid = Math.floor((low + high) / 2);
    curwidth = measureLine([...str].slice(0, mid).join(""));
    if (curwidth < (offset + pastewidth)) {
        low = mid + 1;
    }
    else {
        high = mid;
    }
  }
  firstindexoverpaste = low;
  
  tmp = [...str].slice(firstindexoverpaste).join("");
  postpaste =
    generateSpacingWithPeriods(
      measureLine(tmp.match(spaceatstart) != null ? tmp.match(spaceatstart)[0] : "")
      + (
        measureLine([...str].slice(0, firstindexoverpaste).join(""))
        - (offset + pastewidth)
        )
     )
     + tmp.replace(spaceatstart, "");

  return (newstr = prepaste + paste + postpaste);
}

function extractNonSpaces(str) {
  const regex = /[^\u200A\u2009\u2006\u2005\u2004\u0020\u2002\u2007\u3000\u2003]+/gu;
  const results = [];

  for (const match of str.matchAll(regex)) {
    results.push({
      content: match[0],
      startindex: match.index
    });
  }

  return results;
}

function compositeAALineTransparent(str, paste, offset) {
  let newstr = str;
  const parts = extractNonSpaces(paste);

  const partswithoffsets = parts.map(part => {
    return {
      content: part.content,
      offset: measureLine([...paste].slice(0, part.startindex).join(""))
    };
  });

  partswithoffsets.forEach(part => {
    newstr = compositeAALine(newstr, part.content, offset + part.offset);
  });
  
  return newstr;
}

/**
 * Inserts a string at a pixel offset in another string, adding padding when the offset is not exact.
 * @param {string} str - The string that is being inserted into.
 * @param {string} paste - The string being inserted.
 * @param {number} offset - The target pixel offset.
 * @returns {{index: number, insert: string}} Object containing index where paste should be inserted and a padded paste string.
 */
function insertAtOffset(str, paste, offset) {
  const insertionpoint = indexClosestToPxOffset(str, offset, -1);
  const strbelowindex = str.slice(0, insertionpoint);
  
  let additionaloffset = 0;
  if (paste.match(spaceatstart) != null) {
    additionaloffset = measureLine(paste.match(spaceatstart)[0]);
    paste = paste.replace(spaceatstart, "");
  }

  const padding = generateSpacingWithPeriods(offset + additionaloffset - measureLine(strbelowindex));
  
  return {
    index: insertionpoint,
    insert: padding + paste
  }
}
