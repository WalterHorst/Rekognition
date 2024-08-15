import { dniFront } from "../data/mario/front";
import * as fs from "fs";

const extractedTexts = dniFront.map((item) => item.DetectedText);

//Elimina los elementos vacíos

// Guarda el resultado en un archivo JSON
const jsonData = JSON.stringify(extractedTexts, null, 2);
fs.writeFileSync("orderedTexts.json", jsonData, "utf-8");

console.log("Archivo JSON guardado exitosamente.");
