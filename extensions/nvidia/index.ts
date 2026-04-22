import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { buildNvidiaProvider } from "./provider-catalog.js";
import { buildNvidiaSpeechProvider } from "./speech-provider.js";
import { buildNvidiaRealtimeTranscriptionProvider } from "./realtime-transcription-provider.js";

export default definePluginEntry({
  id: "nvidia",
  name: "NVIDIA Provider",
  description: "Bundled NVIDIA provider plugin",
  register(api) {
    api.registerProvider(buildNvidiaProvider());
    api.registerSpeechProvider(buildNvidiaSpeechProvider());
    api.registerRealtimeTranscriptionProvider(buildNvidiaRealtimeTranscriptionProvider());
  },
});
