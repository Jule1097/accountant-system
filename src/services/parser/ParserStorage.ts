import { createSupabaseAdminClient } from "src/lib/integrations/supabase-server";
import { parserInternalMessages } from "src/lib/constants/parser";

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
      throw new Error(parserInternalMessages.storageOperationFailed);
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(this.bucketName).download(path);

    if (error || !data) {
      throw new Error(parserInternalMessages.storageOperationFailed);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async deleteFile(path: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(this.bucketName).remove([path]);

    if (error) {
      throw new Error(parserInternalMessages.storageOperationFailed);
    }
  }
}
