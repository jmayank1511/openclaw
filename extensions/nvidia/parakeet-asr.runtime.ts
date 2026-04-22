import type { RealtimeTranscriptionSessionCallbacks } from "openclaw/plugin-sdk/realtime-transcription";
import { createAsrClient, makeNvcfMetadata } from "./grpc-client.runtime.js";

type StreamingCall = {
  write(req: unknown): void;
  end(): void;
  on(event: "data", cb: (res: StreamingResponse) => void): void;
  on(event: "error", cb: (err: Error) => void): void;
  on(event: "end", cb: () => void): void;
};

type StreamingResponse = {
  results: Array<{
    alternatives: Array<{ transcript: string }>;
    isFinal: boolean;
  }>;
};

export type ParakeetConfig = {
  apiKey: string;
  functionId: string;
  encoding: "MULAW" | "LINEAR_PCM";
  sampleRateHz: number;
  languageCode: string;
  callbacks: RealtimeTranscriptionSessionCallbacks;
};

export class ParakeetStreamingSession {
  private call: StreamingCall | null = null;
  private _connected = false;

  constructor(private readonly config: ParakeetConfig) {}

  async connect(): Promise<void> {
    const client = createAsrClient() as unknown as {
      StreamingRecognize(metadata: import("@grpc/grpc-js").Metadata): StreamingCall;
    };
    const metadata = makeNvcfMetadata(this.config.apiKey, this.config.functionId);
    this.call = client.StreamingRecognize(metadata);

    this.call.write({
      streamingConfig: {
        config: {
          encoding: this.config.encoding,
          sampleRateHertz: this.config.sampleRateHz,
          languageCode: this.config.languageCode,
          enableAutomaticPunctuation: true,
          maxAlternatives: 1,
        },
        interimResults: true,
      },
    });

    this.call.on("data", (response) => {
      for (const result of response.results ?? []) {
        const text = result.alternatives?.[0]?.transcript ?? "";
        if (!text) {
          continue;
        }
        if (result.isFinal) {
          this.config.callbacks.onTranscript?.(text);
        } else {
          this.config.callbacks.onPartial?.(text);
        }
      }
    });

    this.call.on("error", (err) => {
      this._connected = false;
      this.config.callbacks.onError?.(err);
    });

    this.call.on("end", () => {
      this._connected = false;
    });

    this._connected = true;
  }

  sendAudio(audio: Buffer): void {
    if (!this._connected || !this.call) {
      return;
    }
    this.call.write({ audioContent: audio });
  }

  close(): void {
    this._connected = false;
    this.call?.end();
    this.call = null;
  }

  isConnected(): boolean {
    return this._connected;
  }
}
