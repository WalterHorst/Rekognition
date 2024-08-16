import { getJsonData } from "./utils/getJsonData";

class RekognitionParser {
  DATA: any = [];

  // CARACTERISTICAS DEL DOCUMENTO
  COUNTRY = "";
  IS_FRONT = true;

  // DATA DEL DOCUMENTO
  IDENTITY_DOCUMENT = "";
  NAME = "";
  LASTNAME = "";

  constructor(data: any) {
    this.DATA = data;

    this.#loadCaracteristicas();
    this.#loadDocumentoIdentificacion();
    this.#loadName();

    for (let i = 0; i < this.DATA.length; i++) {
      console.log(this.DATA[i].DetectedText);
    }
  }
  process() {
    return {
      country: this.COUNTRY,
      isFront: this.IS_FRONT,
      identityDocument: this.IDENTITY_DOCUMENT,
      name: this.NAME,
      lastName: this.LASTNAME,
    };
  }

  #loadName() {
    if (this.IS_FRONT) {
      if (this.COUNTRY == "ARGENTINA") {
        this.NAME = "NOMBRE AQUI";
      }
    }
  }

  #loadDocumentoIdentificacion() {
    if (this.IS_FRONT) {
      if (this.COUNTRY == "ARGENTINA") {
        let DNI_ENCONTRADO = null;

        // LISTADO DE NUMEROS POSIBLES DNI
        const dataDNI: any = this.DATA.filter((row: any) => {
          const dni = String(row.DetectedText).trim().replace(/\D/g, ""); // Eliminar todos los caracteres que no sean números

          return this.#isDniArgentina(dni);
        });

        if (Array.isArray(dataDNI) && dataDNI.length > 0) {
          // PRIMERO SE TRATA DE OBTENER POR COORDENADAS
          const dataTextDocumento: any = this.DATA.filter((row: any) =>
            row.DetectedText.trim().toUpperCase().includes("DOCUMENT")
          );

          if (
            Array.isArray(dataTextDocumento) &&
            dataTextDocumento.length > 0
          ) {
            let dniExtract = dataDNI[0];

            for (let i = 1; i < dataDNI.length; i++) {
              if (
                this.#getCordenadaMasCercana(
                  dniExtract.Geometry.Polygon[0].X,
                  dataDNI[i].Geometry.Polygon[0].X,
                  dataTextDocumento[0].Geometry.Polygon[0].X
                ) == dataDNI[i].Geometry.Polygon[0].X
              ) {
                dniExtract = dataDNI[i];
              }
            }

            DNI_ENCONTRADO = dniExtract.DetectedText.trim().replace(/\D/g, "");
          } else {
            // SACAR PRIMERO O EL QUE MAS SE REPITA???
            DNI_ENCONTRADO = dataDNI[0].DetectedText.trim().replace(/\D/g, "");
          }
        }

        if (DNI_ENCONTRADO != null) {
          this.IDENTITY_DOCUMENT = DNI_ENCONTRADO;
        }
      }
    }
  }

  #isDniArgentina(dni: string | number) {
    const dniStr = dni.toString();
    const regex = /^(?:\d{8}|\d{9})$/;
    const regexConFormato = /^(?:\d{2}\.\d{3}\.\d{3}(?:\/\d)?)$/;
    return regex.test(dniStr) || regexConFormato.test(dniStr);
  }

  // CARGA LA CARACTERISTICAS DE LA DOCUMENTACION
  #loadCaracteristicas() {
    this.#loadPais();
    this.#loadIsFront();
  }

  #loadPais() {
    if (this.#isArgentina()) {
      this.COUNTRY = "ARGENTINA";
    }
  }

  #loadIsFront() {
    this.IS_FRONT = true;

    if (this.COUNTRY == "ARGENTINA") {
      const isBack = this.DATA.filter((row: any) => {
        return row.DetectedText.toUpperCase().trim().includes("IDARG");
      });

      if (Array.isArray(isBack) && isBack.length > 0) {
        this.IS_FRONT = false;
      }
    }
  }

  #isArgentina() {
    const filtered = this.DATA.filter((row: any) => {
      return (
        row.DetectedText.toUpperCase().trim().includes("ARGENTINA") ||
        row.DetectedText.toUpperCase().trim().includes("IDARG")
      );
    });

    return Array.isArray(filtered) && filtered.length > 0;
  }

  /* SIRVE PARA SABER QUE COORDENADA ES LA MAS CERCANA
  ESTO ES UTIL CUANDO SE ENCUENTRA UN LABEL DONDE LUEGO DE ESE LABEL DE REFERENCIA
  DEBERIA SEGUIR DEBAJO (X) O AL LADO (Y) EL DATO QUE ESTAMOS BUSCANDO.
  */
  #getCordenadaMasCercana(value1: number, value2: number, target: number) {
    const diff1 = Math.abs(value1 - target);
    const diff2 = Math.abs(value2 - target);

    if (diff1 < diff2) {
      return value1;
    } else if (diff2 < diff1) {
      return value2;
    } else {
      return value1;
    }
  }
}

const frontJsonData = getJsonData().then((data) => {
  const my_test = new RekognitionParser(data);
  const data_rekognition = my_test.process();

  console.log("data_rekognition", data_rekognition);
});
