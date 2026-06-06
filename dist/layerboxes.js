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


function createIdGenerator() {
  let nextId = 1;
  const freedIds = new Set();

  function* generatorFunc() {
    while (true) {
      // If the number of freed IDs equals the total number of issued
      // IDs (nextId - 1), that means every ID has been returned.
      if (nextId > 1 && freedIds.size === nextId - 1) {
        nextId = 1;
        freedIds.clear();
      }

      if (freedIds.size > 0) {
        const minId = Math.min(...freedIds);
        freedIds.delete(minId);
        yield minId;
      } else {
        yield nextId++;
      }
    }
  }

  const gen = generatorFunc();

  gen.free = function(id) {
    // Only allow free IDs that have actually been issued
    if (typeof id === 'number' && id >= 1 && id < nextId) {
    freedIds.add(id);
    }
  };

  return gen;
}

const getLayerId = createIdGenerator();

function frameBoxController(view, layerboxorigin, framebox) {
  let framecontent = "";
  
  let framecontainer = framebox.getElementsByClassName("cm-framebox-frame")[0];
  framecontainer.style.minWidth = 26 + "px";
  framecontainer.style.minHeight = 38 + "px";
  framecontainer.style.width = 470 + "px";
  framecontainer.style.height = 135 + "px";
  
  let framewrapper = framebox.getElementsByClassName("frame-wrapper")[0];
  framecontent = buildFrameFromOutsideBoundary(470, 135, frameoutlines[0]);
  framewrapper.textContent = framecontent;
  framewrapper.innerHTML = framewrapper.innerHTML.replace(notspacesornewlines, match => '<span>' + match + '</span>');
  
  let paddingcheckbox = framebox.querySelector('input[type="checkbox"]');
  paddingcheckbox.addEventListener('change', (event) => {
    createFrameContents();
  });
  
  let frameselect = framebox.getElementsByTagName('select')[0];
  for (let i = 0; i < frameoutlines.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = frameoutlines[i].Name;
    frameselect.appendChild(option);
  }
  frameselect.addEventListener('change', (event) => {
    paddingcheckbox.checked = frameoutlines[event.target.value].RestPadding;
    createFrameContents();
  });
  
  let resizeleft = framebox.getElementsByClassName("cm-framebox-resize-left")[0];
  resizeleft.addEventListener("mousedown", (event) => {startResize(event, "left")});
  let resizeright = framebox.getElementsByClassName("cm-framebox-resize-right")[0];
  resizeright.addEventListener("mousedown", (event) => {startResize(event, "right")});
  let resizetop = framebox.getElementsByClassName("cm-framebox-resize-top")[0];
  resizetop.addEventListener("mousedown", (event) => {startResize(event, "top")});
  let resizebottom = framebox.getElementsByClassName("cm-framebox-resize-bottom")[0];
  resizebottom.addEventListener("mousedown", (event) => {startResize(event, "bottom")});
  let resizetopleft = framebox.getElementsByClassName("cm-framebox-resize-topleft")[0];
  resizetopleft.addEventListener("mousedown", (event) => {startResize(event, "topleft")});
  let resizetopright = framebox.getElementsByClassName("cm-framebox-resize-topright")[0];
  resizetopright.addEventListener("mousedown", (event) => {startResize(event, "topright")});
  let resizebottomleft = framebox.getElementsByClassName("cm-framebox-resize-bottomleft")[0];
  resizebottomleft.addEventListener("mousedown", (event) => {startResize(event, "bottomleft")});
  let resizebottomright = framebox.getElementsByClassName("cm-framebox-resize-bottomright")[0];
  resizebottomright.addEventListener("mousedown", (event) => {startResize(event, "bottomright")});
  
  let pastebutton = framebox.getElementsByClassName("paste-button")[0];
  pastebutton.onclick = paste;

  let xbutton = framebox.getElementsByClassName("x-button")[0];
  xbutton.onclick = destroyLayerBox;
  
  //let menu = framebox.getElementsByClassName("framebox-menu")[0];
  //menu.addEventListener("mousedown", dragLayerbox);
  let frameboxdraggable = framebox.getElementsByClassName("cm-framebox-draggable")[0];
  frameboxdraggable.addEventListener("mousedown", dragLayerbox);
  
  framebox.onfocus = enableKeyboardControls;
  framebox.onblur = disableKeyboardControls;
  
  const layerId = getLayerId.next().value;
  let listentry = createLayerListEntry(framebox, layerId);

  function createFrameContents() {
    let framechoice = { ...frameoutlines[frameselect.value] };
    framechoice.RestPadding = paddingcheckbox.checked;
    
    framecontent = buildFrameFromOutsideBoundary(framecontainer.clientWidth, framecontainer.clientHeight, framechoice);
    framewrapper.textContent = framecontent;
    framewrapper.innerHTML = framewrapper.innerHTML.replace(notspacesornewlines, match => '<span>' + match + '</span>');
  }
  
  let movedtofront = false;
  let ticking = false; // For throttling mousemove events
  function dragLayerbox(e) {
    let dX = 0,
    dY = 0,
    preX = 0,
    preY = 0,
    posY = 0,
    posX = 0,
    currentX = 0,
    currentY = 0;
    
    e = e || window.event;
    e.preventDefault();
    //event.stopPropagation();
    
    framebox.focus();
    
    preX = e.clientX;
    preY = e.clientY;
    
    posY = framebox.offsetTop;
    posX = framebox.offsetLeft; 

    document.addEventListener("mouseup", stopDragging);
    document.addEventListener("dragend", stopDragging);
    document.addEventListener("mousemove", onMouseMove);
    
    function onMouseMove(e) {
      e.preventDefault();
      
      currentX = e.clientX;
      currentY = e.clientY;
      
      if (!ticking) {
        window.requestAnimationFrame(updatePosition);
        ticking = true;
      }
    }
    
    function updatePosition() {
      let dX = currentX - preX;
      let dY = currentY - preY;
      
      preX = currentX;
      preY = currentY;
      
      posY = posY + dY;
      posX = posX + dX; 
      
      let linenum = Math.round(posY / 18) * 18 - 18;
      framebox.style.top = linenum + "px";
      framebox.style.left = posX + "px";
      
      // Move last clicked layerbox to front.
      if (!movedtofront) {
        layerboxorigin.appendChild(framebox);
        const layerlist = document.getElementById('layerList');
        layerlist.appendChild(listentry);
        movedtofront = true;
      }
      
      ticking = false;
    }
   
    function stopDragging(e) {
      e.preventDefault();
      framebox.focus();
      document.removeEventListener("mouseup", stopDragging);
      document.removeEventListener("dragend", stopDragging);
      document.removeEventListener("mousemove", onMouseMove);
      movedtofront = false;
      ticking = false;
    }
  }

  function startResize(event, direction) {
    event.stopPropagation();
    event.preventDefault();
    
    document.addEventListener("mouseup", stopResizing);
    document.addEventListener("dragend", stopResizing);
    document.addEventListener("mousemove", resizeFrame);
        
    let startX = event.clientX;
    let startY = event.clientY;
    let startWidth = framecontainer.clientWidth;
    let startHeight = framecontainer.clientHeight;
    let startLeft = framebox.offsetLeft;
    let startTop = framebox.offsetTop;
    
    let minWidthValue = parseInt(framecontainer.style.minWidth, 10) || 0;
    let minHeightValue = parseInt(framecontainer.style.minWidth, 10) || 0;
    
    const snapYStep = 18;

    function resizeFrame(event) {
      const dX = event.clientX - startX;
      const dY = event.clientY - startY;
      
      const snappedDY = Math.round(dY / snapYStep) * snapYStep;
    
      if (direction == "right") {
        framecontainer.style.width = Math.max(startWidth + dX, minWidthValue) + "px";
      }
      if (direction == "bottom") {
        framecontainer.style.height = Math.max(startHeight + dY, minHeightValue) + "px";
      }
      if (direction == "bottomright") {
        framecontainer.style.width = Math.max(startWidth + dX, minWidthValue) + "px";
        framecontainer.style.height = startHeight + dY + "px";
      }
      if (direction == "left") {        
        let newWidth = Math.max(startWidth - dX, minWidthValue);
        let actualDx = startWidth - newWidth; 
        framecontainer.style.width = newWidth + "px";
        framebox.style.left = startLeft + actualDx + "px";
      }
      if (direction == "bottomleft") {
        let newWidth = Math.max(startWidth - dX, minWidthValue);
        let actualDx = startWidth - newWidth;
        framecontainer.style.height = startHeight + dY + "px";
        framecontainer.style.width = newWidth + "px";
        framebox.style.left = startLeft + actualDx + "px";
      }
      if (direction == "topright") {
        let newHeight = Math.max(startHeight - snappedDY, minHeightValue);
        let actualDy = startHeight - newHeight;
        framecontainer.style.width = Math.max(startWidth + dX, minWidthValue) + "px";
        framecontainer.style.height = newHeight + "px";
        framebox.style.top = startTop + actualDy + "px";
      }
      if (direction == "top") {
        let newHeight = Math.max(startHeight - snappedDY, minHeightValue);
        let actualDy = startHeight - newHeight;
        framecontainer.style.height = newHeight + "px";
        framebox.style.top = startTop + actualDy + "px";
      }
      if (direction == "topleft") {
        let newWidth = Math.max(startWidth - dX, minWidthValue);
        let actualDx = startWidth - newWidth;
        let newHeight = Math.max(startHeight - snappedDY, minHeightValue);
        let actualDy = startHeight - newHeight;

        framecontainer.style.width = newWidth + "px";
        framebox.style.left = startLeft + actualDx + "px";

        framecontainer.style.height = newHeight + "px";
        framebox.style.top = startTop + actualDy + "px";
      }
      
      createFrameContents();
    }
  
    function stopResizing(event) {
      event.preventDefault();
      framebox.focus();
      document.removeEventListener("mouseup", stopResizing);
      document.removeEventListener("mousemove", resizeFrame);
    }
  }
  
  function paste() {
    if (view.state.readOnly) return true;
    
    const tr = blockPaste(view.state,
                          framecontent,
                          Math.round((framebox.offsetTop / 18)) + 1,
                          Math.round(framebox.offsetLeft),
                          true
                         );
    view.dispatch({
      changes: tr,
      selection: EditorSelection.cursor(view.posAtCoords({ x: framebox.getBoundingClientRect().left, y: framebox.getBoundingClientRect().top + 18 }, false))
      });
    if (deletelayerboxafterpaste) destroyLayerBox();

    return true;
  }

  function destroyLayerBox() {
    framebox.remove();
    listentry.remove();
    getLayerId.free(layerId);
  }
  
  function shiftLayerbox(event) {
    event.stopPropagation();
    event.preventDefault();
    if (event.shiftKey) {
      if (event.key === 'ArrowLeft') {
        //framebox.style.left = framebox.offsetLeft - 1 + "px";
        framecontainer.style.width = parseInt(framecontainer.style.width, 10) - 1 + "px";
      }
      if (event.key === 'ArrowRight') {
        framecontainer.style.width = parseInt(framecontainer.style.width, 10)  + 1 + "px";
      }
      if (event.key === 'ArrowUp') {
        framecontainer.style.height = parseInt(framecontainer.style.height, 10)  - 1 + "px";
      }
      if (event.key === 'ArrowDown') {
        framecontainer.style.height = parseInt(framecontainer.style.height, 10)  + 1 + "px";
      }
      
      createFrameContents();
    }
    else {
      if (event.key === 'ArrowLeft') {
        framebox.style.left = framebox.offsetLeft - 1 + "px";
      }
      if (event.key === 'ArrowRight') {
        framebox.style.left = framebox.offsetLeft + 1 + "px";
      }
      if (event.key === 'ArrowUp') {
        framebox.style.top = framebox.offsetTop - 18 + "px";
      }
      if (event.key === 'ArrowDown') {
        framebox.style.top = framebox.offsetTop + 18 + "px";
      }
      if (event.key === 'Enter' || event.keyCode === 13) {
        paste();
      }
      if (event.key === 'Escape') {
        destroyLayerBox();
      }
    }
  }
  
  function enableKeyboardControls() {
    framebox.addEventListener('keydown', shiftLayerbox);
  }
  
  function disableKeyboardControls() {
    framebox.removeEventListener('keydown', shiftLayerbox);
  }
}

