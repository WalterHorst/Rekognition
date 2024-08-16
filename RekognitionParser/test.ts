const ZXing = require("node-zxing");
const reader = new ZXing();

reader.decode("codigo.jpg", (err: any, result: any) => {
  if (err) {
    console.error("ERROR", err);
  } else {
    console.log("result", result);
    const data = result.replace(/@/g, " ");
    const parseData = data.split(" ");
    const cuilRaw = parseData[parseData.length - 1].split("");
    const cuilClean = `${cuilRaw[0]}${cuilRaw[1]}-${parseData[6]}-${cuilRaw[2]}`;

    const personalData = {
      lastName: `${parseData[1]} ${parseData[2]}`,
      name: `${parseData[3]} ${parseData[4]}`,
      genero: parseData[5],
      dni: parseData[6],
      cuil: cuilClean,
      fechaNacimiento: parseData[8],
    };
    console.log(personalData);
  }
});
