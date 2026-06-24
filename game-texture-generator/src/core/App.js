import { createZipBlob, downloadBlob, exportTexture, exportTexturePack } from "../utils/ImageExport.js";
import { clampOutputSize } from "../utils/OutputOptions.js";
import {
  getLanguage,
  setLanguage,
  t,
  translateCategoryTitle,
  translateGeneratorDescription,
  translateGeneratorName,
  translateMapType,
  translateMeta,
  translatePresetName,
} from "./I18n.js";
import { categories, getGenerator } from "./Registry.js";
import { ParamPanel } from "./ParamPanel.js";
import { PreviewController } from "./PreviewController.js";
import { RenderWorkerClient } from "./RenderWorkerClient.js";

export class App {
  constructor(documentRef) {
    this.document = documentRef;
    this.currentGenerator = getGenerator("terrain");
    this.params = structuredClone(this.currentGenerator.getDefaultParams());
    this.lastStaticTime = 0;
    this.renderJob = 0;
    this.statusKey = "status.initial";
    this.statusValues = {};
    this.output = {
      width: 512,
      height: 512,
      backgroundColor: "#050606",
      transparentNoise: false,
      tileable: false,
      mapType: "color",
    };
  }

  start() {
    this.cacheElements();
    this.renderer = new RenderWorkerClient();
    this.preview = new PreviewController(this.previewCanvas, (zoom) => {
      this.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    });
    this.paramPanel = new ParamPanel(this.paramPanelElement, (key, value) => {
      this.params[key] = value;
      this.markDirty();
    });
    setLanguage(getLanguage());
    this.bindEvents();
    this.applyStaticText();
    this.renderCategoryTree();
    this.selectGenerator("terrain");
  }

  cacheElements() {
    const $ = (id) => this.document.getElementById(id);
    this.categoryTree = $("categoryTree");
    this.previewCanvas = $("previewCanvas");
    this.generatorTitle = $("generatorTitle");
    this.generatorDescription = $("generatorDescription");
    this.paramPanelElement = $("paramPanel");
    this.presetSelect = $("presetSelect");
    this.generatorMetaLabel = $("generatorMetaLabel");
    this.randomizeParamsButton = $("randomizeParamsButton");
    this.generateButton = $("generateButton");
    this.statusLabel = $("statusLabel");
    this.zoomLabel = $("zoomLabel");
    this.exportFormat = $("exportFormat");
    this.exportWidth = $("exportWidth");
    this.exportHeight = $("exportHeight");
    this.backgroundColor = $("backgroundColor");
    this.transparentNoise = $("transparentNoise");
    this.mapTypeSelect = $("mapTypeSelect");
    this.tileableTexture = $("tileableTexture");
    this.languageSelect = $("languageSelect");
    this.exportImageButton = $("exportImageButton");
    this.exportPackButton = $("exportPackButton");
    this.staticLabels = {
      presetLabel: $("presetLabel"),
      formatLabel: $("formatLabel"),
      widthLabel: $("widthLabel"),
      heightLabel: $("heightLabel"),
      backgroundColorLabel: $("backgroundColorLabel"),
      transparentNoiseLabel: $("transparentNoiseLabel"),
      mapTypeLabel: $("mapTypeLabel"),
      tileableLabel: $("tileableLabel"),
      languageLabel: $("languageLabel"),
    };
  }

  bindEvents() {
    this.generateButton.addEventListener("click", () => {
      this.refreshSeed();
      this.render();
    });
    this.randomizeParamsButton.addEventListener("click", () => this.randomizeParams());
    this.presetSelect.addEventListener("change", () => this.applyPreset(this.presetSelect.value));

    [this.exportWidth, this.exportHeight].forEach((input) => {
      input.addEventListener("change", () => {
        this.syncOutputSettings();
        this.applyOutputSize();
        this.markDirty();
      });
    });

    this.backgroundColor.addEventListener("input", () => {
      this.syncOutputSettings();
      this.markDirty();
    });

    this.transparentNoise.addEventListener("change", () => {
      this.syncOutputSettings();
      this.markDirty();
    });

    this.mapTypeSelect.addEventListener("change", () => {
      this.syncOutputSettings();
      if (this.preview.applyMap(this.output.mapType, this.output, this.currentGenerator.id)) {
        this.setBusy(false, "status.mapSwitched");
      } else {
        this.setBusy(false, "status.pending");
      }
    });

    this.tileableTexture.addEventListener("change", () => {
      this.syncOutputSettings();
      this.markDirty();
    });

    this.exportImageButton.addEventListener("click", async () => {
      this.syncOutputSettings();
      await this.exportImage();
    });

    this.exportPackButton.addEventListener("click", async () => {
      this.syncOutputSettings();
      await this.exportPack();
    });

    this.languageSelect.addEventListener("change", () => {
      setLanguage(this.languageSelect.value);
      this.applyLanguage();
    });
  }

