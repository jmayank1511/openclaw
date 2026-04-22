import { createAsrClient, makeNvcfMetadata } from "./grpc-client.runtime.js";

type RecognizeResponse = {
  results: Array<{
    alternatives: Array<{ transcript: string }>;
  }>;
};

type UnaryCall = {
  Recognize(
    request: unknown,
    metadata: import("@grpc/grpc-js").Metadata,
    options: { deadline: Date },
    callback: (err: Error | null, res: RecognizeResponse) => void,
  ): void;
};

export type ParakeetTdtRecognizeParams = {
  apiKey: string;
  functionId: string;
  audio: Buffer;
  encoding: number;
  sampleRateHz: number;
  languageCode: string;
  timeoutMs: number;
};

export async function parakeetTdtRecognize(params: ParakeetTdtRecognizeParams): Promise<string> {
  const client = createAsrClient() as unknown as UnaryCall;
  const metadata = makeNvcfMetadata(params.apiKey, params.functionId);

  return new Promise((resolve, reject) => {
    client.Recognize(
      {
        config: {
          encoding: params.encoding,
          sample_rate_hertz: params.sampleRateHz,
          language_code: params.languageCode,
          max_alternatives: 1,
          enable_automatic_punctuation: true,
        },
        audio: params.audio,
      },
      metadata,
      { deadline: new Date(Date.now() + params.timeoutMs) },
      (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res?.results?.[0]?.alternatives?.[0]?.transcript ?? "");
      },
    );
  });
}
