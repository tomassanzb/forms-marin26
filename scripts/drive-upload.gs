// Google Apps Script — subir comprobantes a Drive
// Instrucciones:
//   1. Abrí script.google.com (con la cuenta grupomisionerosanjuanpabloii@gmail.com)
//   2. Creá un nuevo proyecto, pegá este código
//   3. Deploy → New deployment → Web app
//      - Execute as: Me
//      - Who has access: Anyone
//   4. Copiá la URL del deployment y pegala en .env.local como GOOGLE_APPS_SCRIPT_URL

var FOLDER_ID = "12TBlK-0eOfmDTfbN6fhtFLTCj6KQGMJe";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var folder = DriveApp.getFolderById(FOLDER_ID);

    var bytes = Utilities.base64Decode(data.base64);
    var blob = Utilities.newBlob(bytes, data.mimeType, data.filename);

    var file = folder.createFile(blob);

    // Intentar hacer el archivo público con link; si la carpeta ya lo restringe, continuar igual
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingErr) {
      // El archivo ya hereda los permisos de la carpeta — no es bloqueante
    }

    var url = "https://drive.google.com/file/d/" + file.getId() + "/view";

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, url: url }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Para verificar que el script está activo (GET en el browser)
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: "Drive upload script activo" }))
    .setMimeType(ContentService.MimeType.JSON);
}
