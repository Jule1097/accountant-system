import { createSupabaseAdminClient } from "src/lib/supabase-server";

function getParserTempBucket(): string {
  const value = process.env.VOUCHER_PARSER_TEMP_BUCKET;

  if (!value) {
    throw new Error("Missing VOUCHER_PARSER_TEMP_BUCKET");
  }

  return value;
}

export class ParserStorageService {
  private readonly bucketName: string;

  constructor() {
    this.bucketName = getParserTempBucket();
  }

  async uploadFile(path: string, buffer: Buffer, mimeType: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(this.bucketName).upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Failed to upload parser file: ${error.message}`);
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(this.bucketName).download(path);

    if (error || !data) {
      throw new Error(`Failed to download parser file: ${error?.message || "missing file"}`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async deleteFile(path: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(this.bucketName).remove([path]);

    if (error) {
      throw new Error(`Failed to delete parser file: ${error.message}`);
    }
  }
}
