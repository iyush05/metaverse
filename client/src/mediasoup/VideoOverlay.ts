export class VideoOverlay {
  private container: HTMLDivElement;
  private videoElements: Map<string, HTMLVideoElement> = new Map();
  private localVideoElement: HTMLVideoElement | null = null;

  constructor(containerId = "video-overlay") {
    this.container = document.getElementById(containerId) as HTMLDivElement;
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = containerId;
      Object.assign(this.container.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: "1000",
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
      });
      document.body.appendChild(this.container);
    }
  }

  addLocalStream(stream: MediaStream): void {
    if (this.localVideoElement) return;

    const wrapper = this.createVideoWrapper("You", true);
    const video = wrapper.querySelector("video")!;
    video.srcObject = stream;
    video.muted = true; // mute self
    this.container.prepend(wrapper);
    this.localVideoElement = video;
  }

  addStream(socketId: string, stream: MediaStream, kind: string, playerName?: string): void {
    if (kind === "audio") {
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      return;
    }

    if (this.videoElements.has(socketId)) return;

    const wrapper = this.createVideoWrapper(playerName || `Player ${socketId.slice(0, 6)}`);
    const video = wrapper.querySelector("video")!;
    video.srcObject = stream;
    wrapper.id = `video-wrapper-${socketId}`;
    this.container.appendChild(wrapper);
    this.videoElements.set(socketId, video);
  }

  removeStream(socketId: string): void {
    const wrapper = document.getElementById(`video-wrapper-${socketId}`);
    wrapper?.remove();
    this.videoElements.delete(socketId);
  }


  clear(): void {
    this.videoElements.forEach((_, socketId) => {
      const wrapper = document.getElementById(`video-wrapper-${socketId}`);
      wrapper?.remove();
    });
    this.videoElements.clear();

    if (this.localVideoElement) {
      this.localVideoElement.closest(".video-overlay-wrapper")?.remove();
      this.localVideoElement = null;
    }
  }

  show(): void {
    this.container.style.display = "flex";
  }

  hide(): void {
    this.container.style.display = "none";
  }

  private createVideoWrapper(label: string, isLocal = false): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "video-overlay-wrapper";
    wrapper.style.cssText = `
      position: relative;
      width: ${isLocal ? "120px" : "160px"};
      border-radius: 12px;
      overflow: hidden;
      background: #111;
      border: 2px solid ${isLocal ? "#6366f1" : "#4ade80"};
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = isLocal;
    video.style.cssText = "width: 100%; display: block;";

    const labelEl = document.createElement("div");
    labelEl.textContent = label;
    labelEl.style.cssText = `
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 4px 8px;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
      color: white; font-size: 11px;
      font-family: 'Inter', system-ui, monospace;
      letter-spacing: 0.03em;
    `;

    wrapper.appendChild(video);
    wrapper.appendChild(labelEl);
    return wrapper;
  }
}