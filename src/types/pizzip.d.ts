declare module 'pizzip' {
  interface PizZipFile {
    asText(): string;
  }

  export default class PizZip {
    constructor(data?: ArrayBuffer | Uint8Array | string, options?: Record<string, unknown>);
    file(name: string): PizZipFile | null;
    file(name: string, content: string): PizZip;
    generate(options: { type: 'blob'; mimeType?: string }): Blob;
    generate(options: { type: 'uint8array' }): Uint8Array;
  }
}
