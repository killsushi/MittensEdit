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

const menutype = {
    Button: Symbol("Button"),
    Custom: Symbol("Custom"),
};
Object.freeze(menutype);

const generalgroup = [
  {
    type: menutype.Button,
    title: "Undo (Ctrl-Z)",
    icon: "res/icons/Undo.png",
    action() {undo(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Redo (Ctrl-Y or Ctrl-Shift-Z)",
    icon: "res/icons/Redo.png",
    action() {redo(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Select All (Ctrl-A)",
    icon: "res/icons/AllSelect.png",
    action() {aaeditor.dispatch({selection: EditorSelection.single(0, aaeditor.state.doc.length)})},
  },
];

const extractgroup = [
  {
    type: menutype.Button,
    title: "Extraction Copy (Ctrl-Alt-C)",
    icon: "res/icons/Copy.png",
    action() {extractionCopy(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Extraction Cut (Ctrl-Alt-X)",
    icon: "res/icons/Extract.png",
    action() {extractionCut(aaeditor)},
  },
];

const spacebuttongroup = [
  {
    type: menutype.Custom,
    title: "Space Insert Menu",
    action() {return createSpaceInsertMenu()},
  },
  {
    type: menutype.Button,
    title: "Regenerate All Spacing",
    icon: "res/icons/UniSpaceRegen.png",
    action() {normalizeSpacing(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Initial HWS to Unicode",
    icon: "res/icons/initHWStoUni.png",
    action() {initialHWStoUnicode(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "All Spaces to Pure SJIS with Period Padding",
    icon: "res/icons/UniSpacePeriod.png",
    action() {spacingToSJISWithPeriod(aaeditor)},
  },
];

const framedrawinggroup = [ 
  {
    type: menutype.Button,
    title: "Create Framebox",
    icon: "res/icons/Frame.png",
    action() {createFrameBox(aaeditor)},
  },
  {
    type: menutype.Custom,
    title: "Frame-All Menu",
    action() {return createFrameMenu()},
  },
];

let clipboardReadInProgress = false;

const insertlayerboxgroup = [
  {
    type: menutype.Button,
    title: "Create Layerbox",
    icon: "res/icons/LayerBox.png",
    async action(event) {
      if (clipboardReadInProgress) { return; }
      clipboardReadInProgress = true;
      
      let clipboardtext = '　　　　　　　　　　\n　　　　　　　　　　\n　　　　　　　　　　\n　　　　　　　　　　';
      
      try {
        clipboardtext = await navigator.clipboard.readText();
      } catch (err) {
        //console.log("Couldn't read clipboard.");
      } finally {
        const { state } = aaeditor;
        const line = state.doc.lineAt(state.selection.main.head);
        const txtbeforecursor = state.doc.sliceString(line.from, state.selection.main.head);
        const offset = measureLine(txtbeforecursor);
        createLayerBox(aaeditor, clipboardtext, offset, line.number * 18 - 18);
        setTimeout(() => {
          clipboardReadInProgress = false;
        }, 1500);
      }
    },
  },
];

const formatgroup = [
  {
    type: menutype.Button,
    title: "Add Guideline Right (Ctrl-Alt-R)",
    icon: "res/icons/addRightGuideline.png",
    action() {addBarToEnd(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Add FWS (11px) at Start (Ctrl-I)",
    icon: "res/icons/HeadSpaceAdd.png",
    action() {prependInitialSpaces(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Remove FWS (11px) at Start (Ctrl-U)",
    icon: "res/icons/HeadSpaceDel.png",
    action() {removeInitialSpaces(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Remove Trailing Whitespace (Ctrl-G)",
    icon: "res/icons/delTrailingSpace.png",
    action() {removeTrailingWhitespace(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Remove Last Non-Whitespace Char (Shift-Ctrl-G)",
    icon: "res/icons/delFinalChar.png",
    action() {removeFinalChar(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Mirror Horizontally by Line",
    icon: "res/icons/arrow_leftright.png",
    action() {mirrorHorizontallyByLine(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Mirror Horizontally by Selection",
    icon: "res/icons/arrow_leftright.png",
    action() {mirrorHorizontallyBySelection(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Mirror Vertically",
    icon: "res/icons/arrow_updown.png",
    action() {mirrorVertically(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Move to Right Margin",
    icon: "res/icons/shiftToRightMargin.png",
    action() {alignToRight(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Add 1px SP at Caret (Ctrl-RightArrow)",
    icon: "res/icons/plusOneCursor.png",
    action() {adjustSpace(aaeditor, true); return true;},
  },
  {
    type: menutype.Button,
    title: "Remove 1px SP at Caret (Ctrl-LeftArrow)",
    icon: "res/icons/minusOneCursor.png",
    action() {adjustSpace(aaeditor, false); return true;},
  },
  {
    type: menutype.Button,
    title: "Add 1px SP at Start (Shift-Ctrl-RightArrow)",
    icon: "res/icons/plusOneStart.png",
    action() {incrementByOnePx(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Remove 1px SP at Start (Shift-Ctrl-LeftArrow)",
    icon: "res/icons/minusOneStart.png",
    action() {decrementByOnePx(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Narrow All 1px from Caret to Left",
    icon: "res/icons/DotSplitLeft.png",
    action() {nudgeLeftFromCaret(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "Expand All 1px from Caret to Right",
    icon: "res/icons/DotSplitRight.png",
    action() {nudgeRightFromCaret(aaeditor)},
  },
];

const autoadjustgroup = [
  {
    type: menutype.Button,
    title: "[Auto Adjust] Set Reference Line Length (Ctrl-Shift-E)",
    icon: "res/icons/DotSplitRight.png",
    action() {setAutoAdjustWidth(aaeditor)},
  },
  {
    type: menutype.Button,
    title: "[Auto Adjust] Attempt Misalignment Adjustment (Ctrl-E)",
    icon: "res/icons/DotSplitRight.png",
    action() {executeAutoAdjust(aaeditor)},
  },
];

const infogroup = [
  {
    type: menutype.Button,
    title: "Preview AA (Ctrl-B)",
    icon: "res/icons/Preview.png",
    action() {showPreview()},
  },
  // Cut feature, I'll return to this later.
  //{
  //  type: menutype.Button,
  //  title: "Add Guideline at Cursor (Experimental, WIP)",
  //  icon: "res/icons/addRightGuideline.png",
  //  action() {addVisualGuideline(aaeditor)},
  //},
  {
    type: menutype.Button,
    title: "Instructions",
    icon: "res/icons/Instructions.png",
    action() {window.open('Instructions.html', '_blank', 'noopener,noreferrer')},
  },
  {
    type: menutype.Button,
    title: "Editor Info",
    icon: "res/icons/Mittens.png",
    action() {showInfo()},
  },
];

const unicodetogglegroup = [
  {
    type: menutype.Custom,
    title: "Use Unicode Spaces (Alt-U)",
    action() {return createUnicodeToggle()},
  },
];

const menubuttons = [
  generalgroup,
  spacebuttongroup,
  framedrawinggroup,
  extractgroup,
  insertlayerboxgroup,
  formatgroup,
  autoadjustgroup,
  infogroup,
  unicodetogglegroup
];

function showPreview() {
  const preview = document.getElementById('previewContainer');

  if (!preview.classList.contains('show')) {
    const plugin = aaeditor.plugin(layerBoxPlugin);
    const layerboxcontainer = plugin.dom;
    const layerboxorigin = layerboxcontainer.querySelector('.cm-layerbox-origin');
    
    let previewState = aaeditor.state;
    
    // If there's a paste preview currently active, add that in
    if (currentPastePreview != null) {
      let transaction = previewState.update({changes: currentPastePreview, annotations: allowChangesDuringReadOnly.of(true)});
      previewState = transaction.state;
    }
    
    // Go through all layerboxes and paste them down using a preview state.
    for (const layerbox of layerboxorigin.childNodes) {
      if (layerbox.getElementsByTagName("textarea").length === 0) {
        const content = layerbox.getElementsByClassName("frame-wrapper")[0].textContent;
        const tr = blockPaste(previewState,
                            content,
                            Math.round((layerbox.offsetTop / 18)) + 1,
                            Math.round(layerbox.offsetLeft),
                            true
                           );
        let transaction = previewState.update({changes: tr, annotations: allowChangesDuringReadOnly.of(true)});
        previewState = transaction.state;
      } else {
        const content = layerbox.getElementsByTagName("textarea")[0].value;
        const tr = blockPaste(previewState,
                            content,
                            Math.round((layerbox.offsetTop / 18)) + 1,
                            Math.round(layerbox.offsetLeft),
                            enabletransparentpasting
                           );
        let transaction = previewState.update({changes: tr, annotations: allowChangesDuringReadOnly.of(true)});
        previewState = transaction.state;
      }
    }
    
    const aadoc = previewState.doc.toString();
    const aadiv = document.createElement('div');
    aadiv.classList.add('aa');
    aadiv.textContent = aadoc;
    aadiv.innerHTML = aadiv.innerHTML.replace(/\n/gu, '<br>');
    preview.replaceChildren(aadiv);
    
    document.addEventListener('keydown', selectPreview);
  } else {
    document.removeEventListener('keydown', selectPreview);
  }
  
  preview.classList.toggle('show');
}

function selectPreview(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    event.preventDefault();

    const targetDiv = document.getElementById('previewContainer');
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(targetDiv);

    selection.removeAllRanges();
    selection.addRange(range);
  }
}

document.addEventListener('keydown', function(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
    event.preventDefault(); 
    showPreview();
  }
});

function showInfo() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('show');
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      hideInfo();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      hideInfo();
    }
  });
  const closebutton = document.getElementsByClassName('overlay-close')[0];
  closebutton.addEventListener("click", hideInfo);
}

function hideInfo() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('show');
}

function createSpaceInsertMenu() {
  let spacemenu = document.createElement("select")
  
  spacemenu.id = 'spaceMenu';
  spacemenu.classList.add("menubarbutton");
  spacemenu.title = 'Insert Unicode Space';

  const spaceoptions = [
    {text: '1px (HAIR SPACE) [ U+200A ]', value: '\u200A'},
    {text: '2px (THIN SPACE) [ U+2009 ]', value: '\u2009'},
    {text: '3px (SIX-PER-EM SPACE) [ U+2006 ]', value: '\u2006'},
    {text: '4px (FOUR-PER-EM SPACE) [ U+2005 ]', value: '\u2005'},
    {text: '5px (THREE-PER-EM SPACE) [ U+2004 ]', value: '\u2004'},
    {text: '8px (EN SPACE) [ U+2002 ]', value: '\u2002'},
    {text: '10px (FIGURE SPACE) [ U+2007 ]', value: '\u2007'},
    {text: '16px (EM SPACE) [ U+2003 ]', value: '\u2003'}
  ]
  
  spaceoptions.forEach(spacetype => {
    const option = document.createElement("option");
    option.value = spacetype.value;
    option.text = spacetype.text;
    spacemenu.appendChild(option);
  });
  
  const defaultoption = document.createElement("option");
  defaultoption.value = 'displaynothing';
  defaultoption.selected = true;
  defaultoption.disabled = true;
  defaultoption.hidden = true;
  spacemenu.prepend(defaultoption);
  
  spacemenu.autocomplete = "off";
  spacemenu.value = 'displaynothing';
  
  spacemenu.addEventListener('change', (event) => {
    insertFromMenu(aaeditor, event.target.value);
    spacemenu.value = 'displaynothing';
    aaeditor.focus();
  });

  return spacemenu;
}

function createFrameMenu() {
  let framemenu = document.createElement("select")
  
  framemenu.id = 'frameMenu';
  framemenu.classList.add("menubarbutton");
  framemenu.title = 'Draw Frame Around AA';
  
  for (let i = 0; i < frameoutlines.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = frameoutlines[i].Name;
    framemenu.appendChild(option);
  }
  
  const defaultoption = document.createElement("option");
  defaultoption.value = 'displaynothing';
  defaultoption.selected = true;
  defaultoption.disabled = true;
  defaultoption.hidden = true;
  framemenu.prepend(defaultoption);
  
  framemenu.autocomplete = "off";
  framemenu.value = 'displaynothing';
  
  framemenu.addEventListener('change', (event) => {
    //console.log(frameoutlines[event.target.value]);
    frameAllOrSelected(aaeditor, frameoutlines[event.target.value]);
    framemenu.value = 'displaynothing';
    aaeditor.focus();
  });
  
  return framemenu;
}


function setUnicodeMode(bool) {
  useUnicodeSp = bool;
  unicodemodestatus = document.getElementById('unicodeModeStatus');
  if (bool) unicodemodestatus.innerText = 'On';
  else      unicodemodestatus.innerText = 'Off';
}

function toggleUnicodeMode() {
  unicodetoggle = document.getElementById('unicodeToggle');
  unicodetoggle.checked = !useUnicodeSp;
  setUnicodeMode(!useUnicodeSp);
  
  return true;
}

document.addEventListener('keydown', function(event) {
  if (event.altKey && event.key.toLowerCase() === 'u') {
    event.preventDefault(); 
    toggleUnicodeMode();
  }
});

function createUnicodeToggle() {
  let menuobject = document.createElement("div")
  menuobject.classList.add("unicodetogglecontainer");
  menuobject.title = "Use Unicode Spaces (Alt-U)";
  
  const checkbox = document.createElement('input');

  checkbox.type = 'checkbox';
  checkbox.id = 'unicodeToggle';
  checkbox.checked = true;
  
  const label = document.createElement('label');
  label.htmlFor = 'unicodeToggle';
  const icon = document.createElement("img");
  icon.src = "res/icons/Unicode_Use.png";
  icon.draggable = false;
  label.appendChild(icon);
  
  checkbox.addEventListener('change', (event) => {
    setUnicodeMode(event.target.checked);
    aaeditor.focus();
  });

  menuobject.appendChild(checkbox);
  menuobject.appendChild(label);
  
  return menuobject;
}

const menubar = document.getElementById('menuBar');

menubuttons.forEach((buttongroup) => {
  let menugroup = document.createElement("div");
  menugroup.classList.add("menugroup");
  
  buttongroup.forEach((menuitem) => {
    if (menuitem.type === menutype.Button) {
      let button = document.createElement("button");
      button.classList.add("menubarbutton");
      button.title = menuitem.title;
      button.addEventListener('click', menuitem.action);
      button.addEventListener('click', () => {aaeditor.focus()}); // Focus editor after function
      
      const icon = document.createElement("img");
      icon.src = menuitem.icon;
      icon.draggable = false;
      button.appendChild(icon);
      
      menugroup.appendChild(button);
    }
    else {
      menugroup.appendChild(menuitem.action());
    }
  });
  menubar.appendChild(menugroup);
});

const templatebehaviorselector = document.getElementById('templateBehaviorSelector');
templatebehaviorselector.addEventListener('change', (event) => {
  if (event.target.value == "insertLayerbox") templatesetting = templatebehavior.InsertLayerbox;
  else if (event.target.value == "insertDirectly") templatesetting = templatebehavior.InsertDirectly;
  else if (event.target.value == "insertRectangle") templatesetting = templatebehavior.InsertRectangle;
  else if (event.target.value == "copy") templatesetting = templatebehavior.Copy;
});

let currentbrush = {
  brushtext: ".",
  brushfunction: replaceSelectionSpacesWithBrush,
};

function decideBrushMode() {
  document.body.classList.add('brush-enabled'); // Set theme to show brush is active
  if (currentbrush.brushfunction === applyFreeDrawingMode) {applyFreeDrawingMode(aaeditor, currentbrush.brushtext);}
  else {brushActive(aaeditor, currentbrush.brushfunction, currentbrush.brushtext);}
}

const brushfield = document.getElementById('brushField');
currentbrush.brushtext = brushfield.value;
brushfield.addEventListener('input', (event) => {
  currentbrush.brushtext = event.target.value;
  //brushActive(aaeditor, currentbrush.brushfunction, currentbrush.brushtext);
  decideBrushMode();
});

const brushfunctionselector = document.getElementById('brushFunctionSelector');
if (brushfunctionselector.value == "overwriteSpaces") currentbrush.brushfunction = replaceSelectionSpacesWithBrush;
else if (brushfunctionselector.value == "overwriteAll") currentbrush.brushfunction = replaceSelectionWithBrush;
else if (brushfunctionselector.value == "eraser") currentbrush.brushfunction = replaceSelectionWithSpaces;
else if (brushfunctionselector.value == "freeDraw") currentbrush.brushfunction = applyFreeDrawingMode;
brushfunctionselector.addEventListener('change', (event) => {
  if (event.target.value == "overwriteSpaces") setbrushfunction(replaceSelectionSpacesWithBrush);
  else if (event.target.value == "overwriteAll") setbrushfunction(replaceSelectionWithBrush);
  else if (event.target.value == "eraser") setbrushfunction(replaceSelectionWithSpaces);
  else if (event.target.value == "freeDraw") setbrushfunction(applyFreeDrawingMode);
});

function setbrushtext(brush) {
  currentbrush.brushtext = brush;
  brushfield.value = brush;
  //brushActive(aaeditor, currentbrush.brushfunction, currentbrush.brushtext);
  decideBrushMode();
}

function setbrushfunction(brushfunction){
  currentbrush.brushfunction = brushfunction;
  //brushActive(aaeditor, currentbrush.brushfunction, currentbrush.brushtext);
  decideBrushMode();
}

const sidebartabs = document.querySelectorAll('input[name="editTabs"]');
sidebartabs.forEach(radio => {
  radio.addEventListener('change', (event) => {
    if (event.target.checked) {
      if(event.target.value == "brushes") {
        document.body.classList.add('brush-enabled');
        //brushActive(aaeditor, currentbrush.brushfunction, currentbrush.brushtext);
        decideBrushMode()
      }
      else {
        document.body.classList.remove('brush-enabled');
        brushInactive(aaeditor);
      }
    }
  });
});


const rightmarginfield = document.getElementById('setRightMargin');
rightmarginfield.addEventListener('input', (event) => {
  rightguidelineoffset = event.target.value;
  
  const rightmarginstatus = document.getElementById('rightMarginStatus');
  rightmarginstatus.innerText = rightguidelineoffset + '[dot]';
});

const dellayerboxonpastetoggle = document.getElementById('delLayerboxOnPasteToggle');
deletelayerboxafterpaste = dellayerboxonpastetoggle.checked;
dellayerboxonpastetoggle.addEventListener('change', (event) => {
  deletelayerboxafterpaste = event.target.checked;
  aaeditor.focus();
});

const hightransparencylayertoggle = document.getElementById('highTransparencyLayerToggle');
if (hightransparencylayertoggle.checked) document.getElementById('inputContainer').classList.add("high-transparency-mode");
hightransparencylayertoggle.addEventListener('change', (event) => {
  const inputcontainer = document.getElementById('inputContainer');
  if (event.target.checked) inputcontainer.classList.add("high-transparency-mode");
  else                      inputcontainer.classList.remove("high-transparency-mode");
  aaeditor.focus();
});

const transparentpastetoggle = document.getElementById('transparentPasteToggle');
enabletransparentpasting = transparentpastetoggle.checked;
transparentpastetoggle.addEventListener('change', (event) => {
  enabletransparentpasting = event.target.checked;
  aaeditor.focus();
});

// Stops Alt-Scroll from annoyingly refreshing the page while I'm trying to rectangle select
window.addEventListener('wheel', function(event) {
  if (event.altKey) {
    event.preventDefault(); 
  }
}, { passive: false });

window.addEventListener('beforeunload', (event) => {
  event.preventDefault();
  event.returnValue = true;
});


initLayerListDraggable(aaeditor);


// In the future, these default lists should be replaced with actual default lists instead of placeholders.
const defaultaalist = [
  {
    title: "string1",
    contents: ["foo1", "foo2", "foo3"]
  },
  {
    title: "string2",
    contents: ["bar1", "bar2", "bar3"]
  }
];

const defaultaabrush = [
  {
    title: "string1",
    contents: ["foo1", "foo2", "foo3"]
  },
  {
    title: "string2",
    contents: ["bar1", "bar2", "bar3"]
  }
]

const defaulttemplates = [
  {
    title: "string1",
    contents: ["foo1\nbar1", "foo2\nbar1", "foo3\nbar1"]
  },
  {
    title: "string2",
    contents: ["bar1\nbar1", "bar2\nbar1", "bar3\nbar1"]
  }
];

async function parseMLTFile(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.status}`);
  }

  const text = await response.text();

  const lines = text.replace(/\r\n/g, "\n").split("[SPLIT]").map(str => str.replace(/^[\r\n]+|[\r\n]+$/g, ''));
  
  return lines;
}

async function parseMLTListFile(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.status}`);
  }

  const text = await response.text();

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  
  return lines;
}

async function parseSingleLineFile(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.status}`);
  }

  const text = await response.text();

  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const result = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Ignore empty lines
    if (line === "") continue;

    // Match section headers like:
    // [ListName=string1]
    const headerMatch = line.match(/^\[ListName=(.*?)\]$/u);

    if (headerMatch) {
      // If a previous section exists, save it
      if (current) {
        result.push(current);
      }

      // Start a new section
      current = {
        title: headerMatch[1],
        contents: []
      };
      continue;
    }

    // Match section terminator
    if (line === "[end]") {
      if (current) {
        result.push(current);
        current = null;
      }
      continue;
    }

    // Otherwise this is a content line
    if (current) {
      current.contents.push(line);
    }
  }

  // Handle malformed files missing a final [end]
  if (current) {
    result.push(current);
  }

  return result;
}


function buildMenu(aalist, menupages, menupicker, buttonaction) {
  aalist.forEach((list) => {
    let charpage = document.createElement("div");
    let charmenuoption = document.createElement("button");
    charmenuoption.classList.add("pagepicker");
    charmenuoptionlabel = document.createElement("span");
    charmenuoptionlabel.textContent = list.title;
    charmenuoption.title = list.title;
    charmenuoption.appendChild(charmenuoptionlabel);
    
    list.contents.forEach((i) => {
      let insertionbutton = document.createElement("button");
      insertionbutton.classList.add("insertionbutton");
      insertionbutton.tabIndex = 0;
      insertionbutton.innerHTML = '<div class="tooltip"></div><div></div>';
      insertionbutton.querySelectorAll('div').forEach(div => {div.textContent = i});
      insertionbutton.addEventListener('click', () => {buttonaction(i)});
      insertionbutton.addEventListener('click', () => {aaeditor.focus()}); // Focus editor after function
      charpage.appendChild(insertionbutton);
    });
    
    charmenuoption.addEventListener('click', (event) => {
      const pages = menupages.querySelectorAll(':scope > div');
      pages.forEach((div) => {
        div.style.display = 'none';
      });
      
      const pageselectors = menupicker.querySelectorAll(':scope > button');
      pageselectors.forEach((sel) => {
        sel.classList.remove("activepage");
      });
      
      charpage.style.display = 'grid';
      event.currentTarget.className += " activepage";
    });
    charmenuoption.addEventListener('click', () => {aaeditor.focus()}); // Focus editor after function
    
    menupages.appendChild(charpage);
    menupicker.appendChild(charmenuoption);
  });
  
  const pageselectors = menupicker.querySelectorAll(':scope > button');
  pageselectors[0].className += " activepage";
  const pages = menupages.querySelectorAll(':scope > div');
  pages.forEach((div) => {
    div.style.display = 'none';
  });
  pages[0].style.display = 'grid';
}


const charmenupages = document.getElementById('charMenuPages');
const charmenupicker = document.getElementById('charPagePicker');
const brushmenupages = document.getElementById('brushMenuPages');
const brushmenupicker = document.getElementById('brushPagePicker');
const templatemenupages = document.getElementById('templateMenuPages');
const templatemenupicker = document.getElementById('templatePagePicker');


const aalistUrl = new URL('templates/aalist.txt', window.location.href);
const aabrushUrl = new URL('templates/aabrush.txt', window.location.href);
const mltlistUrl = new URL('templates/mltlist.txt', window.location.href);

// Set up single-line insertion menu
parseSingleLineFile(aalistUrl)
  .then(aalist => {
    buildMenu(aalist, charmenupages, charmenupicker, (i) => insertFromMenu(aaeditor, i));
  })
  .catch(err => {
    console.error(err);
    buildMenu(defaultaalist, charmenupages, charmenupicker, (i) => insertFromMenu(aaeditor, i));
  });

// Set up brush menu
parseSingleLineFile(aabrushUrl)
  .then(aalist => {
    buildMenu(aalist, brushmenupages, brushmenupicker, setbrushtext);
  })
  .catch(err => {
    console.error(err);
    buildMenu(defaultaabrush, brushmenupages, brushmenupicker, setbrushtext);
  });

// Setting up multi-line templates menu
async function buildMLTMenu() {
  try {
    const mltlist = await parseMLTListFile(mltlistUrl);
    const templatelist = await Promise.all(mltlist.map(async (mlt) => {
      const mltUrl = new URL('templates/mlt/' + mlt, window.location.href);
      
      try {
        const t = await parseMLTFile(mltUrl);
        return {
          title: mlt.replace(/\.mlt$/, ""),
          contents: t
        };
      } catch (err) {
        console.error(err);
        return {
          title: mlt.replace(/\.mlt$/, ""),
          contents: ["Could not read MLT file."]
        };
      }
    }));

    buildMenu(templatelist, templatemenupages, templatemenupicker, (i) => insertTemplate(aaeditor, i));
  } catch (err) {
    console.error(err);
    buildMenu(defaulttemplates, templatemenupages, templatemenupicker, (i) => insertTemplate(aaeditor, i));
  }
}
buildMLTMenu();

