import type {
  SpeechProviderPlugin,
  SpeechSynthesisRequest,
  SpeechTelephonySynthesisRequest,
} from "openclaw/plugin-sdk/speech";
import { trimToUndefined } from "openclaw/plugin-sdk/speech";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_VOICE,
  normalizeNvidiaTtsConfig,
} from "./nvidia-speech-config.js";

const KNOWN_VOICES: readonly string[] = [
  "Magpie-Multilingual.EN-US.Aria",
  "Magpie-Multilingual.EN-US.Jason",
  "Magpie-Multilingual.EN-US.Leo",
  "Magpie-Multilingual.ES-US.Diego",
  "Magpie-Multilingual.DE-DE.Leo",
  "Magpie-Multilingual.FR-FR.Pascal",
  "Magpie-Multilingual.ZH-CN.Mia",
  "Magpie-Multilingual.HI-IN.Aarav",
  "Magpie-Multilingual.JA-JP.Hana",
];

// 44-byte RIFF/WAV header for 16-bit mono PCM
function wrapPcmInWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export function buildNvidiaSpeechProvider(): SpeechProviderPlugin {
  return {
    id: "nvidia",
    label: "NVIDIA Magpie",
    autoSelectOrder: 30,
    voices: KNOWN_VOICES,
    models: ["magpie-tts-multilingual", "magpie-tts-zeroshot"],

    resolveConfig: ({ rawConfig }) => normalizeNvidiaTtsConfig(rawConfig),

    resolveTalkOverrides: ({ params }) => ({
      ...(trimToUndefined(params.voiceId) == null
        ? {}
        : { voice: trimToUndefined(params.voiceId) }),
      ...(trimToUndefined(params.modelId) == null
        ? {}
        : { model: trimToUndefined(params.modelId) }),
    }),

    isConfigured: ({ providerConfig }) => {
      const c = normalizeNvidiaTtsConfig(providerConfig as Record<string, unknown>);
      return Boolean(c.apiKey);
    },

    synthesize: async (req: SpeechSynthesisRequest) => {
      const c = normalizeNvidiaTtsConfig(req.providerConfig as Record<string, unknown>);
      const ov = req.providerOverrides as Record<string, unknown> | undefined;
      const { magpieSynthesize } = await import("./magpie-tts.runtime.js");
      const pcm = await magpieSynthesize({
        text: req.text,
        apiKey: c.apiKey!,
        functionId: c.functionId,
        voice: trimToUndefined(ov?.voice) ?? c.voice ?? DEFAULT_VOICE,
        language: trimToUndefined(ov?.language) ?? c.language ?? DEFAULT_LANGUAGE,
        sampleRateHz: c.sampleRateHz,
        encoding: "LINEAR_PCM",
        timeoutMs: req.timeoutMs,
      });
      return {
        audioBuffer: wrapPcmInWav(pcm, c.sampleRateHz),
        outputFormat: "wav",
        fileExtension: ".wav",
        voiceCompatible: true,
      };
    },

    synthesizeTelephony: async (req: SpeechTelephonySynthesisRequest) => {
      const c = normalizeNvidiaTtsConfig(req.providerConfig as Record<string, unknown>);
      const { magpieSynthesize } = await import("./magpie-tts.runtime.js");
      const pcm = await magpieSynthesize({
        text: req.text,
        apiKey: c.apiKey!,
        functionId: c.functionId,
        voice: c.voice ?? DEFAULT_VOICE,
        language: c.language ?? DEFAULT_LANGUAGE,
        sampleRateHz: 22_050,
        encoding: "LINEAR_PCM",
        timeoutMs: req.timeoutMs,
      });
      return { audioBuffer: pcm, outputFormat: "pcm_22050", sampleRate: 22_050 };
    },
  };
}