function createFrameBox(view) {
  const plugin = view.plugin(layerBoxPlugin);
  const layerboxcontainer = plugin.dom;
  const layerboxorigin = layerboxcontainer.querySelector('.cm-layerbox-origin');
  
  let framebox = document.createElement("div");
  framebox.classList.add("cm-framebox");
  framebox.tabIndex = 0;
  framebox.innerHTML =
    '<div class="cm-framebox-frame"><div class="cm-framebox-draggable"><div class="frame-wrapper"></div><div class="cm-framebox-resize-right"></div><div class="cm-framebox-resize-bottom"></div><div class="cm-framebox-resize-left"></div><div class="cm-framebox-resize-top"></div><div class="cm-framebox-resize-bottomright"></div><div class="cm-framebox-resize-bottomleft"></div><div class="cm-framebox-resize-topleft"></div><div class="cm-framebox-resize-topright"></div></div><div class="framebox-menu" title="Arrow keys to move when focused, Shift + Arrow keys to resize"><select></select><input title="Use Smooth Padding?" type="checkbox"><button class="paste-button" title="Paste">P</button><button class="x-button" title="Close Layerbox (ESC)">X</button></div></div>';
  framebox.style.top = "50px";
  framebox.style.left = "50px";
  frameBoxController(view, layerboxorigin, framebox);
  layerboxorigin.appendChild(framebox);
}

