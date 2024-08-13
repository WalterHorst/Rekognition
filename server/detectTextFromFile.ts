import {
  RekognitionClient,
  DetectTextCommand,
} from "@aws-sdk/client-rekognition";
import * as fs from "fs";
import * as path from "path";

// Configuración del cliente de Rekognition
const rekognitionClient = new RekognitionClient({ region: "us-west-2" });

async function detectTextFromFile(imagePath: string, outputFileName: string) {
  try {
    // Lee la imagen desde el path y la convierte a base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Detecta texto en la imagen
    const detectTextParams = {
      Image: {
        Bytes: Buffer.from(base64Image, "base64"),
      },
    };

    const textResult = await rekognitionClient.send(
      new DetectTextCommand(detectTextParams)
    );

    // Guarda la respuesta en un archivo JSON indentado
    fs.writeFileSync(
      outputFileName,
      JSON.stringify(textResult.TextDetections, null, 2)
    );

    console.log(`Texto detectado guardado en ${outputFileName}`);
  } catch (error) {
    console.error("Error al detectar texto:", error);
  }
}

// Path de la imagen y nombre del archivo de salida
const imagePath = path.join(__dirname, "dni-argentina.webp"); // Ajusta la ruta de la imagen según sea necesario
const outputFileName = path.join(__dirname, "texto_detectado.json");

// Ejecuta la función
detectTextFromFile(imagePath, outputFileName);
