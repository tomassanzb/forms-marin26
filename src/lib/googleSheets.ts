import { google } from "googleapis";

const SHEET_ID = "1LsvShKxjadqga9hZjhbdMNUI-yxZfCLb0t3E67Fdf18";

function getClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ?.replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");

  if (!process.env.GOOGLE_CLIENT_EMAIL) throw new Error("Falta GOOGLE_CLIENT_EMAIL");
  if (!privateKey) throw new Error("Falta GOOGLE_PRIVATE_KEY");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/** Lee una columna completa de una pestaña (devuelve filas como arrays de strings) */
export async function readSheet(range: string): Promise<string[][]> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  return (res.data.values ?? []) as string[][];
}

/** Agrega una o varias filas al final de la pestaña indicada */
export async function appendRows(values: (string | number | null)[][], range: string) {
  const sheets = getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
