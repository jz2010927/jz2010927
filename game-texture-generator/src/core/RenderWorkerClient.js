export class RenderWorkerClient {
  constructor() {
    this.nextJobId = 1;
    this.pending = new Map();
    this.worker = null;
  }

  isAvailable() {
    return Boolean(window.Worker && window.Blob && window.URL && window.__GTL_WORKER_SOURCE__);
  }

  renderPreview(generatorId, params, width, height, time, output, mapType = "color") {
    return this.request("preview", { generatorId, params, width, height, time, output, mapType }, [width, height]);
  }

  exportImage(generatorId, params, width, height, time, output, mimeType, mapType = "color") {
    return this.request("export", { generatorId, params, width, height, time, output, mimeType, mapType }, [width, height]);
  }

  request(type, payload, size) {
    if (!this.worker) {
      this.worker = this.createWorker();
    }
    if (!this.worker) {
      return Promise.reject(new Error("Worker is not available"));
    }
    const [width, height] = size;
    const jobId = this.nextJobId;
    this.nextJobId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(jobId, { resolve, reject });
      this.worker.postMessage({ jobId, type, ...payload, width, height });
    });
  }

  createWorker() {
    if (!window.Worker || !window.Blob || !window.URL || !window.__GTL_WORKER_SOURCE__) {
      return null;
    }
    try {
      const blob = new Blob([window.__GTL_WORKER_SOURCE__], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = (event) => {
        const { jobId, ok, result, error } = event.data;
        const entry = this.pending.get(jobId);
        if (!entry) return;
        this.pending.delete(jobId);
        if (ok) {
          entry.resolve(result);
        } else {
          entry.reject(new Error(error || "Render worker failed"));
        }
      };
      worker.onerror = (event) => {
        const error = new Error(event.message || "Render worker error");
        this.pending.forEach((entry) => entry.reject(error));
        this.pending.clear();
      };
      return worker;
    } catch {
      return null;
    }
  }
}
