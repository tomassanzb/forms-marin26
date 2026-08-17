import { google } from "googleapis";
import { Readable } from "stream";

function getDriveAuth() {
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
    // drive (no drive.file) para poder crear archivos en carpetas compartidas con el service account
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

export async function uploadComprobante(file: File): Promise<string> {
  const auth = getDriveAuth();
  const drive = google.drive({ version: "v3", auth });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // Readable.from([buffer]) emite el buffer como un único chunk (más confiable que iterar bytes)
  const stream = Readable.from([buffer]);

  const timestamp = new Date()
    .toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
    .replace(/[/:, ]/g, "-");

  const nombre = `${timestamp}_${file.name}`;

  const metadata: { name: string; parents?: string[] } = { name: nombre };
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    metadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
  }

  const res = await drive.files.create({
    requestBody: metadata,
    media: {
      mimeType: file.type || "application/octet-stream",
      body: stream,
    },
    fields: "id,webViewLink",
  });

  const fileId = res.data.id;
  if (!fileId) throw new Error("Drive no devolvió un fileId");

  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return res.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}
