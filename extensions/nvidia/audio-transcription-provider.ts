import {
  transcribeOpenAiCompatibleAudio,
  type MediaUnderstandingProvider,
} from "openclaw/plugin-sdk/media-understanding";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_NVIDIA_AUDIO_MODEL = "nvidia/parakeet-tdt-1.1b-asr";

export const nvidiaMediaUnderstandingProvider: MediaUnderstandingProvider = {
  id: "nvidia",
  capabilities: ["audio"],
  defaultModels: { audio: DEFAULT_NVIDIA_AUDIO_MODEL },
  autoPriority: { audio: 25 },
  transcribeAudio: (req) =>
    transcribeOpenAiCompatibleAudio({
      ...req,
      baseUrl: req.baseUrl ?? NVIDIA_BASE_URL,
      defaultBaseUrl: NVIDIA_BASE_URL,
      defaultModel: DEFAULT_NVIDIA_AUDIO_MODEL,
    }),
};
