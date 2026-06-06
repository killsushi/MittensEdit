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

// Setup function for Trace Mode controls.

(function () {
  const tracemodemenu = document.getElementById('traceModeMenu');
  const plugin = aaeditor.plugin(tracePlugin);
  const tracebg = plugin.dom;
  const traceimage = tracebg.getElementsByClassName('cm-trace-img')[0];

  const controls = [
    { id: "tracemode-x-pos", prop: "x" },
    { id: "tracemode-y-pos", prop: "y" },
    { id: "tracemode-scale", prop: "scale" },
    { id: "tracemode-rotation", prop: "rotation" },
    { id: "tracemode-brightness", prop: "brightness" },
    { id: "tracemode-contrast", prop: "contrast" },
    { id: "tracemode-saturation", prop: "saturation" },
    { id: "tracemode-hue", prop: "hue" },
    { id: "tracemode-opacity", prop: "opacity" },
  ];

  const state = {
    x: 0,             // horizontal position in px
    y: 0,             // vertical position in px
    scale: 100,       // percent
    rotation: 0,      // degrees
    mirrorX: false,   // horizontal flip
    mirrorY: false,   // vertical flip
    brightness: 100,  // percent
    contrast: 100,    // percent
    saturation: 100,  // percent
    hue: 0,           // hue in degrees
    opacity: 100,     // percent
  };

  function updateTransform() {
    // Scale direction for mirroring
    // Negative scale flips the element
    const sx = state.mirrorX ? -1 : 1;
    const sy = state.mirrorY ? -1 : 1;

    tracebg.style.left = state.x + "px";
    tracebg.style.top = state.y + "px";

    tracebg.style.transform = `
      scale(${sx * state.scale / 100}, ${sy * state.scale / 100})
      rotate(${state.rotation}deg)
    `;
    
    tracebg.style.filter = `
      brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%)
      `;
  }

  // Set up slider/number pairs
  controls.forEach(({ id, prop }) => {
    const range = document.getElementById(id);

    // Find the corresponding number input by matching index among siblings
    const number = range.parentElement.querySelectorAll(".inputNumber")[
      [...range.parentElement.querySelectorAll("input[type=range]")].indexOf(range)
    ];

    // Initialize number input to match the range's starting value
    number.value = range.value;

    range.addEventListener("input", () => {
      // Update number input to reflect slider value
      number.value = range.value;

      state[prop] = parseFloat(range.value);
      updateTransform();
    });

    number.addEventListener("input", () => {
      // Update slider to reflect number input
      range.value = number.value;

      state[prop] = parseFloat(number.value);
      updateTransform();
    });
  });

  const mirrorX = document.getElementById("tracemode-mirror-x");
  mirrorX.addEventListener("change", () => {
    state.mirrorX = mirrorX.checked;
    updateTransform();
  });
  
  const mirrorY = document.getElementById("tracemode-mirror-y");
  mirrorY.addEventListener("change", () => {
    state.mirrorY = mirrorY.checked;
    updateTransform();
  });
  
  const colorpicker = document.getElementById('tracemode-text-color');
  colorpicker.addEventListener('input', (event) => {
    const inputcontainer = document.getElementById('inputContainer');
    inputcontainer.style.setProperty('--trace-text', event.target.value);
  });
  
  const tracemodetoggle = document.getElementById('tracemode-toggle');
  let tracemodestatus = false;
  tracemodetoggle.addEventListener('click', (event) => {
    const inputcontainer = document.getElementById('inputContainer');
    tracemodestatus = !tracemodestatus;
    inputcontainer.classList.toggle("trace-mode");
    if (tracemodestatus) tracemodetoggle.textContent = "Off";
    else tracemodetoggle.textContent = "On";
  });
    
  const imageinput = document.getElementById('tracemode-imageinput');
  imageinput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      traceimage.src = URL.createObjectURL(file);
      traceimage.onload = () => URL.revokeObjectURL(traceimage.src);
    }
  });
  
  const resetbutton = document.getElementById('tracemode-reset');
  resetbutton.addEventListener('click', (event) => {
    controls.forEach(({ id, prop }) => {
      const range = document.getElementById(id);
  
      const number = range.parentElement.querySelectorAll(".inputNumber")[
        [...range.parentElement.querySelectorAll("input[type=range]")].indexOf(range)
      ];
      
      range.value = range.defaultValue;
      number.value = range.defaultValue;
      state[prop] = parseFloat(range.defaultValue);
    });
    updateTransform();    
  });

  // Apply initial transform on load
  updateTransform();
})();