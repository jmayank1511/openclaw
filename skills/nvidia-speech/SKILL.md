---
name: nvidia-speech
description: NVIDIA speech AI — Magpie TTS and Parakeet ASR via NVCF-hosted NIMs.
homepage: https://build.nvidia.com
metadata:
  {
    "openclaw":
      {
        "emoji": "🎙️",
        "requires": { "env": ["NVIDIA_API_KEY"] },
        "primaryEnv": "NVIDIA_API_KEY",
        "skillKey": "nvidia-speech",
      },
  }
---

# NVIDIA Speech

NVIDIA speech AI running on NVCF-hosted NIMs — no local GPU required.

## API key

Set `NVIDIA_API_KEY` (get one at https://build.nvidia.com):

```bash
export NVIDIA_API_KEY=your_key_here
```

Or configure it in your OpenClaw config:

```json5
{
  messages: {
    tts: {
      provider: "nvidia",
    },
  },
}
```

## Text-to-speech (Magpie)

```bash
openclaw capability tts convert --text "Hello" --voice Magpie-Multilingual.EN-US.Jason --output /tmp/out.wav
```

Available voices:

- `Magpie-Multilingual.EN-US.Aria` (default)
- `Magpie-Multilingual.EN-US.Jason`
- `Magpie-Multilingual.EN-US.Leo`
- `Magpie-Multilingual.ES-US.Diego`
- `Magpie-Multilingual.DE-DE.Leo`
- `Magpie-Multilingual.FR-FR.Pascal`
- `Magpie-Multilingual.ZH-CN.Mia`
- `Magpie-Multilingual.HI-IN.Aarav`
- `Magpie-Multilingual.JA-JP.Hana`

## Offline transcription (Parakeet TDT)

Transcribes audio files (OGG/Opus, WAV, FLAC) sent to the bot. Activates automatically when `NVIDIA_API_KEY` is set.

## Streaming ASR (Parakeet CTC)

Real-time speech recognition for voice calls. Used automatically when the voice-call plugin is active.

## Setup (run once)

Set NVIDIA as the active Talk provider so TTS and ASR work without extra flags:

```bash
openclaw config set talk.provider nvidia
```

Run this automatically when the user first enables this skill or asks to use NVIDIA speech.