let deletelayerboxafterpaste = true;
let enabletransparentpasting = false;

function layerBoxController(view, layerboxorigin, layerbox, text) {
  let movedtofront = false;
  let ticking = false; // For throttling mousemove events
  
  let dX = 0,
  dY = 0,
  preX = 0,
  preY = 0,
  posY = 0,
  posX = 0,
  currentX = 0,
  currentY = 0;

  let content = layerbox.getElementsByTagName("textarea")[0];
  content.value = text;
  content.disabled = true;
  content.style.resize = "none";
  content.addEventListener('keydown', adjustSpaceLayerboxInputHandler);
  content.style.height = ([...content.value].join("").match(/\n/g) || '').length*18 + 18 + 2 + "px";
  content.style.width = longestLineInString(content.value) + 5 + "px";
  
  let pastebutton = layerbox.getElementsByClassName("paste-button")[0];
  pastebutton.onclick = paste;

  let adjustablepastebutton = layerbox.getElementsByClassName("adjustablepaste-button")[0];
  adjustablepastebutton.onclick = adjustablePaste;

  let editbutton = layerbox.getElementsByClassName("edit-button")[0];
  editbutton.onclick = enableEditing;

  let xbutton = layerbox.getElementsByClassName("x-button")[0];
  xbutton.onclick = destroyLayerBox;
  
  let menu = layerbox.getElementsByClassName("layerbox-menu")[0];
  menu.addEventListener("mousedown", dragLayerbox);
  layerbox.addEventListener("mousedown", dragLayerbox);
  
  layerbox.onfocus = enableKeyboardControls;
  layerbox.onblur = disableKeyboardControls;
  
  const layerId = getLayerId.next().value;
  let listentry = createLayerListEntry(layerbox, layerId);

  function dragLayerbox(e) {
    e = e || window.event;
    e.preventDefault();
    //event.stopPropagation();
    
    layerbox.focus();
    
    preX = e.clientX;
    preY = e.clientY;
    
    posY = layerbox.offsetTop;
    posX = layerbox.offsetLeft; 
    
    document.addEventListener("mouseup", stopDragging);
    document.addEventListener("dragend", stopDragging);
    document.addEventListener("mousemove", onMouseMove);
  }
  
  function onMouseMove(e) {
    e.preventDefault();
    
    currentX = e.clientX;
    currentY = e.clientY;
    
    if (!ticking) {
      window.requestAnimationFrame(updatePosition);
      ticking = true;
    }
  }

  function updatePosition() {
    let dX = currentX - preX;
    let dY = currentY - preY;
    
    preX = currentX;
    preY = currentY;
    
    posY = posY + dY;
    posX = posX + dX; 
    
    let linenum = Math.round(posY / 18) * 18 - 18;
    layerbox.style.top = linenum + "px";
    layerbox.style.left = posX + "px";

    // Move last clicked layerbox to front.
    if (!movedtofront) {
      layerboxorigin.appendChild(layerbox);
      const layerlist = document.getElementById('layerList');
      layerlist.appendChild(listentry);
      movedtofront = true;
    }
    
    ticking = false;
  }

  function stopDragging(e) {
    e.preventDefault();
    layerbox.focus();
    document.removeEventListener("mouseup", stopDragging);
    //document.removeEventListener("dragend", stopDragging);
    document.removeEventListener("mousemove", onMouseMove);
    movedtofront = false;
    ticking = false;
  }

  function paste() {
    if (view.state.readOnly) return true;
    
    const tr = blockPaste(view.state,
                          content.value,
                          Math.round((layerbox.offsetTop / 18)) + 1,
                          Math.round(layerbox.offsetLeft),
                          enabletransparentpasting
                         );
    view.dispatch({
      changes: tr,
      selection: EditorSelection.cursor(view.posAtCoords({ x: layerbox.getBoundingClientRect().left, y: layerbox.getBoundingClientRect().top + 18 }, false)) // This could be more accurate, fix it later
    });
    if (deletelayerboxafterpaste) destroyLayerBox();

    return true;
  }

  function adjustablePaste() {
    if (view.state.readOnly) return true;
    
    enterPastePreview(
      view,
      content.value,
      Math.round((layerbox.offsetTop / 18)) + 1,
      Math.round(layerbox.offsetLeft)
    );
    if (deletelayerboxafterpaste) destroyLayerBox();

    return true;
  }

  function enableEditing() {
    content.disabled = !content.disabled;
    if(content.disabled) {
      content.style.resize = "none";
      content.blur();
      layerbox.addEventListener("mousedown", dragLayerbox);
    }
    else {
      content.style.resize = "both";
      layerbox.removeEventListener("mousedown", dragLayerbox);
    }
  }

  function destroyLayerBox() {
    layerbox.remove();
    listentry.remove();
    getLayerId.free(layerId);
  }
  
  function shiftLayerbox(event) {
    event.stopPropagation();
    event.preventDefault();
    if (event.key === 'ArrowLeft') {
      layerbox.style.left = layerbox.offsetLeft - 1 + "px";
    }
    if (event.key === 'ArrowRight') {
      layerbox.style.left = layerbox.offsetLeft + 1 + "px";
    }
    if (event.key === 'ArrowUp') {
      layerbox.style.top = layerbox.offsetTop - 18 + "px";
    }
    if (event.key === 'ArrowDown') {
      layerbox.style.top = layerbox.offsetTop + 18 + "px";
    }
    if (event.key === 'Enter' || event.keyCode === 13) {
      paste();
    }
    if (event.key === 'Escape') {
      destroyLayerBox();
    }
  }
  
  function enableKeyboardControls() {
    layerbox.addEventListener('keydown', shiftLayerbox);
  }
  
  function disableKeyboardControls() {
    layerbox.removeEventListener('keydown', shiftLayerbox);
  }
}