  applyStaticText() {
    this.document.querySelector(".sidebar")?.setAttribute("aria-label", t("aria.sidebar"));
    this.document.querySelector(".canvas-wrap")?.setAttribute("aria-label", t("aria.preview"));
    this.document.querySelector(".params-panel")?.setAttribute("aria-label", t("aria.params"));
    this.generateButton.textContent = t("generate");
    this.randomizeParamsButton.textContent = t("randomize");
    this.exportImageButton.textContent = t("exportCurrent");
    this.exportPackButton.textContent = t("exportPack");
    this.staticLabels.presetLabel.textContent = t("preset");
    this.staticLabels.formatLabel.textContent = t("format");
    this.staticLabels.widthLabel.textContent = t("width");
    this.staticLabels.heightLabel.textContent = t("height");
    this.staticLabels.backgroundColorLabel.textContent = t("backgroundColor");
    this.staticLabels.transparentNoiseLabel.textContent = t("transparentNoise");
    this.staticLabels.mapTypeLabel.textContent = t("mapType");
    this.staticLabels.tileableLabel.textContent = t("tileable");
    this.staticLabels.languageLabel.textContent = t("language");
    this.languageSelect.value = getLanguage();
    Array.from(this.mapTypeSelect.options).forEach((option) => {
      option.textContent = translateMapType(option.value);
    });
    this.statusLabel.textContent = t(this.statusKey, this.statusValues);
  }

  applyLanguage() {
    this.applyStaticText();
    this.renderCategoryTree();
    this.highlightCurrentGenerator();
    this.syncGeneratorText(this.currentGenerator);
    this.renderPresets(this.currentGenerator);
    this.syncGeneratorMeta(this.currentGenerator);
    this.paramPanel.render(this.currentGenerator.getParamSchema(), this.params);
  }

