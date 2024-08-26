import * as fs from "fs";
import * as path from "path";

import { RekognitionReader } from "./RekognitionReader";

const frontPath = path.join(__dirname, "images/front.jpg");
const backPath = path.join(__dirname, "images/back.jpg");

const rekognition_l = new RekognitionReader(frontPath, backPath);
const data = rekognition_l.process().then((data) => {
  console.log("PROCESADO", data);
});