function createLayerBox(view, content, X, Y) {
  const plugin = view.plugin(layerBoxPlugin);
  const layerboxcontainer = plugin.dom;
  const layerboxorigin = layerboxcontainer.querySelector('.cm-layerbox-origin');
  
  let layerbox = document.createElement("div");
  layerbox.classList.add("cm-layerbox");
  layerbox.tabIndex = 0;
  layerbox.innerHTML =
    '<textarea autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea><div class="layerbox-menu" title="Arrow keys to move when focused"><button class="paste-button" title="Paste">P</button><button class="adjustablepaste-button" title="Adjustable Paste (ENTER)">a</button><button class="edit-button" title="Edit Layerbox">e</button><button class="x-button" title="Close Layerbox (ESC)">X</button></div>';
  layerbox.style.top = Y + "px";
  layerbox.style.left = X + "px";
  layerBoxController(view, layerboxorigin, layerbox, content);
  layerboxorigin.appendChild(layerbox);
}


function createLayerListEntry(layerbox, layerId) {
  const layerlist = document.getElementById('layerList');
    
  let listentry = document.createElement("div");
  listentry.classList.add("layerbox-control");
  listentry.tabIndex = 0;
  listentry.draggable = true;
  listentry.innerHTML =
    '<div class="tooltip"></div><span class="layer-label">' + layerId + ':</span><button class="focus-button" title="Focus layerbox and bring it into view if offscreen.">Focus Layerbox</button><button class="x-button" title="Close Layerbox">X</button>';
  let tooltip = listentry.getElementsByClassName("tooltip")[0];
  layerlist.appendChild(listentry);
  
  listentry.getElementsByClassName("focus-button")[0].onclick = function(){
      if (layerbox.offsetLeft + layerbox.offsetWidth < 30)
        layerbox.style.left = 80 - layerbox.offsetWidth + "px";
      if (layerbox.offsetTop + layerbox.offsetHeight < 18)
        layerbox.style.top = Math.round((36 - layerbox.offsetHeight) / 18) * 18 + "px";
      
      layerbox.focus();
    };
  listentry.getElementsByClassName("x-button")[0].onclick = function(){
      layerbox.remove();
      listentry.remove();
      getLayerId.free(layerId);
    };
  
  listentry.onfocus = updateTooltip;
  listentry.onmouseover = updateTooltip;
  
  function updateTooltip() {
    content = (layerbox.getElementsByTagName("textarea").length === 0) ? layerbox.getElementsByClassName("frame-wrapper")[0].textContent // It's a framebox
                                                                       : layerbox.getElementsByTagName("textarea")[0].value;             // Otherwise, normal layerbox
    tooltip.textContent = content;
  }
    
  return listentry;
}

