import { NextResponse } from "next/server";

export async function GET() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return NextResponse.json({
      ok: false,
      error: "Falta GOOGLE_APPS_SCRIPT_URL en .env.local",
    });
  }

  try {
    // Prueba: sube un archivo de texto mínimo
    const base64 = Buffer.from("test comprobante").toString("base64");

    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64,
        mimeType: "text/plain",
        filename: "test_diagnostico.txt",
      }),
      redirect: "follow",
    });

    const data = await res.json();
    return NextResponse.json({ ok: data.ok, url: data.url, error: data.error });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
