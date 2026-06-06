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

// A lot of what is in here was mindlessly copied from OrinrinEditor's framedrawing functions.
// I have a poor understanding of how framedrawing works and my translation of the code into JS is probably far from ideal.
// If you want to understand this and work on it, read OrinrinEditor's FrameCtrl.cpp first.
// Actually, if you want to work on anything AA editor related in general, read OrinrinEditor's source.

const frameoutlines = [
  {
    Name: "Normal Border",
    Daybreak: "│",
    Morning: "┌",
    Noon: "─",
    Afternoon: "┐",
    Nightfall: "│",
    Twilight: "┘",
    Midnight: "─",
    Dawn: "└",
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false
  },
  {
    Name: 'Speech Bubble １',
    Daybreak: '|　',
    Morning: 'f´',
    Noon: '￣',
    Afternoon: '｀ヽ',
    Nightfall: '|',
    Twilight: 'ノ',
    Midnight: '＿',
    Dawn: '乂',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 7,
    RestPadding: false,
  },
  {
    Name: 'Speech Bubble ２',
    Daybreak: '|　',
    Morning: 'f´',
    Noon: '￣',
    Afternoon: '｀ヽ',
    Nightfall: '　',
    Twilight: '乂_',
    Midnight: '＿',
    Dawn: 'ヽ',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Bold Border Brackets',
    Daybreak: '┃',
    Morning: '┏',
    Noon: '　',
    Afternoon: '┓',
    Nightfall: '┃',
    Twilight: '┛',
    Midnight: '　',
    Dawn: '┗',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: true,
  },
  {
    Name: 'Bold Border',
    Daybreak: '┃',
    Morning: '┏',
    Noon: '━',
    Afternoon: '┓',
    Nightfall: '┃',
    Twilight: '┛',
    Midnight: '━',
    Dawn: '┗',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Screaming Border',
    Daybreak: '）',
    Morning: '､__',
    Noon: '人_',
    Afternoon: '人',
    Nightfall: '（',
    Twilight: 'Ｙ',
    Midnight: 'Y⌒',
    Dawn: '⌒',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 7,
    RestPadding: true,
  },
  {
    Name: 'Fluffy Border',
    Daybreak: '三',
    Morning: 'ミ',
    Noon: '川',
    Afternoon: '彡',
    Nightfall: '三',
    Twilight: 'ミ',
    Midnight: '川',
    Dawn: '彡',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: true,
  },
  {
    Name: 'Border of Feelings',
    Daybreak: '. : :',
    Morning: '　. :',
    Noon: ':.',
    Afternoon: ': .　',
    Nightfall: ': : .',
    Twilight: ': :　',
    Midnight: ':.',
    Dawn: '　: :',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: true,
  },
  {
    Name: 'Normal With Thick Corners',
    Daybreak: '│',
    Morning: '┏',
    Noon: '─',
    Afternoon: '┓',
    Nightfall: '│',
    Twilight: '┛',
    Midnight: '─',
    Dawn: '┗',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Frame Corners Only',
    Daybreak: '　',
    Morning: '┌',
    Noon: '　',
    Afternoon: '┐',
    Nightfall: '　',
    Twilight: '┘',
    Midnight: '　',
    Dawn: '└',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: true, // Changed from OrinrinEditor
  },
  {
    Name: 'Speech Bubble １ Bottom Right',
    Daybreak: '　　　　　　　　 　 　 |　',
    Morning: '　　　　　　　　　　　 ／\n　 　 　 　 　　　　／\n　　　　　　　　 　 ￣|',
    Noon: '￣\n\n',
    Afternoon: '＼\n　 |\n　 |',
    Nightfall: '　 |',
    Twilight: '／',
    Midnight: '＿',
    Dawn: '　　　　　　　　　　　 ＼',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Speech Bubble １ Top Right',
    Daybreak: '　 　 　 　　　　　　　|　',
    Morning: '　　　　　　　　　　　 ／',
    Noon: '￣',
    Afternoon: '＼',
    Nightfall: '　 |',
    Twilight: '　 |\n　 |\n／',
    Midnight: '\n\n＿',
    Dawn: '　　　　　　　　 　 ＿|　\n　 　 　 　 　　　　＼\n　　　　　　　　　　　 ＼\n\n',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Speech Bubble １ Bottom Left',
    Daybreak: '　　　　　　　　 　 　 |',
    Morning: '　　　　　　　　 　 　 ／\n　　　　　　　　 　 　 |\n　　　　　　　　 　 　 |',
    Noon: '￣\n\n',
    Afternoon: '￣＼\n　 　 ＼\n　　 |￣',
    Nightfall: '|',
    Twilight: '　　 |\n＿／',
    Midnight: '\n＿',
    Dawn: '　　　　　　　　 　 　 |\n　　　　　　　　　　　 ＼',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 27,
    RestPadding: false,
  },
  {
    Name: 'Speech Bubble １ Top Left',
    Daybreak: '|　',
    Morning: '／\n|　',
    Noon: '￣\n',
    Afternoon: '￣＼\n　　 |',
    Nightfall: '|',
    Twilight: '　　 |＿\n　 　 ／\n＿／',
    Midnight: '\n\n＿',
    Dawn: '|　\n|　\n＼',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 27,
    RestPadding: false,
  },
  {
    Name: 'Square ■ Cornered Frame',
    Daybreak: '│',
    Morning: '■',
    Noon: '─',
    Afternoon: '■',
    Nightfall: '│',
    Twilight: '■',
    Midnight: '─',
    Dawn: '■',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Decorative Frame １',
    Daybreak: '┃｜',
    Morning: '┏┓\n┗╋\n┏╋',
    Noon: '\n━\n─',
    Afternoon: '┏┓\n╋┛\n╋┓',
    Nightfall: '｜┃',
    Twilight: '╋┛\n╋┓\n┗┛',
    Midnight: '─\n━',
    Dawn: '┗╋\n┏╋\n┗┛',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Decorative Frame No Sides',
    Daybreak: '　　　',
    Morning: '┏┓\n┗╋',
    Noon: '━',
    Afternoon: '┏┓\n╋┛',
    Nightfall: '　',
    Twilight: '╋┓\n┗┛',
    Midnight: '━',
    Dawn: '┏╋\n┗┛',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Bold Border No Sides',
    Daybreak: '　',
    Morning: '┏',
    Noon: '━',
    Afternoon: '┓',
    Nightfall: '　',
    Twilight: '┛',
    Midnight: '━',
    Dawn: '┗',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Dashed Line Border',
    Daybreak: '┃\n│',
    Morning: '┏\n│',
    Noon: '─━\n',
    Afternoon: '┐\n┃',
    Nightfall: '│\n┃',
    Twilight: '│\n┛',
    Midnight: '\n━─',
    Dawn: '┃\n└',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
  {
    Name: 'Cloud Thought Bubble',
    Daybreak: '（\n　）',
    Morning: '　ｒ\'⌒\'～\'⌒\'～\'\n　）',
    Noon: '⌒\'～\'\n',
    Afternoon: '⌒\'～\'⌒\'ヽ\n　　　　　（',
    Nightfall: '　　　　）\n　　　（',
    Twilight: '　　　　）\n⌒\'～\'´',
    Midnight: '\n⌒\'～\'',
    Dawn: '（\n　丶～\'⌒\'〇\'⌒\'～\n　　　　　　 Ｏ\n　　　　　　 o\n　　　　　　ﾟ',
    LEFTOFFSET: 0,
    RIGHTOFFSET: 0,
    RestPadding: false,
  },
];


/**
 * Performs integer division. Returns 0 if dividing by 0.
 * OrinrinEditor Original: Divinus
 * @param {number} dividend - iLeft
 * @param {number} divisor - iRight
 * @returns {number} 
 */
function safeDivision(dividend, divisor) {
  if (divisor === 0) return 0;
  return Math.floor(dividend / divisor);
}


/**
 * Extracts a specific line from a multiline string and pads it to the required width.
 * OrinrinEditor Original: FrameMultiSubstring
 * @param {string} sourceText - ptSrc
 * @param {number} targetLineIndex - dLine
 * @param {number} requiredDots - iUseDot
 * @returns {string} - The extracted/padded string
 */
function extractAndPadLine(sourceText, targetLineIndex, requiredDots) {
  const lines = sourceText.split(/\r\n|\r|\n/);
  let extractedLine = "";

  if (targetLineIndex < lines.length) {
    extractedLine = lines[targetLineIndex];
  }

  const stringDotWidth = measureLine(extractedLine); // iStrDot
  const paddingDotsNeeded = requiredDots - stringDotWidth; // iPaDot

  if (paddingDotsNeeded >= 1) {
    const paddingStr = generateSpacingWithPeriods(paddingDotsNeeded);
    extractedLine += paddingStr;
  }

  return extractedLine;
}


/**
 * Extracts a line from a frame part and increments its line tracker. Generates padding if disabled.
 * OrinrinEditor Original: FrameMakeMultiSubLine
 * @param {boolean} isEnabled - bEnable
 * @param {object} partState - pstItem
 * @returns {string} - The processed sub-line string
 */
function buildFramePartSubLine(isEnabled, partState) {
  if (isEnabled) {
    const resultStr = extractAndPadLine(partState.text, partState.currentLineIndex, partState.dotWidth);
    partState.currentLineIndex++;
    return resultStr;
  }
  else {
    return generateSpacingWithPeriods(partState.dotWidth);
  }
}


/**
 * Takes a string, adds front padding if specified, and either pad or truncates 
 * the end so the total proportional width matches the target pixel width.
 * OrinrinEditor original has same name.
 * @param {number} frontOffset - iFwOffs, Front padding width. 0 to ignore.
 * @param {string} text - ptStr, The input string to adjust.
 * @param {number} targetMaxWidth - iMaxDot, Target overall pixel width. 0 to ignore.
 * @returns {string} - The adjusted string
 */
function StringWidthAdjust(frontOffset, text, targetMaxWidth) {
  let workString = "";

  // Add front padding if requested
  if (frontOffset >= 1) {
    const padStr = generateSpacingWithPeriods(frontOffset);
    if (padStr) {
      workString += padStr;
    }
  }

  workString += text;

  // Adjust to exact target width if one is specified
  if (targetMaxWidth !== 0) {
    const currentDotWidth = measureLine(workString);

    if (currentDotWidth !== targetMaxWidth) {
      if (currentDotWidth < targetMaxWidth) {
        // The string is too short, pad the end
        const padNeeded = targetMaxWidth - currentDotWidth;
        const padEndStr = generateSpacingWithPeriods(padNeeded);
        
        if (padEndStr) {
          workString += padEndStr;
        }
      } else {
        // The string is too long, truncate it character by character.
        let dotCount = 0;
        let truncatedString = "";
        
        // Using a 'for...of' loop for Unicode surrogate pairs
        for (const char of workString) {
          const charWidth = measureLine(char); // iBuf
          
          // If adding this character exceeds the limit, stop and fill the gap.
          if (targetMaxWidth < (dotCount + charWidth)) {
            const remainder = targetMaxWidth - dotCount;
            
            if (remainder > 0) {
              const remainderPad = generateSpacingWithPeriods(remainder);
              if (remainderPad) {
                truncatedString += remainderPad;
              }
            }
            break; // Stop parsing characters
          }
          
          truncatedString += char;
          dotCount += charWidth;
        }
        
        workString = truncatedString;
      }
    }
  }

  return workString;
}


/**
 * Builds a multiline frame based on external boundary dimensions.
 * OrinrinEditor Original: FrameMakeOutsideBoundary
 * @param {number} frameWidth - iWidth, Width in pixels.
 * @param {number} frameHeight - iHeight, Height in pixels.
 * @param {object} frameData - JS frame data object from frameoutlines
 * @returns {string} - A text art frame of required size
 */
function buildFrameFromOutsideBoundary(frameWidth, frameHeight, frameData) {
  const lineHeight = 18;

  // Translate frame data object into the stateful structs expected by the algorithm.
  const buildPartState = (textStr) => {
    const lines = textStr.split(/\r\n|\r|\n/);
    return {
      text: textStr,                 // atParts
      totalLines: lines.length,      // iLine
      currentLineIndex: 0,           // iNowLn
      dotWidth: Math.max(...lines.map(l => measureLine(l))) // dDot
    };
  };

  const frameState = {
    daybreak: buildPartState(frameData.Daybreak),
    morning: buildPartState(frameData.Morning),
    noon: buildPartState(frameData.Noon),
    afternoon: buildPartState(frameData.Afternoon),
    nightfall: buildPartState(frameData.Nightfall),
    twilight: buildPartState(frameData.Twilight),
    midnight: buildPartState(frameData.Midnight),
    dawn: buildPartState(frameData.Dawn),
    leftOffset: frameData.LEFTOFFSET,
    rightOffset: frameData.RIGHTOFFSET,
    restPadding: frameData.RestPadding
  };

  let totalLinesCount = Math.floor(frameHeight / lineHeight); // iLines

  // Imitate FrameMultiSizeGet
  const upLinesCount = Math.max(frameState.morning.totalLines, frameState.noon.totalLines, frameState.afternoon.totalLines); // iUpLine
  const dnLinesCount = Math.max(frameState.dawn.totalLines, frameState.midnight.totalLines, frameState.twilight.totalLines); // iDnLine
  
  let midLinesCount = totalLinesCount - (upLinesCount + dnLinesCount); // iMdLine

  if (midLinesCount < 0) {
    totalLinesCount -= midLinesCount; // Deal with negative middle space
    midLinesCount = 0;
  }

  const linesArray = Array.from({ length: totalLinesCount }, () => ""); // vcString

  // Right part max width
  let rightOccupation = frameState.afternoon.dotWidth; // iRitOccup
  if (rightOccupation < frameState.twilight.dotWidth) {
    rightOccupation = frameState.twilight.dotWidth;
  }
  
  let rightBuffer = frameState.rightOffset + frameState.nightfall.dotWidth; // iRitBuf
  if (rightOccupation < rightBuffer) {
    rightOccupation = rightBuffer;
  }

  const rightOffsetPosition = frameWidth - rightOccupation; // iRitOff

  // Roof calculations
  let roofDots = rightOffsetPosition - frameState.morning.dotWidth; // iRoofDot
  if (frameState.leftOffset >= 1) roofDots -= frameState.leftOffset;
  const roofCount = safeDivision(roofDots, frameState.noon.dotWidth); // iRoofCnt
  const roofRestDots = roofDots - (roofCount * frameState.noon.dotWidth); // iRfRstDot

  // Floor calculations
  let floorDots = rightOffsetPosition - frameState.dawn.dotWidth; // iFloorDot
  if (frameState.leftOffset >= 1) floorDots -= frameState.leftOffset;
  const floorCount = safeDivision(floorDots, frameState.midnight.dotWidth); // iFloorCnt
  const floorRestDots = floorDots - (floorCount * frameState.midnight.dotWidth); // iFlRstDot

  // Right pillar padding calculation
  let rightPillarPosition = 0; // iRight
  if (frameState.restPadding) {
    rightPillarPosition = rightOffsetPosition + frameState.rightOffset;
    if (frameState.leftOffset <= -1) rightPillarPosition += frameState.leftOffset;
  } else {
    rightPillarPosition = (roofCount * frameState.noon.dotWidth) + frameState.morning.dotWidth + frameState.rightOffset;
    let tempFloorPos = (floorCount * frameState.midnight.dotWidth) + frameState.dawn.dotWidth + frameState.rightOffset;
    if (rightPillarPosition < tempFloorPos) rightPillarPosition = tempFloorPos;
    rightPillarPosition += frameState.leftOffset;
  }

  let lineOffset = 0; // iOfsLine

  // Draw roof
  for (let targetLine = 0; targetLine < upLinesCount; targetLine++, lineOffset++) {
    let isEnabled, subStr;

    // Top-Left
    isEnabled = (upLinesCount - targetLine) - frameState.morning.totalLines <= 0;
    subStr = buildFramePartSubLine(isEnabled, frameState.morning);
    if (frameState.leftOffset >= 1) {
      subStr = StringWidthAdjust(frameState.leftOffset, subStr, 0); 
    }
    linesArray[lineOffset] += subStr;

    // Top
    isEnabled = (upLinesCount - targetLine) - frameState.noon.totalLines <= 0;
    subStr = buildFramePartSubLine(isEnabled, frameState.noon);
    for (let i = 0; i < roofCount; i++) linesArray[lineOffset] += subStr;
    if (roofRestDots >= 1 && frameState.restPadding) {
      subStr = StringWidthAdjust(0, subStr, roofRestDots);
      linesArray[lineOffset] += subStr;
    }

    // Top-Right
    isEnabled = (upLinesCount - targetLine) - frameState.afternoon.totalLines <= 0;
    subStr = buildFramePartSubLine(isEnabled, frameState.afternoon);
    linesArray[lineOffset] += subStr;
  }

  // Draw pillars
  for (let targetLine = 0; targetLine < midLinesCount; targetLine++, lineOffset++) {
    // Left Pillar (Pads to the right pillar position)
    let leftSubStr = extractAndPadLine(frameState.daybreak.text, frameState.daybreak.currentLineIndex, rightPillarPosition);
    if (frameState.leftOffset <= -1) {
      leftSubStr = StringWidthAdjust(-(frameState.leftOffset), leftSubStr, 0);
    }
    frameState.daybreak.currentLineIndex++;
    if (frameState.daybreak.totalLines <= frameState.daybreak.currentLineIndex) frameState.daybreak.currentLineIndex = 0;
    linesArray[lineOffset] += leftSubStr;

    // Right Pillar
    let rightSubStr = extractAndPadLine(frameState.nightfall.text, frameState.nightfall.currentLineIndex, 0);
    frameState.nightfall.currentLineIndex++;
    if (frameState.nightfall.totalLines <= frameState.nightfall.currentLineIndex) frameState.nightfall.currentLineIndex = 0;
    linesArray[lineOffset] += rightSubStr;
  }

  // Draw floor
  for (let targetLine = 0; targetLine < dnLinesCount; targetLine++, lineOffset++) {
    let isEnabled, subStr;

    // Bottom-Left
    isEnabled = targetLine < frameState.dawn.totalLines;
    subStr = buildFramePartSubLine(isEnabled, frameState.dawn);
    if (frameState.leftOffset >= 1) {
      subStr = StringWidthAdjust(frameState.leftOffset, subStr, 0);
    }
    linesArray[lineOffset] += subStr;

    // Bottom
    isEnabled = targetLine < frameState.midnight.totalLines;
    subStr = buildFramePartSubLine(isEnabled, frameState.midnight);
    for (let i = 0; i < floorCount; i++) linesArray[lineOffset] += subStr;
    if (floorRestDots >= 1 && frameState.restPadding) {
      subStr = StringWidthAdjust(0, subStr, floorRestDots);
      linesArray[lineOffset] += subStr;
    }

    // Bottom-Right
    if (targetLine < frameState.twilight.totalLines) {
      subStr = extractAndPadLine(frameState.twilight.text, frameState.twilight.currentLineIndex, 0);
      frameState.twilight.currentLineIndex++;
      linesArray[lineOffset] += subStr;
    }
  }

  return linesArray.join("\n");
}


/**
 * Wraps an input string of AA with a frame.
 * @param {string} inputText - The text to be framed.
 * @param {object} frameData - Frame data JS object.
 * @returns {string} - The framed AA.
 */
function generateFrameAroundLines(inputText, frameData) {
  const inputLines = inputText.split(/\r\n|\r|\n/);
  const linesArray = [];

  // Translate frame data object into the stateful structs expected by the algorithm.
  const buildPartState = (textStr) => {
    if (textStr === undefined || textStr === null) textStr = "";
    const lines = textStr.split(/\r\n|\r|\n/);
    return {
      text: textStr,
      totalLines: lines.length,
      currentLineIndex: 0,
      dotWidth: Math.max(...lines.map(l => measureLine(l)))
    };
  };

  const frameState = {
    daybreak: buildPartState(frameData.Daybreak),
    morning: buildPartState(frameData.Morning),
    noon: buildPartState(frameData.Noon),
    afternoon: buildPartState(frameData.Afternoon),
    nightfall: buildPartState(frameData.Nightfall),
    twilight: buildPartState(frameData.Twilight),
    midnight: buildPartState(frameData.Midnight),
    dawn: buildPartState(frameData.Dawn),
    leftOffset: frameData.LEFTOFFSET,
    rightOffset: frameData.RIGHTOFFSET,
    restPadding: frameData.RestPadding
  };

  // Find the max pixel width of the inner text block
  let maxInnerWidth = Math.max(...inputLines.map(l => measureLine(l)));
  if (!useUnicodeSp) maxInnerWidth += 11; // Add extra width in hopes that the required paddings are always possible. 11 px seems fine but maybe a different value is optimal. Or some totally different approach.

  let rightPillarPosition = frameState.daybreak.dotWidth + maxInnerWidth; // Initial right pillar offset before adjusting

  // Negative offsets expand the baseline canvas width if drawing inward.
  if (frameState.leftOffset <= -1) rightPillarPosition += Math.abs(frameState.leftOffset);
  if (frameState.rightOffset <= -1) rightPillarPosition += Math.abs(frameState.rightOffset);

  const leftPaddingSpace = frameState.leftOffset >= 1 ? frameState.leftOffset : 0;

  // Initial available space and piece counts for the roof.
  let roofDots = rightPillarPosition - (leftPaddingSpace + frameState.morning.dotWidth);
  let roofCount = safeDivision(roofDots, frameState.noon.dotWidth);
  let roofRestDots = roofDots % frameState.noon.dotWidth;

  // Initial available space and piece counts for the floor.
  let floorDots = rightPillarPosition - (leftPaddingSpace + frameState.dawn.dotWidth);
  let floorCount = safeDivision(floorDots, frameState.midnight.dotWidth);
  let floorRestDots = floorDots % frameState.midnight.dotWidth;

  // Handle alignment when dynamic padding is disabled.
  if (frameState.restPadding === false) {
    let roofOverflow = 0;
    let floorOverflow = 0;

    // Force an extra piece and capture overflow only if a remainder exists.
    if (roofRestDots > 0) {
      roofCount++;
      roofOverflow = frameState.noon.dotWidth - roofRestDots;
    }
    if (floorRestDots > 0) {
      floorCount++;
      floorOverflow = frameState.midnight.dotWidth - floorRestDots;
    }

    // Increase the right pillar position by the maximum overshoot.
    rightPillarPosition += Math.max(roofOverflow, floorOverflow);
  }

  // Apply positive right offset
  if (frameState.rightOffset >= 1) rightPillarPosition += frameState.rightOffset;

  // Draw roof
  const upLinesCount = Math.max(frameState.morning.totalLines, frameState.noon.totalLines, frameState.afternoon.totalLines);

  for (let targetLine = 0; targetLine < upLinesCount; targetLine++) {
    let lineStr = "";
    let isEnabled, subStr;

    // Top-Left
    isEnabled = (upLinesCount - targetLine) - frameState.morning.totalLines <= 0;
    subStr = buildFramePartSubLine(isEnabled, frameState.morning);
    if (frameState.leftOffset >= 1) {
      subStr = StringWidthAdjust(frameState.leftOffset, subStr, 0); 
    }
    lineStr += subStr;

    // Top
    isEnabled = (upLinesCount - targetLine) - frameState.noon.totalLines <= 0;
    subStr = buildFramePartSubLine(isEnabled, frameState.noon);
    for (let i = 0; i < roofCount; i++) lineStr += subStr;
    
    // Rest padding remainder
    if (roofRestDots >= 1 && frameState.restPadding === true) {
      subStr = StringWidthAdjust(0, subStr, roofRestDots);
      lineStr += subStr;
    }

    // Top-Right
    isEnabled = (upLinesCount - targetLine) - frameState.afternoon.totalLines <= 0;
    subStr = buildFramePartSubLine(isEnabled, frameState.afternoon);
    lineStr += subStr;

    linesArray.push(lineStr);
  }

  // Draw pillars filled with inner text
  for (let i = 0; i < inputLines.length; i++) {
    let currentLine = "";

    // Left Pillar
    let leftSubStr = extractAndPadLine(frameState.daybreak.text, frameState.daybreak.currentLineIndex, 0);
    frameState.daybreak.currentLineIndex++;
    if (frameState.daybreak.totalLines <= frameState.daybreak.currentLineIndex) {
      frameState.daybreak.currentLineIndex = 0;
    }

    if (frameState.leftOffset <= -1) {
      leftSubStr = StringWidthAdjust(-(frameState.leftOffset), leftSubStr, 0);
    }

    //currentLine += leftSubStr + inputLines[i];
    currentLine += leftSubStr + generateSpacingWithPeriods(frameState.daybreak.dotWidth - measureLine(leftSubStr)) + inputLines[i];

    // Inner padding fills the gap to rightPillarPosition
    const currentDotWidth = measureLine(currentLine);
    const paddingNeeded = rightPillarPosition - currentDotWidth;

    if (paddingNeeded > 0) {
      const padStr = generateSpacingWithPeriods(paddingNeeded, null, null, null, true);
      if (padStr) currentLine += padStr;
    }

    // Right Pillar
    let rightSubStr = extractAndPadLine(frameState.nightfall.text, frameState.nightfall.currentLineIndex, 0);
    frameState.nightfall.currentLineIndex++;
    if (frameState.nightfall.totalLines <= frameState.nightfall.currentLineIndex) {
      frameState.nightfall.currentLineIndex = 0;
    }

    currentLine += rightSubStr;
    linesArray.push(currentLine);
  }

  // Draw Floor
  const dnLinesCount = Math.max(frameState.dawn.totalLines, frameState.midnight.totalLines, frameState.twilight.totalLines);

  for (let targetLine = 0; targetLine < dnLinesCount; targetLine++) {
    let lineStr = "";
    let isEnabled, subStr;

    // Bottom-Left Corner
    isEnabled = targetLine < frameState.dawn.totalLines;
    subStr = buildFramePartSubLine(isEnabled, frameState.dawn);
    if (frameState.leftOffset >= 1) {
      subStr = StringWidthAdjust(frameState.leftOffset, subStr, 0);
    }
    lineStr += subStr;

    // Bottom
    isEnabled = targetLine < frameState.midnight.totalLines;
    subStr = buildFramePartSubLine(isEnabled, frameState.midnight);
    for (let i = 0; i < floorCount; i++) lineStr += subStr;
    
    // Rest padding remainder
    if (floorRestDots >= 1 && frameState.restPadding === true) {
      subStr = StringWidthAdjust(0, subStr, floorRestDots);
      lineStr += subStr;
    }

    // Bottom-Right Corner
    if (targetLine < frameState.twilight.totalLines) {
      subStr = extractAndPadLine(frameState.twilight.text, frameState.twilight.currentLineIndex, 0);
      frameState.twilight.currentLineIndex++;
      lineStr += subStr;
    }

    linesArray.push(lineStr);
  }

  return linesArray.join("\n");
}


/**
 * Generates a text art frame around either the entire document or only each contiguous selected set of lines.
 * @param {EditorView} view - The active CodeMirror EditorView instance.
 * @param {object} framestyle - JS object containing frame data.
 * @returns {boolean} Returns true to show Codemirror that the operation was a success. Stops selection oddities.
 */
function frameAllOrSelected(view, framestyle) {
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

      let framed = generateFrameAroundLines(state.doc.sliceString(startline.from, endline.to), framestyle);
      
      changes.push({
        from: startline.from,
        to: endline.to,
        insert: framed
      });
    });

    const changeDesc = view.state.changes(changes);

    view.dispatch({
      changes: changes,
      selection: EditorSelection.cursor(state.doc.line(startAndEndLines[startAndEndLines.length - 1].start).from).map(changeDesc)
    });
  }
  else {
    let framed = generateFrameAroundLines(state.doc.toString(), framestyle) + '\n';
    const change = {from: 0,
                to: state.doc.line(state.doc.lines).to,
                insert: framed
               };
    const changeDesc = view.state.changes(change);

    view.dispatch({
      changes: change,
      selection: EditorSelection.cursor(state.doc.line(state.doc.lines).to).map(changeDesc)
    });
  }
  
  return true;
}


