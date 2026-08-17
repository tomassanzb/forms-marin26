import { google } from "googleapis";
import { Readable } from "stream";

function getStorageAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ?.replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");

  if (!process.env.GOOGLE_CLIENT_EMAIL) throw new Error("Falta GOOGLE_CLIENT_EMAIL");
  if (!privateKey) throw new Error("Falta GOOGLE_PRIVATE_KEY");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/devstorage.read_write"],
  });
}

export async function uploadComprobante(file: File): Promise<string> {
  const auth = getStorageAuth();
  const storage = google.storage({ version: "v1", auth });

  const bucket = process.env.GOOGLE_STORAGE_BUCKET;
  if (!bucket) throw new Error("Falta GOOGLE_STORAGE_BUCKET en las env vars");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const stream = Readable.from([buffer]);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectName = `comprobantes/${timestamp}_${safeName}`;

  await storage.objects.insert({
    bucket,
    name: objectName,
    predefinedAcl: "publicRead",
    requestBody: {
      name: objectName,
      contentType: file.type || "application/octet-stream",
    },
    media: {
      mimeType: file.type || "application/octet-stream",
      body: stream,
    },
  });

  return `https://storage.googleapis.com/${bucket}/${objectName}`;
}
