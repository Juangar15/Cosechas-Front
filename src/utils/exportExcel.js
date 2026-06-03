import * as XLSX from 'xlsx';

export const exportarAExcel = (datos, nombreArchivo, columnasFormateadas = null) => {
  if (!datos) {
    console.warn("No hay datos para exportar");
    return;
  }

  const workbook = XLSX.utils.book_new();

  // Si datos es un array, es una sola hoja
  if (Array.isArray(datos)) {
    if (datos.length === 0) return;
    const dataParaExcel = columnasFormateadas ? datos.map(columnasFormateadas) : datos;
    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  } 
  // Si datos es un objeto, cada llave es el nombre de una hoja y su valor es el array de datos
  else {
    for (const [nombreHoja, arrayDatos] of Object.entries(datos)) {
      if (Array.isArray(arrayDatos) && arrayDatos.length > 0) {
        // En este modo múltiple, no aplicamos columnasFormateadas global, asumimos que ya vienen formateados.
        const worksheet = XLSX.utils.json_to_sheet(arrayDatos);
        XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja.substring(0, 31)); // excel limita nombres de hojas a 31 chars
      }
    }
  }
  
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${nombreArchivo}_${fecha}.xlsx`);
};
