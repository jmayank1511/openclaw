import { createTtsClient, makeNvcfMetadata } from "./grpc-client.runtime.js";

type TtsRequest = {
  text: string;
  languageCode: string;
  encoding: "LINEAR_PCM" | "OGG_OPUS";
  sampleRateHz: number;
  voiceName: string;
};

type TtsResponse = {
  audio: Buffer | Uint8Array;
};

export type MagpieParams = {
  text: string;
  apiKey: string;
  functionId: string;
  voice: string;
  language: string;
  sampleRateHz: number;
  encoding: "LINEAR_PCM" | "OGG_OPUS";
  timeoutMs: number;
};

export async function magpieSynthesize(params: MagpieParams): Promise<Buffer> {
  const client = createTtsClient() as unknown as {
    Synthesize(
      req: TtsRequest,
      metadata: import("@grpc/grpc-js").Metadata,
      options: { deadline: Date },
      cb: (err: Error | null, res: TtsResponse) => void,
    ): void;
  };

  const metadata = makeNvcfMetadata(params.apiKey, params.functionId);
  const request: TtsRequest = {
    text: params.text,
    language_code: params.language,
    encoding: params.encoding,
    sample_rate_hz: params.sampleRateHz,
    voice_name: params.voice,
  } as unknown as TtsRequest;

  return new Promise((resolve, reject) => {
    client.Synthesize(
      request,
      metadata,
      { deadline: new Date(Date.now() + params.timeoutMs) },
      (err, res) => {
        if (err) {
          reject(new Error(`Magpie TTS gRPC error: ${err.message}`));
          return;
        }
        resolve(Buffer.from(res.audio));
      },
    );
  });
}
