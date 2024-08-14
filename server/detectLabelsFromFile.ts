import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";
import * as fs from "fs";
import * as path from "path";

// Configuración del cliente de Rekognition
const rekognitionClient = new RekognitionClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: `${process.env.ACCES_KEY}`,
    secretAccessKey: `${process.env.SECRET_KEY}`,
  },
});
async function detectLabelsFromFile(imagePath: string, outputFileName: string) {
  try {
    // Lee la imagen desde el path y la convierte a base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Detecta etiquetas en la imagen
    const detectLabelsParams = {
      Image: {
        Bytes: Buffer.from(base64Image, "base64"),
      },
      MaxLabels: 10, // Número máximo de etiquetas a retornar
      MinConfidence: 75, // Confianza mínima requerida
    };

    const labelsResult = await rekognitionClient.send(
      new DetectLabelsCommand(detectLabelsParams)
    );

    // Guarda la respuesta en un archivo JSON indentado
    fs.writeFileSync(
      outputFileName,
      JSON.stringify(labelsResult.Labels, null, 2)
    );

    console.log(`Etiquetas guardadas en ${outputFileName}`);
  } catch (error) {
    console.error("Error al detectar etiquetas:", error);
  }
}

// Path de la imagen y nombre del archivo de salida
const imagePath = path.join(__dirname, "imagen-de-ejemplo.jpg"); // Ajusta la ruta de la imagen según sea necesario
const outputFileName = path.join(__dirname, "etiquetas_detectadas.json");

// Ejecuta la función
detectLabelsFromFile(imagePath, outputFileName);
