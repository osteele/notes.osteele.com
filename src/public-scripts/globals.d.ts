interface Element {
  classList: DOMTokenList;
  dataset: DOMStringMap;
  checked: boolean;
  click: () => void;
  disabled: boolean;
  height: number;
  href: string;
  max: any;
  min: any;
  options: HTMLOptionsCollection;
  selectedIndex: number;
  selectedOptions: HTMLCollectionOf<HTMLOptionElement>;
  step: any;
  style: CSSStyleDeclaration;
  title: string;
  value: any;
  width: number;
  getContext: HTMLCanvasElement["getContext"];
  setPointerCapture: (pointerId: number) => void;
}

interface EventTarget {
  classList: DOMTokenList;
  closest: Element["closest"];
  getBoundingClientRect: Element["getBoundingClientRect"];
  setPointerCapture: Element["setPointerCapture"];
  value: any;
}

interface Window {
  webkitAudioContext: typeof AudioContext;
  __samplingFig2Current: { x: number; y: number };
  __samplingFig2NotifySurface?: () => void;
  buildLink: (href: string) => string;
  renderMathInElement: any;
  resetCoachmarks: () => void;
}

declare const MODEL_SPECS: Record<string, any>;
declare const GPU_SPECS: Record<string, any>;
declare const QUANT: Record<string, any>;
declare const TARGET_MODELS: Record<string, any>;
declare const DRAFT_MODELS: Record<string, any>;
declare const BYTES_PER_PARAM: Record<string, number>;
declare const TOKENS: string[];
declare const SAMPLE_TEXTS: Record<string, string>;
declare const fmt: any;
declare const fmtBytes: any;
declare const fmtDim: any;
declare const fmtFlops: any;
declare const fmtGB: any;
declare const fmtGBshort: any;
declare const fmtMs: any;
declare const fmtMoney: any;
declare const fmtPct: any;
declare const fmtTok: any;
declare const fmtTime: any;
declare const applyUrlParams: any;
declare const buildLink: any;
declare const initOptionPills: any;
declare const saveState: any;
declare const showCoachmarks: any;
declare const renderTipsTab: any;
declare const restoreActiveTab: any;
declare const initControls: any;
declare const renderNav: any;
declare const renderBottomPanel: any;
declare const showTab: any;
declare const togglePanel: any;
declare const setPreset: any;
declare const getState: any;
declare const setState: any;
declare const updateState: any;
declare const persistState: any;
declare const loadState: any;
declare const resetCoachmarks: any;
declare const maybeShowCoachmark: any;
