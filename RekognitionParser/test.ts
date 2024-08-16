const ZXing = require("node-zxing");
const reader = new ZXing();

reader.decode("prueba.jpg", (err: any, result: any) => {
  if (err) {
    console.error("ERROR", err);
  } else {
    console.log("result", result);
  }
});
