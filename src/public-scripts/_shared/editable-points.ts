export interface EditablePoint {
  x: number;
  y: number;
}

interface ScreenPoint {
  x: number;
  y: number;
}

export interface EditablePointEditorOptions<TPoint> {
  canvas: HTMLCanvasElement;
  getPoints: () => TPoint[];
  setPoints?: (points: TPoint[]) => void;
  screenToData: (point: ScreenPoint) => TPoint | null;
  dataToScreen: (point: TPoint) => ScreenPoint;
  onChange: () => void;
  inBounds?: (point: TPoint, screenPoint: ScreenPoint) => boolean;
  constrainPoint?: (point: TPoint, index: number, points: TPoint[]) => TPoint;
  canAddPoint?: (point: TPoint, points: TPoint[]) => boolean;
  canRemovePoint?: (index: number, points: TPoint[]) => boolean;
  afterAddPoint?: (points: TPoint[]) => TPoint[];
  hitRadius?: number;
  addGesture?: "alt" | "plain";
  removeGesture?: "alt";
  emptyCursor?: string;
  pointCursor?: string;
  addCursor?: string;
  removeCursor?: string;
  disabledCursor?: string;
}

function localPoint(canvas: HTMLCanvasElement, event: PointerEvent): ScreenPoint {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function isAltGesture(event: PointerEvent | KeyboardEvent): boolean {
  return event.altKey || event.metaKey;
}

export function bindEditablePoints<TPoint>(
  options: EditablePointEditorOptions<TPoint>,
): () => void {
  const hitRadius = options.hitRadius ?? 8;
  const addGesture = options.addGesture ?? "plain";
  const removeGesture = options.removeGesture ?? "alt";
  const pointCursor = options.pointCursor ?? "grab";
  const emptyCursor = options.emptyCursor ?? (addGesture === "plain" ? "crosshair" : "default");
  const addCursor = options.addCursor ?? "copy";
  const removeCursor = options.removeCursor ?? "zoom-out";
  const disabledCursor = options.disabledCursor ?? "not-allowed";
  let dragIndex = -1;
  let activePointerId = -1;
  let lastScreenPoint: ScreenPoint | null = null;

  function replacePoints(points: TPoint[]): void {
    if (options.setPoints) {
      options.setPoints(points);
      return;
    }
    const target = options.getPoints();
    target.splice(0, target.length, ...points);
  }

  function hitIndex(screenPoint: ScreenPoint): number {
    const points = options.getPoints();
    const r2 = hitRadius * hitRadius;
    for (let i = points.length - 1; i >= 0; i--) {
      const pt = options.dataToScreen(points[i]);
      const dx = screenPoint.x - pt.x;
      const dy = screenPoint.y - pt.y;
      if (dx * dx + dy * dy <= r2) return i;
    }
    return -1;
  }

  function inBounds(dataPoint: TPoint | null, screenPoint: ScreenPoint): dataPoint is TPoint {
    if (!dataPoint) return false;
    return options.inBounds ? options.inBounds(dataPoint, screenPoint) : true;
  }

  function addPoint(point: TPoint): void {
    const current = options.getPoints();
    if (options.canAddPoint && !options.canAddPoint(point, current)) return;
    const next = options.afterAddPoint ? options.afterAddPoint([...current, point]) : [...current, point];
    replacePoints(next);
    options.onChange();
  }

  function removePoint(index: number): boolean {
    const current = options.getPoints();
    if (index < 0) return false;
    if (options.canRemovePoint && !options.canRemovePoint(index, current)) return false;
    replacePoints(current.filter((_, i) => i !== index));
    options.onChange();
    return true;
  }

  function updateCursor(event: PointerEvent | KeyboardEvent): void {
    if (dragIndex >= 0) {
      options.canvas.style.cursor = "grabbing";
      return;
    }
    if (typeof (event as PointerEvent).clientX === "number") {
      lastScreenPoint = localPoint(options.canvas, event as PointerEvent);
    }
    if (!lastScreenPoint) return;
    const screenPoint = lastScreenPoint;
    const dataPoint = options.screenToData(screenPoint);
    const idx = hitIndex(screenPoint);
    const alt = isAltGesture(event);
    if (alt && removeGesture === "alt" && idx >= 0) {
      const canRemove = !options.canRemovePoint || options.canRemovePoint(idx, options.getPoints());
      options.canvas.style.cursor = canRemove ? removeCursor : disabledCursor;
      return;
    }
    if (alt && addGesture === "alt" && idx < 0 && inBounds(dataPoint, screenPoint)) {
      const canAdd = !options.canAddPoint || options.canAddPoint(dataPoint, options.getPoints());
      options.canvas.style.cursor = canAdd ? addCursor : disabledCursor;
      return;
    }
    if (idx >= 0) {
      options.canvas.style.cursor = pointCursor;
      return;
    }
    options.canvas.style.cursor = inBounds(dataPoint, screenPoint) ? emptyCursor : "";
  }

  function onPointerDown(event: PointerEvent): void {
    const screenPoint = localPoint(options.canvas, event);
    const dataPoint = options.screenToData(screenPoint);
    const idx = hitIndex(screenPoint);
    const alt = isAltGesture(event);
    if (alt && removeGesture === "alt" && idx >= 0) {
      removePoint(idx);
      updateCursor(event);
      event.preventDefault();
      return;
    }
    if (((alt && addGesture === "alt") || (!alt && addGesture === "plain")) && idx < 0 && inBounds(dataPoint, screenPoint)) {
      addPoint(dataPoint);
      event.preventDefault();
      return;
    }
    if (idx >= 0 && !alt) {
      dragIndex = idx;
      activePointerId = event.pointerId;
      options.canvas.setPointerCapture(event.pointerId);
      options.canvas.style.cursor = "grabbing";
      event.preventDefault();
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (dragIndex < 0) {
      updateCursor(event);
      return;
    }
    if (event.pointerId !== activePointerId) return;
    const screenPoint = localPoint(options.canvas, event);
    const dataPoint = options.screenToData(screenPoint);
    if (!inBounds(dataPoint, screenPoint)) return;
    const current = [...options.getPoints()];
    current[dragIndex] = options.constrainPoint
      ? options.constrainPoint(dataPoint, dragIndex, current)
      : dataPoint;
    replacePoints(current);
    options.onChange();
    event.preventDefault();
  }

  function endDrag(event: PointerEvent): void {
    if (dragIndex < 0) return;
    dragIndex = -1;
    activePointerId = -1;
    if (options.canvas.hasPointerCapture(event.pointerId)) {
      options.canvas.releasePointerCapture(event.pointerId);
    }
    updateCursor(event);
  }

  function resetCursor(): void {
    lastScreenPoint = null;
    if (dragIndex < 0) options.canvas.style.cursor = "";
  }

  options.canvas.style.touchAction = "none";
  options.canvas.addEventListener("pointerdown", onPointerDown);
  options.canvas.addEventListener("pointermove", onPointerMove);
  options.canvas.addEventListener("pointerup", endDrag);
  options.canvas.addEventListener("pointercancel", endDrag);
  options.canvas.addEventListener("pointerleave", resetCursor);
  window.addEventListener("keydown", updateCursor);
  window.addEventListener("keyup", updateCursor);

  return () => {
    options.canvas.removeEventListener("pointerdown", onPointerDown);
    options.canvas.removeEventListener("pointermove", onPointerMove);
    options.canvas.removeEventListener("pointerup", endDrag);
    options.canvas.removeEventListener("pointercancel", endDrag);
    options.canvas.removeEventListener("pointerleave", resetCursor);
    window.removeEventListener("keydown", updateCursor);
    window.removeEventListener("keyup", updateCursor);
  };
}
