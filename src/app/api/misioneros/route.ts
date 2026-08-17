import { NextResponse } from "next/server";
import { readSheet } from "@/lib/googleSheets";

// Revalida cada 5 minutos (útil si agregan misioneros al sheet sin redesplegar)
export const revalidate = 300;

export async function GET() {
  try {
    // Pestaña "Misioneros", columna A — fila 1 es encabezado ("Nombre"), datos desde A2
    const rows = await readSheet("Misioneros!A2:A");
    const misioneros = rows
      .map((r) => r[0]?.trim())
      .filter(Boolean);

    return NextResponse.json({ misioneros });
  } catch (error) {
    console.error("[misioneros]", error);
    return NextResponse.json({ misioneros: [] }, { status: 500 });
  }
}
