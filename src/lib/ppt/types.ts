// =============================================================================
// 線上 PPT 編輯器 — 核心型別定義
// =============================================================================

/** 2D 位置 */
export interface Position {
  x: number;
  y: number;
}

/** 2D 尺寸 */
export interface Size {
  width: number;
  height: number;
}

// ── 基礎元素 ─────────────────────────────────────────────────────────────

export interface BaseElement {
  id: string;
  type: "text" | "image" | "shape";
  position: Position;
  size: Size;
  rotation: number;
  opacity: number;
  locked: boolean;
}

// ── 文字元素 ─────────────────────────────────────────────────────────────

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
}

// ── 圖片元素 ─────────────────────────────────────────────────────────────

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  alt: string;
  fit: "cover" | "contain" | "fill";
}

// ── 形狀元素 ─────────────────────────────────────────────────────────────

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: "rect" | "circle" | "triangle" | "diamond" | "arrow" | "line";
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

// ── 聯合型別 ─────────────────────────────────────────────────────────────

export type SlideElement = TextElement | ImageElement | ShapeElement;

// ── 投影片 ───────────────────────────────────────────────────────────────

export interface SlideBackground {
  type: "solid" | "gradient";
  /** hex color 或 CSS gradient 字串 */
  value: string;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: SlideBackground;
  /** 投影片過渡效果（階段二） */
  transition?: string;
  /** 過渡持續時間（毫秒），預設 600 */
  transitionDuration?: number;
  /** 演講者備忘錄（階段三） */
  notes?: string;
}

// ── 模板 ─────────────────────────────────────────────────────────────────

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  gradient?: string;
}

export interface TemplateFonts {
  heading: string;
  body: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  colors: TemplateColors;
  fonts: TemplateFonts;
}

// ── 文件 ─────────────────────────────────────────────────────────────────

export interface PPTDocument {
  id: string;
  title: string;
  slides: Slide[];
  templateId: string;
  createdAt: number;
  updatedAt: number;
}

// ── 編輯器狀態 ───────────────────────────────────────────────────────────

export interface EditorState {
  currentSlideId: string | null;
  selectedElementIds: string[];
  zoom: number;
  isPresenting: boolean;
  currentPresentIndex: number;
}

// ── Reducer Action 型別 ─────────────────────────────────────────────────

export type Action =
  | { type: "NEW_DOCUMENT"; payload?: { title?: string; templateId?: string } }
  | { type: "SET_TITLE"; payload: string }
  | { type: "ADD_SLIDE" }
  | { type: "DUPLICATE_SLIDE"; payload: { slideId: string } }
  | { type: "DELETE_SLIDE"; payload: { slideId: string } }
  | { type: "SELECT_SLIDE"; payload: { slideId: string } }
  | { type: "REORDER_SLIDES"; payload: { slideIds: string[] } }
  | { type: "ADD_ELEMENT"; payload: { slideId: string; element: SlideElement } }
  | { type: "UPDATE_ELEMENT"; payload: { slideId: string; elementId: string; updates: Partial<SlideElement> } }
  | { type: "DELETE_ELEMENT"; payload: { slideId: string; elementId: string } }
  | { type: "MOVE_ELEMENT"; payload: { slideId: string; elementId: string; position: Position } }
  | { type: "UPDATE_TEXT"; payload: { slideId: string; elementId: string; content: string } }
  | { type: "APPLY_TEMPLATE"; payload: { templateId: string; template: Template } }
  | { type: "SET_BACKGROUND"; payload: { slideId: string; background: SlideBackground } }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "START_PRESENT" }
  | { type: "NEXT_SLIDE" }
  | { type: "PREV_SLIDE" }
  | { type: "END_PRESENT" }
  | { type: "SELECT_ELEMENT"; payload: { elementId: string; multi?: boolean } }
  | { type: "DESELECT_ALL" }
  | { type: "LOAD_DOCUMENT"; payload: PPTDocument }
  | { type: "UPDATE_SLIDE"; payload: { slideId: string; updates: Partial<Slide> } };
