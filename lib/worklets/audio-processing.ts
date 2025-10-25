/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const AudioRecordingWorklet = `
class AudioProcessingWorklet extends AudioWorkletProcessor {
  // Buffer to hold outgoing int16 samples
  buffer = new Int16Array(2048);
  bufferWriteIndex = 0;

  // Resampling state
  _resampleRatio = 1;
  _resampleBuffer = null; // Stores leftover float32 samples between process calls

  constructor(options) {
    super();
    this.hasAudio = false;

    if (options && options.processorOptions) {
      const { targetSampleRate, sourceSampleRate } = options.processorOptions;
      if (sourceSampleRate && targetSampleRate && sourceSampleRate !== targetSampleRate) {
        this._resampleRatio = sourceSampleRate / targetSampleRate;
      }
    }
  }

  /**
   * @param inputs Float32Array[][] [input#][channel#][sample#]
   */
  process(inputs) {
    // Use the first channel of the first input
    if (inputs[0] && inputs[0][0]) {
      const channel0 = inputs[0][0];
      this.processChunk(channel0);
    }
    return true;
  }

  sendAndClearBuffer() {
    if (this.bufferWriteIndex > 0) {
      this.port.postMessage({
        event: 'chunk',
        data: {
          int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
        },
      });
      this.bufferWriteIndex = 0;
    }
  }

  /**
   * Resamples audio data using simple linear interpolation.
   * @param {Float32Array} inputBuffer The buffer to resample.
   * @returns {Float32Array} The resampled buffer.
   */
  resample(inputBuffer) {
    if (this._resampleRatio === 1) {
      return inputBuffer;
    }

    // Prepend leftover samples from the previous block to ensure smooth transition
    if (this._resampleBuffer) {
      const temp = new Float32Array(this._resampleBuffer.length + inputBuffer.length);
      temp.set(this._resampleBuffer, 0);
      temp.set(inputBuffer, this._resampleBuffer.length);
      inputBuffer = temp;
      this._resampleBuffer = null;
    }

    const outputLength = Math.floor(inputBuffer.length / this._resampleRatio);
    if (outputLength === 0) {
      // Not enough data to produce a new sample, so store it for the next call
      this._resampleBuffer = inputBuffer;
      return new Float32Array(0);
    }

    const outputBuffer = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * this._resampleRatio;
      const indexPrev = Math.floor(inputIndex);
      const indexNext = Math.min(indexPrev + 1, inputBuffer.length - 1);
      const fraction = inputIndex - indexPrev;

      // Linear interpolation
      outputBuffer[i] =
        inputBuffer[indexPrev] +
        (inputBuffer[indexNext] - inputBuffer[indexPrev]) * fraction;
    }

    // Store any leftover samples that didn't form a full output sample
    const leftoverIndex = outputLength * this._resampleRatio;
    if (leftoverIndex < inputBuffer.length) {
      this._resampleBuffer = inputBuffer.slice(Math.floor(leftoverIndex));
    }

    return outputBuffer;
  }

  /**
   * Processes a chunk of float32 audio data: resamples it, converts to int16,
   * and buffers it to be sent.
   * @param {Float32Array} float32Array The input audio chunk.
   */
  processChunk(float32Array) {
    const resampled = this.resample(float32Array);

    if (resampled.length === 0) {
      return;
    }

    for (let i = 0; i < resampled.length; i++) {
      // Convert float32 from -1 to 1 into int16 from -32768 to 32767
      const int16Value = Math.max(-32768, Math.min(32767, resampled[i] * 32768));
      this.buffer[this.bufferWriteIndex++] = int16Value;
      if (this.bufferWriteIndex >= this.buffer.length) {
        this.sendAndClearBuffer();
      }
    }
  }
}
`;

export default AudioRecordingWorklet;