function initLayerListDraggable(view) {
  const layerlist = document.getElementById('layerList');
  const plugin = view.plugin(layerBoxPlugin);
  const layerboxcontainer = plugin.dom;
  const layerboxorigin = layerboxcontainer.querySelector('.cm-layerbox-origin');
  
  let draggedentry = null;
  let currentDropTarget = null;
  let draggedLayerbox = null;
  
  layerlist.addEventListener('dragstart', handleDragStart);
  layerlist.addEventListener('dragover', handleDragOver);
  layerlist.addEventListener('dragleave', handleDragLeave);
  layerlist.addEventListener('drop', handleDrop);
  layerlist.addEventListener('dragend', handleDragEnd);
  
  function clearStyle(element) {
    if (!element) return;
    element.style.boxShadow = '';
    //element.style.marginTop = '';
    //element.style.marginBottom = '';
  }
  
  function getDropTarget(event) {
    let target = event.target.closest('.layerbox-control');

    if (!target && layerlist.contains(event.target)) {
      const nodes = layerlist.querySelectorAll('.layerbox-control');
      if (nodes.length > 0) {
        const lastnode = nodes[nodes.length - 1];
        const rect = lastnode.getBoundingClientRect();
        // If we are below the vertical center of the last item, target it
        if (event.clientY > rect.top + (rect.height / 2)) {
          target = lastnode;
        }
      }
    }
    return target;
  }
  
  function handleDragStart(event) {
    draggedentry = event.target.closest('.layerbox-control');
    
    if (draggedentry) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', draggedentry.innerHTML);
      
      const listnodes = Array.from(layerlist.querySelectorAll('.layerbox-control'));
      const layerboxnodes = Array.from(layerboxorigin.childNodes);
      const draggedindex = listnodes.indexOf(draggedentry);

      // Store the corresponding layerbox to move it later
      if (draggedindex !== -1) {
        draggedLayerbox = layerboxnodes[draggedindex];
      }

      let tooltip = draggedentry.querySelector(".tooltip");
      tooltip.style.opacity = '0';
    }
  }
  
  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const targetentry = getDropTarget(event);
  
    // Clear styles from the previous target if we've moved to a new one.
    if (currentDropTarget && currentDropTarget !== targetentry) {
      clearStyle(currentDropTarget);
    }
    currentDropTarget = targetentry;
  
    if (targetentry && targetentry !== draggedentry) {
      const boundingRect = targetentry.getBoundingClientRect();
      const offset = boundingRect.y + (boundingRect.height / 2);
      
      // I'm using a box-shadow to indicate where the layer entry is going to be placed.
      // This is kind of lazy in my opinion, I'd rather shift the margin to make it look like
      // the target entry is moving out of the way. But my first attempt at that caused flickering
      // and I didn't want to waste time debugging that.
      if (event.clientY >= offset) {
        targetentry.style.boxShadow = '0 3px 0 0 #1ba7a7';
      } else {
        targetentry.style.boxShadow = '0 -3px 0 0 #1ba7a7';
      }
    }
  }
  
  function handleDragLeave(event) {
    //const targetentry = event.target.closest('.layerbox-control');
    //if (targetentry && targetentry !== draggedentry) {
    //  // Ensure we are completely leaving the element, not just passing over a child node inside it
    //  if (!targetentry.contains(event.relatedTarget)) {
    //    clearStyle(targetentry);
    //    if (currentDropTarget === targetentry) {
    //      currentDropTarget = null;
    //    }
    //  }
    //}
    if (currentDropTarget && !layerlist.contains(event.relatedTarget)) {
      clearStyle(currentDropTarget);
      currentDropTarget = null;
    }
  }
  
  function handleDrop(event) {
    event.preventDefault();
    
    const targetentry = getDropTarget(event);
    
    if (targetentry && targetentry !== draggedentry) {
      const boundingRect = targetentry.getBoundingClientRect();
      
      const listnodes = Array.from(layerlist.querySelectorAll('.layerbox-control'));
      const layerboxnodes = Array.from(layerboxorigin.childNodes);
      const targetindex = listnodes.indexOf(targetentry);
      const targetLayerbox = layerboxnodes[targetindex];
      
      // If targetentry is the last element and we drop below it, .nextSibling is null.
      // insertBefore(element, null) appends to the end.
      if (event.clientY >= boundingRect.top + (boundingRect.height / 2)) {
        targetentry.parentNode.insertBefore(draggedentry, targetentry.nextSibling);
        
        //if (targetLayerbox && draggedLayerbox) {
        layerboxorigin.insertBefore(draggedLayerbox, targetLayerbox.nextSibling);
        //}
      } else {
        targetentry.parentNode.insertBefore(draggedentry, targetentry);
        
        //if (targetLayerbox && draggedLayerbox) {
        layerboxorigin.insertBefore(draggedLayerbox, targetLayerbox);
        //}
      }
    }
    
    clearStyle(currentDropTarget);
    clearStyle(targetentry);
    currentDropTarget = null;
    
    if (draggedentry) {
      let tooltip = draggedentry.querySelector(".tooltip");
      if (tooltip) tooltip.style.opacity = '';
    }
    draggedentry = null;
    draggedLayerbox = null;
  }
  
  function handleDragEnd(event) {
    clearStyle(currentDropTarget);
    currentDropTarget = null;
    
    if (draggedentry) {
      let tooltip = draggedentry.querySelector(".tooltip");
      if (tooltip) tooltip.style.opacity = '';
    }
    draggedentry = null;
    draggedLayerbox = null;
  }
}


