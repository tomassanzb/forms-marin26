import { NextRequest, NextResponse } from "next/server";
import { appendRows } from "@/lib/googleSheets";
import { uploadComprobante } from "@/lib/appsScript";

interface Entrada {
  nombre: string;
  apellido: string;
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();

    const misionero = fd.get("misionero") as string;
    const entradas: Entrada[] = JSON.parse(fd.get("entradas") as string);
    const cantidad = Number(fd.get("cantidad"));
    const montoTotal = Number(fd.get("monto_total"));
    const asistentes = Number(fd.get("asistentes") ?? cantidad);
    const archivo = fd.get("comprobante") as File | null;

    if (!misionero || !entradas?.length || !cantidad || !montoTotal) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    // Subir comprobante a Google Drive
    let comprobanteUrl = "";
    let driveOk = true;
    if (archivo && archivo.size > 0) {
      try {
        comprobanteUrl = await uploadComprobante(archivo);
      } catch (driveError: unknown) {
        driveOk = false;
        const msg = driveError instanceof Error ? driveError.message : String(driveError);
        console.error("[Drive upload error]", msg, driveError);
        comprobanteUrl = `ERROR AL SUBIR: ${msg.slice(0, 120)}`;
      }
    }

    const idRegistro = crypto.randomUUID().slice(0, 8).toUpperCase();
    const timestamp = new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
    });

    // Tabla Pagos: un registro por compra
    const filaPago = [
      timestamp,       // A: Timestamp
      idRegistro,      // B: ID Registro
      misionero,       // C: Misionero
      cantidad,        // D: Cantidad
      montoTotal,      // E: Monto Total
      comprobanteUrl,  // F: Comprobante URL
      "Pendiente",     // G: Estado
      asistentes,      // H: Confirmados
    ];

    // Tabla Asistentes: un registro por entrada
    const filasAsistentes = entradas.map((e, i) => [
      idRegistro,  // A: ID Registro
      e.nombre,    // B: Nombre
      e.apellido,  // C: Apellido
      i + 1,       // D: Nro. Entrada
    ]);

    await Promise.all([
      appendRows([filaPago], "Pagos!A:H"),
      appendRows(filasAsistentes, "Asistentes!A:D"),
    ]);

    return NextResponse.json({ ok: true, driveOk });
  } catch (error) {
    console.error("[registrar]", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
