import { applyOutputOptions, applyTileableBlend, buildDerivedMap, clampOutputSize } from "../utils/OutputOptions.js";

const PREVIEW_LONG_EDGE = 768;

export class PreviewController {
  constructor(canvas, onViewChange) {
    this.canvas = canvas;
    this.wrap = canvas.parentElement;
    this.ctx = canvas.getContext("2d");
    this.sourceBuffer = document.createElement("canvas");
    this.buffer = document.createElement("canvas");
    this.sourceBuffer.width = canvas.width;
    this.sourceBuffer.height = canvas.height;
    this.buffer.width = canvas.width;
    this.buffer.height = canvas.height;
    this.aspect = canvas.width / canvas.height;
    this.output = {};
    this.generatorId = "";
    this.hasSource = false;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.drag = null;
    this.onViewChange = onViewChange;
    this.fitObserver = new ResizeObserver(() => this.fitCanvas());
    this.fitObserver.observe(this.wrap);
    this.bind();
    this.fitCanvas();
  }

  bind() {
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1.1 : 0.9;
      this.zoom = Math.min(5, Math.max(0.35, this.zoom * direction));
      this.redraw();
      this.onViewChange?.(this.zoom);
    });

    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this.drag = { x: event.clientX, y: event.clientY, panX: this.pan.x, panY: this.pan.y };
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.drag) return;
      this.pan.x = this.drag.panX + event.clientX - this.drag.x;
      this.pan.y = this.drag.panY + event.clientY - this.drag.y;
      this.redraw();
    });

    this.canvas.addEventListener("pointerup", () => {
      this.drag = null;
    });
  }

  setOutputSize(width, height) {
    const outWidth = clampOutputSize(width);
    const outHeight = clampOutputSize(height);
    const scale = Math.min(1, PREVIEW_LONG_EDGE / Math.max(outWidth, outHeight));
    const previewWidth = Math.max(1, Math.round(outWidth * scale));
    const previewHeight = Math.max(1, Math.round(outHeight * scale));
    if (this.canvas.width === previewWidth && this.canvas.height === previewHeight) {
      return;
    }
    this.canvas.width = previewWidth;
    this.canvas.height = previewHeight;
    this.sourceBuffer.width = previewWidth;
    this.sourceBuffer.height = previewHeight;
    this.buffer.width = previewWidth;
    this.buffer.height = previewHeight;
    this.aspect = outWidth / outHeight;
    this.canvas.style.aspectRatio = `${outWidth} / ${outHeight}`;
    this.fitCanvas();
  }

  render(generator, params, context) {
    this.output = context.output || {};
    this.generatorId = generator.id;
    generator.generate(this.sourceBuffer, params, { ...context, mapType: "color" });
    applyTileableBlend(this.sourceBuffer, this.output);
    applyOutputOptions(this.sourceBuffer, this.output);
    this.hasSource = true;
    this.applyMap(context.mapType || this.output.mapType || "color", this.output, generator.id);
  }

  applyMap(mapType = "color", output = this.output, generatorId = this.generatorId) {
    if (!this.hasSource) return false;
    this.output = output || this.output;
    this.generatorId = generatorId || this.generatorId;
    const bufferCtx = this.buffer.getContext("2d", { willReadFrequently: true });
    this.buffer.width = this.sourceBuffer.width;
    this.buffer.height = this.sourceBuffer.height;
    bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    bufferCtx.drawImage(this.sourceBuffer, 0, 0, this.buffer.width, this.buffer.height);
    buildDerivedMap(this.buffer, mapType, { generatorId: this.generatorId });
    this.redraw();
    return true;
  }

  drawBitmap(bitmap, output = {}, generatorId = "") {
    this.output = output;
    this.generatorId = generatorId;
    this.sourceBuffer.width = this.canvas.width;
    this.sourceBuffer.height = this.canvas.height;
    const sourceCtx = this.sourceBuffer.getContext("2d");
    sourceCtx.clearRect(0, 0, this.sourceBuffer.width, this.sourceBuffer.height);
    sourceCtx.drawImage(bitmap, 0, 0, this.sourceBuffer.width, this.sourceBuffer.height);
    bitmap.close?.();
    this.hasSource = true;
    this.applyMap(output.mapType || "color", output, generatorId);
  }

  clear(message = "点击生成 / 刷新") {
    this.hasSource = false;
    const { width, height } = this.canvas;
    this.ctx.fillStyle = this.output.backgroundColor || "#050606";
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = "rgba(238, 243, 245, 0.72)";
    this.ctx.font = "16px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(message, width / 2, height / 2);
  }

  redraw() {
    const { width, height } = this.canvas;
    this.ctx.fillStyle = this.output.backgroundColor || "#050606";
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.save();
    this.ctx.translate(width * 0.5 + this.pan.x, height * 0.5 + this.pan.y);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.drawImage(this.buffer, -width * 0.5, -height * 0.5, width, height);
    this.ctx.restore();
  }

  fitCanvas() {
    if (!this.wrap) return;
    const { clientWidth, clientHeight } = this.wrap;
    if (!clientWidth || !clientHeight) return;
    const wrapAspect = clientWidth / clientHeight;
    if (wrapAspect > this.aspect) {
      this.canvas.style.height = "100%";
      this.canvas.style.width = "auto";
    } else {
      this.canvas.style.width = "100%";
      this.canvas.style.height = "auto";
    }
  }
}
