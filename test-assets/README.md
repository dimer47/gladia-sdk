# Private manual test assets

This directory is a local workspace for real-service tests. Its media and result files are ignored
by Git and must never be committed.

The manual runner uses these default inputs:

- `audio/pre-recorded.m4a`: input for upload and pre-recorded transcription;
- `audio/live-16khz-mono.wav`: 16 kHz, mono, 16-bit PCM WAV input for Live streaming.

You may use other formats accepted by Gladia for the pre-recorded input. Generate the Live input
from the same recording with FFmpeg:

```bash
ffmpeg -i /path/to/audio.m4a -ar 16000 -ac 1 -c:a pcm_s16le \
  test-assets/audio/live-16khz-mono.wav
```

Alternatively, keep both files anywhere outside the repository:

```bash
npm run manual:e2e -- \
  --prerecorded /absolute/path/to/audio.m4a \
  --live /absolute/path/to/audio-16khz-mono.wav
```

Run `npm run manual:e2e -- --help` for the complete usage summary. Test results are written beneath
`test-assets/results/` and remain ignored.
