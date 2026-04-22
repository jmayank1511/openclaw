import type {
  RealtimeTranscriptionProviderPlugin,
  RealtimeTranscriptionSession,
  RealtimeTranscriptionSessionCreateRequest,
} from "openclaw/plugin-sdk/realtime-transcription";
import { normalizeNvidiaAsrConfig, type NvidiaAsrConfig } from "./nvidia-speech-config.js";

class NvidiaRealtimeTranscriptionSession implements RealtimeTranscriptionSession {
  private inner: import("./parakeet-asr.runtime.js").ParakeetStreamingSession | null = null;

  constructor(
    private readonly asrConfig: NvidiaAsrConfig,
    private readonly req: RealtimeTranscriptionSessionCreateRequest,
  ) {}

  async connect(): Promise<void> {
    const { ParakeetStreamingSession } = await import("./parakeet-asr.runtime.js");
    this.inner = new ParakeetStreamingSession({
      apiKey: this.asrConfig.apiKey!,
      functionId: this.asrConfig.functionId,
      encoding: this.asrConfig.encoding,
      sampleRateHz: this.asrConfig.sampleRateHz,
      languageCode: this.asrConfig.languageCode,
      callbacks: {
        onPartial: this.req.onPartial,
        onTranscript: this.req.onTranscript,
        onError: this.req.onError,
      },
    });
    await this.inner.connect();
  }

  sendAudio(audio: Buffer): void {
    this.inner?.sendAudio(audio);
  }

  close(): void {
    this.inner?.close();
    this.inner = null;
  }

  isConnected(): boolean {
    return this.inner?.isConnected() ?? false;
  }
}

export function buildNvidiaRealtimeTranscriptionProvider(): RealtimeTranscriptionProviderPlugin {
  return {
    id: "nvidia",
    label: "NVIDIA Parakeet",
    autoSelectOrder: 20,

    resolveConfig: ({ rawConfig }) =>
      normalizeNvidiaAsrConfig(rawConfig as Record<string, unknown>),

    isConfigured: ({ providerConfig }) => {
      const c = normalizeNvidiaAsrConfig(providerConfig as Record<string, unknown>);
      return Boolean(c.apiKey);
    },

    createSession: (req: RealtimeTranscriptionSessionCreateRequest): RealtimeTranscriptionSession => {
      const c = normalizeNvidiaAsrConfig(req.providerConfig as Record<string, unknown>);
      return new NvidiaRealtimeTranscriptionSession(c, req);
    },
  };
}
