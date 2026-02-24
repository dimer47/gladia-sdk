export interface AudioMetadata {
  id: string;
  filename: string;
  source: string;
  extension: string;
  size: number;
  audio_duration: number;
  number_of_channels: number;
}

export interface UploadResponse {
  audio_url: string;
  audio_metadata: AudioMetadata;
}