  renderCategoryTree() {
    this.categoryTree.replaceChildren();
    categories.forEach((category) => {
      const group = document.createElement("section");
      group.className = "category";
      const title = document.createElement("button");
      title.type = "button";
      title.className = "category-title";
      title.textContent = translateCategoryTitle(category.title);
      title.addEventListener("click", () => {
        group.classList.toggle("is-collapsed");
      });
      group.append(title);
      const itemList = document.createElement("div");
      itemList.className = "category-items";
      category.items.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `generator-button${item.generatorId ? "" : " is-placeholder"}`;
        button.dataset.generatorId = item.generatorId || "";
        button.innerHTML = `<span>${item.generatorId ? translateGeneratorName(item.generatorId, item.label) : item.label}</span><span>${item.generatorId ? t("generate").split(" ")[0] : "Pending"}</span>`;
        if (item.generatorId) {
          button.addEventListener("click", () => this.selectGenerator(item.generatorId));
        }
        itemList.append(button);
      });
      group.append(itemList);
      this.categoryTree.append(group);
    });
  }

  selectGenerator(generatorId, params = null) {
    const generator = getGenerator(generatorId);
    if (!generator) return;
    this.currentGenerator = generator;
    this.params = { ...generator.getDefaultParams(), ...(params || {}) };
    this.syncGeneratorText(generator);
    this.renderPresets(generator);
    this.syncGeneratorMeta(generator);
    this.paramPanel.render(generator.getParamSchema(), this.params);
    this.document.querySelectorAll(".generator-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.generatorId === generatorId);
    });
    this.markDirty();
  }

  highlightCurrentGenerator() {
    this.document.querySelectorAll(".generator-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.generatorId === this.currentGenerator.id);
    });
  }

  syncGeneratorText(generator) {
    this.generatorTitle.textContent = translateGeneratorName(generator, generator.name);
    this.generatorDescription.textContent = translateGeneratorDescription(generator);
  }

  async render(time = this.lastStaticTime) {
    this.syncOutputSettings();
    this.applyOutputSize();
    const jobId = this.renderJob + 1;
    this.renderJob = jobId;
    this.setBusy(true, "status.generating");
    const width = this.preview.canvas.width;
    const height = this.preview.canvas.height;
    try {
      if (this.renderer.isAvailable()) {
        const bitmap = await this.renderer.renderPreview(
          this.currentGenerator.id,
          this.params,
          width,
          height,
          time,
          this.output,
          "color",
        );
        if (jobId === this.renderJob) {
          this.preview.drawBitmap(bitmap, this.output, this.currentGenerator.id);
        } else {
          bitmap.close?.();
        }
      } else {
        this.preview.render(this.currentGenerator, this.params, { time, output: this.output, mapType: this.output.mapType, tileable: this.output.tileable });
      }
      if (jobId === this.renderJob) {
        this.setBusy(false, "status.generated");
      }
    } catch (error) {
      this.preview.render(this.currentGenerator, this.params, { time, output: this.output, mapType: this.output.mapType, tileable: this.output.tileable });
      this.setBusy(false, "status.workerFallback");
      console.warn(error);
    }
  }

  syncOutputSettings() {
    const width = clampOutputSize(this.exportWidth.value, this.output.width);
    const height = clampOutputSize(this.exportHeight.value, this.output.height);
    this.output = {
      width,
      height,
      backgroundColor: this.backgroundColor.value || "#050606",
      transparentNoise: this.transparentNoise.checked,
      tileable: this.tileableTexture.checked && !this.tileableTexture.disabled,
      mapType: this.mapTypeSelect.value || "color",
    };
    this.exportWidth.value = width;
    this.exportHeight.value = height;
  }

  applyOutputSize() {
    this.preview.setOutputSize(this.output.width, this.output.height);
  }

  markDirty() {
    this.syncOutputSettings();
    this.applyOutputSize();
    this.setBusy(false, "status.pending");
    this.preview.clear(t("status.clickGenerate"));
  }

  setBusy(isBusy, messageKey, values = {}) {
    this.generateButton.disabled = isBusy;
    this.randomizeParamsButton.disabled = isBusy;
    this.exportImageButton.disabled = isBusy;
    this.exportPackButton.disabled = isBusy;
    this.presetSelect.disabled = isBusy || !this.currentGenerator.getPresets?.().length;
    this.statusKey = messageKey;
    this.statusValues = values;
    this.statusLabel.textContent = t(messageKey, values);
  }

  renderPresets(generator) {
    const presets = generator.getPresets?.() || [];
    this.presetSelect.replaceChildren();
    const defaultOption = this.document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = t("defaultPreset");
    this.presetSelect.append(defaultOption);
    presets.forEach((preset, index) => {
      const option = this.document.createElement("option");
      option.value = String(index);
      option.textContent = translatePresetName(preset.name);
      this.presetSelect.append(option);
    });
    this.presetSelect.value = "";
    this.presetSelect.disabled = !presets.length;
  }

  syncGeneratorMeta(generator) {
    const meta = generator.getMeta?.() || {};
    this.generatorMetaLabel.textContent = translateMeta(meta);
    this.tileableTexture.disabled = !meta.supportsTileable;
    if (!meta.supportsTileable) {
      this.tileableTexture.checked = false;
    }
    const supportedMaps = meta.supportedMaps || ["color"];
    Array.from(this.mapTypeSelect.options).forEach((option) => {
      option.disabled = !supportedMaps.includes(option.value);
    });
    if (!supportedMaps.includes(this.mapTypeSelect.value)) {
      this.mapTypeSelect.value = "color";
    }
  }

  applyPreset(index) {
    if (index === "") {
      this.params = { ...this.currentGenerator.getDefaultParams() };
    } else {
      const preset = this.currentGenerator.getPresets?.()[Number(index)];
      if (!preset) return;
      this.params = { ...this.currentGenerator.getDefaultParams(), ...preset.params };
    }
    this.paramPanel.render(this.currentGenerator.getParamSchema(), this.params);
    this.markDirty();
  }

  randomizeParams() {
    const schema = this.currentGenerator.getParamSchema();
    const next = { ...this.params };
    schema.forEach((field) => {
      if (field.type === "range") {
        next[field.key] = this.randomRangeValue(field);
      } else if (field.type === "color") {
        next[field.key] = this.randomColor();
      } else if (field.key === "Seed") {
        next[field.key] = this.randomSeed();
      }
    });
    this.params = next;
    this.paramPanel.render(schema, this.params);
    this.markDirty();
  }

  refreshSeed() {
    const schema = this.currentGenerator.getParamSchema();
    if (!schema.some((field) => field.key === "Seed")) return;
    this.params = { ...this.params, Seed: this.randomSeed() };
    this.paramPanel.render(schema, this.params);
  }

  randomRangeValue(field) {
    const min = Number(field.min ?? 0);
    const max = Number(field.max ?? 1);
    const step = Number(field.step ?? 0.01);
    const raw = min + Math.random() * (max - min);
    const stepped = Math.round(raw / step) * step;
    const decimals = String(step).includes(".") ? String(step).split(".")[1].length : 0;
    return Number(Math.min(max, Math.max(min, stepped)).toFixed(decimals));
  }

  randomColor() {
    const value = Math.floor(Math.random() * 0xffffff);
    return `#${value.toString(16).padStart(6, "0")}`;
  }

  randomSeed() {
    return Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  }

  async exportImage() {
    const width = clampOutputSize(this.output.width);
    const height = clampOutputSize(this.output.height);
    const extension = this.exportFormat.value === "image/webp" ? "webp" : "png";
    const filename = `${this.currentGenerator.id}-${this.output.mapType}-${width}x${height}-${this.params.Seed || "seed"}.${extension}`;
    this.setBusy(true, "status.exporting");
    try {
      if (this.renderer.isAvailable()) {
        const blob = await this.renderer.exportImage(
          this.currentGenerator.id,
          this.params,
          width,
          height,
          0,
          this.output,
          this.exportFormat.value,
          this.output.mapType,
        );
        downloadBlob(blob, filename);
      } else {
        exportTexture(this.currentGenerator, this.params, this.output, this.exportFormat.value, this.output.mapType);
      }
      this.setBusy(false, "status.exported");
    } catch (error) {
      exportTexture(this.currentGenerator, this.params, this.output, this.exportFormat.value, this.output.mapType);
      this.setBusy(false, "status.workerExportFallback");
      console.warn(error);
    }
  }

  async exportPack() {
    const meta = this.currentGenerator.getMeta?.() || {};
    const maps = meta.supportedMaps || ["color"];
    this.setBusy(true, "status.exportingPack");
    try {
      if (this.renderer.isAvailable()) {
        const entries = [];
        const width = clampOutputSize(this.output.width);
        const height = clampOutputSize(this.output.height);
        const extension = this.exportFormat.value === "image/webp" ? "webp" : "png";
        for (let index = 0; index < maps.length; index += 1) {
          const mapType = maps[index];
          this.setBusy(true, "status.exportingMap", { current: index + 1, total: maps.length, mapType: translateMapType(mapType) });
          const filename = `${this.currentGenerator.id}-${mapType}-${width}x${height}-${this.params.Seed || "seed"}.${extension}`;
          const blob = await this.renderer.exportImage(this.currentGenerator.id, this.params, width, height, 0, this.output, this.exportFormat.value, mapType);
          entries.push({ name: filename, blob });
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        const zip = await createZipBlob(entries);
        downloadBlob(zip, `${this.currentGenerator.id}-texture-pack-${width}x${height}-${this.params.Seed || "seed"}.zip`);
      } else {
        await exportTexturePack(this.currentGenerator, this.params, this.output, this.exportFormat.value, (index, total, mapType) => {
          this.setBusy(true, "status.exportingMap", { current: index, total, mapType: translateMapType(mapType) });
        });
      }
      this.setBusy(false, "status.packExported");
    } catch (error) {
      this.setBusy(false, "status.packFailed");
      console.warn(error);
    }
  }
}
