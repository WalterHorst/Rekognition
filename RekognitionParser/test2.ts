let DBR = require("dynamsoft-node-barcode");
// Please visit https://www.dynamsoft.com/customer/license/trialLicense?product=dbr&package=js&utm_source=node to get a trial license
DBR.BarcodeReader.license = "LICENSE";

let pReader = null;
(async () => {
  let reader = await DBR.BarcodeReader.createInstance();
  for (let result of await reader.decode(
    "https://demo.dynamsoft.com/barcode-reader/img/AllSupportedBarcodeTypes.png"
  )) {
    console.log(result.barcodeText);
  }
  reader.destroy();

  // Since the worker keep alive, you can call
  await DBR.BarcodeReader._dbrWorker.terminate();
  // when you need to exit this process.
  // Or call
  process.exit();
  // directly.
})();
