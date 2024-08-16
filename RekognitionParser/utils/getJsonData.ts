import * as fs from "fs/promises";

export const getJsonData = async () => {
  try {
    // Leer el archivo de manera asíncrona
    const data = await fs.readFile("./../data/mario/front.json", "utf8");

    // Convertir el contenido JSON en un objeto de JavaScript
    const jsonData = JSON.parse(data);

    // Devolver el objeto JSON
    return jsonData;
  } catch (err) {
    return null;
  }
};
