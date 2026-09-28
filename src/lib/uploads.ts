import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const SAFE_FILENAME = /^[A-Za-z0-9_-]+\.(png|jpe?g|webp|gif)$/i;

export function isSafeUploadFilename(filename: string): boolean {
  return SAFE_FILENAME.test(filename) && !filename.includes("..");
}

export function logoContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/png";
  }
}
