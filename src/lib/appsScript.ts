/**
 * Sube un archivo a Google Drive via un Google Apps Script web app.
 * El script corre con tu cuenta Google (no el service account),
 * por lo que usa tu propio storage de Drive — sin costo.
 *
 * Apps Script necesario: ver /scripts/drive-upload.gs
 */

export async function uploadComprobante(file: File): Promise<string> {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) throw new Error("Falta GOOGLE_APPS_SCRIPT_URL en .env.local");

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const body = JSON.stringify({
    base64,
    mimeType: file.type || "application/octet-stream",
    filename: `${Date.now()}_${file.name}`,
  });

  // Apps Script devuelve 302 al "echo URL". redirect:"follow" convierte POST→GET,
  // pero necesitamos seguir manualmente para conservar los headers correctos.
  let res = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "manual",
  });

  if (res.status === 302 || res.status === 301 || res.status === 303) {
    const location = res.headers.get("location");
    if (!location) throw new Error("Apps Script 302 sin Location header");
    res = await fetch(location, { redirect: "manual" });

    // El echo URL puede tener una segunda redirección
    if (res.status === 302 || res.status === 301 || res.status === 303) {
      const location2 = res.headers.get("location");
      if (!location2) throw new Error("Apps Script echo 302 sin Location header");
      res = await fetch(location2, { redirect: "follow" });
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apps Script HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
  if (!data.ok) throw new Error(data.error ?? "Error en Apps Script");
  return data.url!;
}
