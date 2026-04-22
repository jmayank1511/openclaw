import type { MediaUnderstandingProvider } from "openclaw/plugin-sdk/media-understanding";
import { NVCF_TDT_ASR_DEFAULT_FUNCTION_ID } from "./nvidia-speech-config.js";

const ENCODING_LINEAR_PCM = 1;
const ENCODING_FLAC = 2;
const ENCODING_OGGOPUS = 4;

function parseWavPcm(buf: Buffer): { pcm: Buffer; sampleRateHz: number } | null {
  if (buf.length < 44) {
    return null;
  }
  if (buf.subarray(0, 4).toString("ascii") !== "RIFF") {
    return null;
  }
  if (buf.subarray(8, 12).toString("ascii") !== "WAVE") {
    return null;
  }
  let offset = 12;
  let sampleRateHz: number | null = null;
  while (offset + 8 <= buf.length) {
    const id = buf.subarray(offset, offset + 4).toString("ascii");
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      sampleRateHz = buf.readUInt32LE(offset + 12);
    } else if (id === "data" && sampleRateHz !== null) {
      return { sampleRateHz, pcm: buf.subarray(offset + 8, offset + 8 + size) };
    }
    offset += 8 + size;
  }
  return null;
}

function resolveAudioParams(
  buffer: Buffer,
  mime: string | undefined,
  fileName: string,
): { encoding: number; sampleRateHz: number; audio: Buffer } {
  const lm = (mime ?? "").toLowerCase();
  const lf = fileName.toLowerCase();

  if (lm.includes("flac") || lf.endsWith(".flac")) {
    return { encoding: ENCODING_FLAC, sampleRateHz: 16_000, audio: buffer };
  }
  if (lm.includes("wav") || lm.includes("wave") || lf.endsWith(".wav")) {
    const parsed = parseWavPcm(buffer);
    if (parsed) {
      return {
        encoding: ENCODING_LINEAR_PCM,
        sampleRateHz: parsed.sampleRateHz,
        audio: parsed.pcm,
      };
    }
  }
  // OGG/Opus is the default: covers voice messages from Telegram, Discord, WhatsApp
  return { encoding: ENCODING_OGGOPUS, sampleRateHz: 48_000, audio: buffer };
}

export const nvidiaMediaUnderstandingProvider: MediaUnderstandingProvider = {
  id: "nvidia",
  capabilities: ["audio"],
  defaultModels: { audio: "nvidia/parakeet-tdt-1.1b-asr" },
  autoPriority: { audio: 25 },
  transcribeAudio: async (req) => {
    const { parakeetTdtRecognize } = await import("./parakeet-tdt.runtime.js");
    const functionId =
      process.env["NVIDIA_TDT_ASR_FUNCTION_ID"] ?? NVCF_TDT_ASR_DEFAULT_FUNCTION_ID;
    const { encoding, sampleRateHz, audio } = resolveAudioParams(
      req.buffer,
      req.mime,
      req.fileName,
    );
    const text = await parakeetTdtRecognize({
      apiKey: req.apiKey,
      functionId,
      audio,
      encoding,
      sampleRateHz,
      languageCode: req.language ?? "en-US",
      timeoutMs: req.timeoutMs,
    });
    return { text, model: "nvidia/parakeet-tdt-1.1b-asr" };
  },
};
