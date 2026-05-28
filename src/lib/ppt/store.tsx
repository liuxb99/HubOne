// =============================================================================
// 線上 PPT 編輯器 — 狀態管理（React Context + useReducer + localStorage）
// =============================================================================

"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
  type Dispatch,
} from "react";
import type {
  PPTDocument,
  Slide,
  SlideElement,
  SlideBackground,
  EditorState,
  Action,
  Template,
} from "./types";
import { getDefaultTemplate } from "./template";

// ── 常數 ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ppt_document";
const DEFAULT_TITLE = "未命名簡報";
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// ── 輔助：產生唯一 ID ────────────────────────────────────────────────────

let _idCounter = Date.now();
function generateId(): string {
  return `id_${(_idCounter++).toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── 輔助：建立空投影片 ───────────────────────────────────────────────────

function createSlide(): Slide {
  return {
    id: generateId(),
    elements: [],
    background: { type: "solid", value: "#ffffff" },
  };
}

// ── 輔助：建立預設文件 ───────────────────────────────────────────────────

function createDefaultDocument(title?: string, templateId?: string): PPTDocument {
  const now = Date.now();
  return {
    id: generateId(),
    title: title ?? DEFAULT_TITLE,
    slides: [createSlide()],
    templateId: templateId ?? getDefaultTemplate().id,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Reducer ──────────────────────────────────────────────────────────────

export function pptReducer(state: PPTDocument, action: Action): PPTDocument {
  const now = Date.now();

  switch (action.type) {
    // ── 新文件 ─────────────────────────────────────────────────────────
    case "NEW_DOCUMENT": {
      const { title, templateId } = action.payload ?? {};
      return createDefaultDocument(title, templateId);
    }

    // ── 載入文件 ───────────────────────────────────────────────────────
    case "LOAD_DOCUMENT": {
      return { ...action.payload, updatedAt: now };
      }

    // ── 設定標題 ───────────────────────────────────────────────────────
    case "SET_TITLE": {
      return { ...state, title: action.payload, updatedAt: now };
      }

    // ── 新增投影片 ─────────────────────────────────────────────────────
    case "ADD_SLIDE": { const now = Date.now();
      const newSlide = createSlide();
      return {
        ...state,
        slides: [...state.slides, newSlide],
        updatedAt: now,
      };
    }

    // ── 複製投影片 ─────────────────────────────────────────────────────
    case "DUPLICATE_SLIDE": { const now = Date.now();
      const { slideId } = action.payload;
      const source = state.slides.find((s) => s.id === slideId);
      if (!source) return state;
      const newSlide: Slide = {
        ...source,
        id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        elements: source.elements.map((el) => ({
          ...el,
          id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        })),
      };
      const idx = state.slides.findIndex((s) => s.id === slideId);
      const newSlides = [...state.slides];
      newSlides.splice(idx + 1, 0, newSlide);
      return { ...state, slides: newSlides, updatedAt: now };
    }

    // ── 刪除投影片 ─────────────────────────────────────────────────────
    case "DELETE_SLIDE": { const now = Date.now();
      const { slideId } = action.payload;
      if (state.slides.length <= 1) return state; // 保留至少一頁
      return {
        ...state,
        slides: state.slides.filter((s) => s.id !== slideId),
        updatedAt: now,
      };
    }

    // ── 選取投影片（僅更新 slide 順序，觸發 editorState 更新由 provider 處理）─
    case "SELECT_SLIDE": {
      return { ...state };
      } // 由外部 hook 處理 currentSlideId

    // ── 重新排序投影片 ─────────────────────────────────────────────────
    case "REORDER_SLIDES": { const now = Date.now();
      const { slideIds } = action.payload;
      const slideMap = new Map(state.slides.map((s) => [s.id, s]));
      const reordered = slideIds.map((id) => slideMap.get(id)).filter(Boolean) as Slide[];
      if (reordered.length !== state.slides.length) return state;
      return { ...state, slides: reordered, updatedAt: now };
    }

    // ── 新增元素 ───────────────────────────────────────────────────────
    case "ADD_ELEMENT": { const now = Date.now();
      const { slideId, element } = action.payload;
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide.id === slideId
            ? { ...slide, elements: [...slide.elements, element] }
            : slide
        ),
        updatedAt: now,
      };
    }

    // ── 更新元素 ───────────────────────────────────────────────────────
    case "UPDATE_ELEMENT": { const now = Date.now();
      const { slideId, elementId, updates } = action.payload;
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                elements: slide.elements.map((el) =>
                  el.id === elementId ? ({ ...el, ...updates } as SlideElement) : el
                ),
              }
            : slide
        ),
        updatedAt: now,
      };
    }

    // ── 刪除元素 ───────────────────────────────────────────────────────
    case "DELETE_ELEMENT": { const now = Date.now();
      const { slideId, elementId } = action.payload;
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide.id === slideId
            ? { ...slide, elements: slide.elements.filter((el) => el.id !== elementId) }
            : slide
        ),
        updatedAt: now,
      };
    }

    // ── 移動元素 ───────────────────────────────────────────────────────
    case "MOVE_ELEMENT": { const now = Date.now();
      const { slideId, elementId, position } = action.payload;
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                elements: slide.elements.map((el) =>
                  el.id === elementId ? { ...el, position } : el
                ),
              }
            : slide
        ),
        updatedAt: now,
      };
    }

    // ── 更新文字內容 ───────────────────────────────────────────────────
    case "UPDATE_TEXT": { const now = Date.now();
      const { slideId, elementId, content } = action.payload;
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                elements: slide.elements.map((el) =>
                  el.id === elementId && el.type === "text"
                    ? { ...el, content } as SlideElement
                    : el
                ),
              }
            : slide
        ),
        updatedAt: now,
      };
    }

    // ── 套用模板 ───────────────────────────────────────────────────────
    case "APPLY_TEMPLATE": { const now = Date.now();
      const { templateId, template } = action.payload;
      const bg: SlideBackground =
        template.colors.gradient
          ? { type: "gradient", value: template.colors.gradient }
          : { type: "solid", value: template.colors.background };

      return {
        ...state,
        templateId,
        slides: state.slides.map((slide) => ({
          ...slide,
          background: bg,
          elements: slide.elements.map((el) => {
            // 更新文字元素的顏色以符合模板
            if (el.type === "text") {
              return { ...el, color: template.colors.text } as SlideElement;
            }
            return el;
          }),
        })),
        updatedAt: now,
      };
    }

    // ── 設定背景 ───────────────────────────────────────────────────────
    case "SET_BACKGROUND": { const now = Date.now();
      const { slideId, background } = action.payload;
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide.id === slideId ? { ...slide, background } : slide
        ),
        updatedAt: now,
      };
    }

    default:
      return state;
  }
}

// ── Editor Reducer ────────────────────────────────────────────────────────

type EditorAction =
  | { type: "SET_CURRENT_SLIDE"; payload: string | null }
  | { type: "SELECT_ELEMENT"; payload: { elementId: string; multi?: boolean } }
  | { type: "DESELECT_ALL" }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "START_PRESENT" }
  | { type: "NEXT_SLIDE"; payload: { total: number } }
  | { type: "PREV_SLIDE" }
  | { type: "END_PRESENT" };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_CURRENT_SLIDE": {
      return { ...state, currentSlideId: action.payload, selectedElementIds: [] };
      }

    case "SELECT_ELEMENT": {
      const { elementId, multi } = action.payload;
      if (multi) {
        const exists = state.selectedElementIds.includes(elementId);
        return {
          ...state,
          selectedElementIds: exists
            ? state.selectedElementIds.filter((id) => id !== elementId)
            : [...state.selectedElementIds, elementId],
        };
      }
      return { ...state, selectedElementIds: [elementId] };
    }

    case "DESELECT_ALL": {
      return { ...state, selectedElementIds: [] };
      }

    case "SET_ZOOM": {
      return { ...state, zoom: Math.max(25, Math.min(200, action.payload)) };
      }

    case "START_PRESENT": {
      return { ...state, isPresenting: true, currentPresentIndex: 0 };
      }

    case "NEXT_SLIDE": {
      const next = Math.min(state.currentPresentIndex + 1, action.payload.total - 1);
      return { ...state, currentPresentIndex: next };
    }

    case "PREV_SLIDE": {
      const prev = Math.max(state.currentPresentIndex - 1, 0);
      return { ...state, currentPresentIndex: prev };
    }

    case "END_PRESENT": {
      return { ...state, isPresenting: false, currentPresentIndex: 0 };
      }

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────

interface PPTContextValue {
  doc: PPTDocument;
  editor: EditorState;
  dispatch: Dispatch<Action>;
  editorDispatch: Dispatch<EditorAction>;
  /** 當前投影片（便利存取） */
  currentSlide: Slide | null;
  /** 取消所有選取 */
  deselectAll: () => void;
  /** 取得指定投影片的元素 */
  getSlideElements: (slideId: string) => SlideElement[];
}

const PPTContext = createContext<PPTContextValue | null>(null);

// ── 初始編輯器狀態 ──────────────────────────────────────────────────────

const initialEditorState: EditorState = {
  currentSlideId: null,
  selectedElementIds: [],
  zoom: 100,
  isPresenting: false,
  currentPresentIndex: 0,
};

// ── localStorage 持久化 ──────────────────────────────────────────────────

function loadFromStorage(): PPTDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PPTDocument;
    // 基本驗證
    if (!parsed.id || !parsed.slides || !Array.isArray(parsed.slides)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(doc: PPTDocument): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // localStorage 不可用時忽略
  }
}

// ── Provider ─────────────────────────────────────────────────────────────

export function PPTProvider({ children }: { children: ReactNode }) {
  const [doc, dispatch] = useReducer(pptReducer, null, () => {
    return loadFromStorage() ?? createDefaultDocument();
  });

  const [editor, editorDispatch] = useReducer(editorReducer, initialEditorState, (init) => ({
    ...init,
    currentSlideId: init.currentSlideId ?? doc.slides[0]?.id ?? null,
  }));

  // 每當 doc 變化時自動持久化到 localStorage
  useEffect(() => {
    saveToStorage(doc);
  }, [doc]);

  // 當 slides 變化但 currentSlideId 為 null 時自動選第一頁
  useEffect(() => {
    if (!editor.currentSlideId && doc.slides.length > 0) {
      editorDispatch({ type: "SET_CURRENT_SLIDE", payload: doc.slides[0].id });
    }
  }, [doc.slides, editor.currentSlideId]);

  const currentSlide = doc.slides.find((s) => s.id === editor.currentSlideId) ?? null;

  const deselectAll = useCallback(() => {
    editorDispatch({ type: "DESELECT_ALL" });
  }, []);

  const getSlideElements = useCallback(
    (slideId: string): SlideElement[] => {
      const slide = doc.slides.find((s) => s.id === slideId);
      return slide?.elements ?? [];
    },
    [doc.slides]
  );

  const value: PPTContextValue = {
    doc,
    editor,
    dispatch,
    editorDispatch,
    currentSlide,
    deselectAll,
    getSlideElements,
  };

  return <PPTContext.Provider value={value}>{children}</PPTContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function usePPTStore(): PPTContextValue {
  const ctx = useContext(PPTContext);
  if (!ctx) {
    throw new Error("usePPTStore 必須在 PPTProvider 內部使用");
  }
  return ctx;
}

// ── 匯出常數供外部使用 ──────────────────────────────────────────────────

export { CANVAS_WIDTH, CANVAS_HEIGHT, generateId, createSlide };
