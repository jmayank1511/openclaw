import { normalizeResolvedSecretInputString } from "openclaw/plugin-sdk/secret-input";
import { asObject, asFiniteNumber, trimToUndefined } from "openclaw/plugin-sdk/speech";

export const NVCF_ASR_DEFAULT_FUNCTION_ID = "1598d209-5e27-4d3c-8079-4751568b1081";
export const NVCF_TDT_ASR_DEFAULT_FUNCTION_ID = "d3fe9151-442b-4204-a70d-5fcc597fd610";
export const NVCF_TTS_DEFAULT_FUNCTION_ID = "877104f7-e885-42b9-8de8-f6e4c6303969";
export const DEFAULT_VOICE = "Magpie-Multilingual.EN-US.Aria";
export const DEFAULT_LANGUAGE = "en-US";

export type NvidiaTtsConfig = {
  apiKey: string | undefined;
  functionId: string;
  voice: string;
  language: string;
  sampleRateHz: number;
};

export type NvidiaAsrConfig = {
  apiKey: string | undefined;
  functionId: string;
  encoding: "MULAW" | "LINEAR_PCM";
  sampleRateHz: number;
  languageCode: string;
};

export function normalizeNvidiaTtsConfig(rawConfig: Record<string, unknown>): NvidiaTtsConfig {
  const providers = asObject(rawConfig.providers);
  const raw = asObject(providers?.["nvidia"]) ?? asObject(rawConfig["nvidia"]) ?? rawConfig;
  return {
    apiKey:
      normalizeResolvedSecretInputString({
        value: raw?.apiKey,
        path: "messages.tts.providers.nvidia.apiKey",
      }) ?? process.env["NVIDIA_API_KEY"],
    functionId:
      trimToUndefined(asObject(raw?.tts)?.functionId) ??
      trimToUndefined(raw?.functionId) ??
      NVCF_TTS_DEFAULT_FUNCTION_ID,
    voice: trimToUndefined(raw?.voice) ?? DEFAULT_VOICE,
    language: trimToUndefined(raw?.language) ?? DEFAULT_LANGUAGE,
    sampleRateHz: asFiniteNumber(raw?.sampleRateHz) ?? 22_050,
  };
}

export function normalizeNvidiaAsrConfig(rawConfig: Record<string, unknown>): NvidiaAsrConfig {
  const raw = asObject(rawConfig?.["nvidia"]) ?? rawConfig;
  const encodingRaw = trimToUndefined(raw?.encoding);
  const encoding: "MULAW" | "LINEAR_PCM" = encodingRaw === "LINEAR_PCM" ? "LINEAR_PCM" : "MULAW";
  return {
    apiKey:
      normalizeResolvedSecretInputString({
        value: raw?.apiKey,
        path: "plugins.entries.voice-call.config.streaming.providers.nvidia.apiKey",
      }) ?? process.env["NVIDIA_API_KEY"],
    functionId: trimToUndefined(raw?.functionId) ?? NVCF_ASR_DEFAULT_FUNCTION_ID,
    encoding,
    sampleRateHz: asFiniteNumber(raw?.sampleRateHz) ?? 8_000,
    languageCode: trimToUndefined(raw?.languageCode) ?? DEFAULT_LANGUAGE,
  };
}
