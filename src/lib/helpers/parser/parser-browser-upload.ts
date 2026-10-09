import { getSupabaseBrowserClient } from "src/lib/integrations/supabase-client"
import { parserUploadMessages } from "src/lib/constants/parser-upload"
import { ParserUploadAuthorization } from "src/types/parser/parser-upload"

export async function uploadParserFilesDirectly(bucket: string, files: File[], uploads: ParserUploadAuthorization[]): Promise<void> {
  if (files.length !== uploads.length) throw new Error(parserUploadMessages.incompleteUpload)
  const supabase = getSupabaseBrowserClient()
  const bucketClient = supabase.storage.from(bucket)
  for (const [index, upload] of uploads.entries()) {
    const { error } = await bucketClient.uploadToSignedUrl(upload.path, upload.token, files[index], { contentType: upload.mimeType })
    if (error) throw new Error(parserUploadMessages.directUploadFailed)
  }
}
