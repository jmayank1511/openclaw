import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { nvidiaMediaUnderstandingProvider } from "./audio-transcription-provider.js";
import { buildNvidiaProvider } from "./provider-catalog.js";
import { buildNvidiaRealtimeTranscriptionProvider } from "./realtime-transcription-provider.js";
import { buildNvidiaSpeechProvider } from "./speech-provider.js";

const PROVIDER_ID = "nvidia";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "NVIDIA Provider",
  description: "Bundled NVIDIA provider plugin",
  provider: {
    label: "NVIDIA",
    docsPath: "/providers/nvidia",
    envVars: ["NVIDIA_API_KEY"],
    auth: [],
    catalog: {
      buildProvider: buildNvidiaProvider,
    },
  },
  register(api) {
    api.registerSpeechProvider(buildNvidiaSpeechProvider());
    api.registerRealtimeTranscriptionProvider(buildNvidiaRealtimeTranscriptionProvider());
    api.registerMediaUnderstandingProvider(nvidiaMediaUnderstandingProvider);
  },
});
