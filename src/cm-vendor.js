import {minimalSetup, EditorView} from "codemirror";
import {EditorState,  EditorSelection, StateEffect, Prec, StateField, Compartment, Transaction, Annotation} from "@codemirror/state";
import {keymap, crosshairCursor, MatchDecorator, ViewPlugin, Decoration, WidgetType} from "@codemirror/view";
import {history, undo, redo, invertedEffects} from "@codemirror/commands";

window.CM = {
  minimalSetup,
  EditorView,
  EditorState,
  EditorSelection,
  StateEffect,
  Prec,
  StateField,
  Compartment,
  Transaction,
  Annotation,
  keymap,
  crosshairCursor,
  MatchDecorator,
  ViewPlugin,
  Decoration,
  WidgetType,
  history,
  undo,
  redo,
  invertedEffects
};
