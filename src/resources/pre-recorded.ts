import type { HttpClient } from '../http.js';
import type { PaginationParams, PaginatedResponse } from '../types/common.js';
import type {
  PreRecordedRequest,
  PreRecordedCreatedResponse,
  PreRecordedResponse,
} from '../types/pre-recorded.js';
import { poll, isTerminalStatus } from '../utils/polling.js';
import { UploadResource } from './upload.js';

export interface TranscribeOptions extends PreRecordedRequest {
  /** Called on each poll with the current response */
  onPoll?: (response: PreRecordedResponse) => void;
  /** Maximum polling time in ms */
  pollTimeout?: number;
  signal?: AbortSignal;
}

export interface PollTranscriptionOptions {
  onPoll?: (response: PreRecordedResponse) => void;
  timeout?: number | null;
  signal?: AbortSignal;
}

export class PreRecordedResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a pre-recorded transcription job.
   */
  async create(
    request: PreRecordedRequest,
    signal?: AbortSignal,
  ): Promise<PreRecordedCreatedResponse> {
    return this.http.post<PreRecordedCreatedResponse>('/v2/pre-recorded', request, signal);
  }

  /**
   * Get a pre-recorded transcription by ID.
   */
  async get(id: string, signal?: AbortSignal): Promise<PreRecordedResponse> {
    return this.http.get<PreRecordedResponse>(`/v2/pre-recorded/${id}`, undefined, signal);
  }

  /**
   * List pre-recorded transcriptions with pagination.
   */
  async list(
    params?: PaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<PreRecordedResponse>> {
    return this.http.get<PaginatedResponse<PreRecordedResponse>>(
      '/v2/pre-recorded',
      params as Record<string, unknown>,
      signal,
    );
  }

  /**
   * Delete a pre-recorded transcription.
   */
  async delete(id: string, signal?: AbortSignal): Promise<void> {
    return this.http.delete(`/v2/pre-recorded/${id}`, signal);
  }

  /**
   * Download the original audio file for a transcription.
   */
  async getFile(id: string, signal?: AbortSignal): Promise<Blob> {
    return this.http.getBlob(`/v2/pre-recorded/${id}/file`, signal);
  }

  /**
   * High-level helper: create a job and poll until completion.
   */
  async transcribe(options: TranscribeOptions): Promise<PreRecordedResponse> {
    const { onPoll, pollTimeout, signal, ...request } = options;

    const created = await this.create(request, signal);

    return this.poll(created.id, { onPoll, timeout: pollTimeout, signal });
  }

  /** Upload a local source when needed, then create and poll the transcription. */
  async transcribeSource(
    source: string | Blob | Uint8Array,
    request: Omit<PreRecordedRequest, 'audio_url'> = {},
    options: PollTranscriptionOptions = {},
  ): Promise<PreRecordedResponse> {
    const isUrl = typeof source === 'string' && /^https?:\/\//i.test(source);
    const audioUrl = isUrl
      ? (source as string)
      : (await new UploadResource(this.http).fromFile(source, 'audio', options.signal)).audio_url;
    return this.createAndPoll({ ...request, audio_url: audioUrl }, options);
  }

  async createAndPoll(
    request: PreRecordedRequest,
    options: PollTranscriptionOptions = {},
  ): Promise<PreRecordedResponse> {
    const created = await this.create(request, options.signal);
    return this.poll(created.id, options);
  }

  async poll(id: string, options: PollTranscriptionOptions = {}): Promise<PreRecordedResponse> {
    const result = await poll<PreRecordedResponse>({
      fn: () => this.get(id, options.signal),
      isDone: (response) => isTerminalStatus(response.status),
      onPoll: options.onPoll,
      timeout: options.timeout === null ? undefined : (options.timeout ?? 7_200_000),
      signal: options.signal,
    });
    if (result.status === 'error') {
      throw new Error(
        `Pre-recorded job ${id} failed with error code: ${result.error_code ?? 'unknown'}`,
      );
    }
    return result;
  }
}
