import { createSupabaseAdminClient } from "src/lib/integrations/supabase-server";
import { parserInternalMessages, parserStorageEnvironmentVariables } from "src/lib/constants/parser";
import { ParserStoredFileMetadata } from "src/types/parser/parser-upload";
import { httpStatusCodes } from "src/lib/constants/http";

function getParserTempBucket(): string {
  const value = process.env[parserStorageEnvironmentVariables.tempBucket];

  if (!value) {
    throw new Error(`Missing ${parserStorageEnvironmentVariables.tempBucket}`);
  }

  return value;
}

export class ParserStorageService {
  private readonly bucketName: string;

  constructor() {
    this.bucketName = getParserTempBucket();
  }

  getBucketName(): string {
    return this.bucketName;
  }

  async createSignedUploadUrl(path: string): Promise<{ path: string; token: string }> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(this.bucketName).createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) throw new Error(parserInternalMessages.storageOperationFailed);

    return { path: data.path, token: data.token };
  }

  async getFileMetadata(path: string): Promise<ParserStoredFileMetadata | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(this.bucketName).info(path);
    const errorStatus = error && "status" in error && typeof error.status === "number" ? error.status : undefined;

    if (errorStatus === httpStatusCodes.notFound || errorStatus === httpStatusCodes.badRequest || (!error && !data)) return null;
    if (error || !data || typeof data.size !== "number" || typeof data.contentType !== "string") throw new Error(parserInternalMessages.storageOperationFailed);

    return { fileSize: data.size, mimeType: data.contentType };
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
