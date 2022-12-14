import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable react/jsx-no-literals */
/* eslint-disable @typescript-eslint/naming-convention */
export const preferencesText = createDictionary({
  behavior: { 'en-us': 'Behavior' },
  includeAllDayEvents: { 'en-us': 'Include All-Day Events' },
  features: { 'en-us': 'Features' },
  ghostEvent: { 'en-us': 'A keyboard shortcut to display event as a ghost' },
  ghostEventDescription: {
    'en-us':
      'Ghost events are displayed as semi-transparent and non-interactive',
  },
  disable: { 'en-us': 'Disable' },
  shiftClick: { 'en-us': 'Shift+Click' },
  cmdClick: { 'en-us': 'Cmd+Click' },
  ctrlClick: { 'en-us': 'Ctrl+Click' },
  ignoreAllDayEvents: { 'en-us': 'Ignore All-Day Events' },
  openOverlayShortcut: { 'en-us': 'Open Overlay Shortcut' },
  closeOverlayShortcut: { 'en-us': 'Close Overlay Shortcut' },
  ctrl: { 'en-us': 'Ctrl' },
  cmd: { 'en-us': 'Cmd' },
  shift: { 'en-us': 'Shift' },
  alt: { 'en-us': 'Alt' },
  meta: { 'en-us': 'Cmd' },
  pressKeys: { 'en-us': 'Press some keys...' },
});
/* eslint-enable react/jsx-no-literals */
/* eslint-enable @typescript-eslint/naming-convention */
