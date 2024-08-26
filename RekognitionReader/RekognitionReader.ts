import {
  RekognitionClient,
  DetectTextCommand,
} from "@aws-sdk/client-rekognition";

import * as fs from "fs";
import * as path from "path";

interface LabelData {
  value: string;
  source: string;
}

interface ProccessResponse {
  country: LabelData;
  identity_document: LabelData;
  name: LabelData;
  lastname: LabelData;
  birthdate: LabelData;
  cuil: LabelData;
  sex: LabelData;
  expiration_date: LabelData;
}

const enum Gender {
  FEMALE = "MUJER",
  MALE = "HOMBRE",
}

export class RekognitionReader {
  #REKOGNITION_CLIENT = new RekognitionClient({
    region: "us-west-2",
    credentials: {
      accessKeyId: process.env.ACCES_KEY || "",
      secretAccessKey: process.env.SECRET_KEY || "",
    },
  });

  #FILTER_CONFIDENCE;

  #FRONT_PATH = "";
  #BACK_PATH = "";

  #LABELS_FRONT: any = [];
  #LABELS_BACK: any = [];

  // DATA DOCUMENT
  #COUNTRY = { value: "", source: "" };
  #IDENTITY_DOCUMENT = { value: "", source: "" };
  #NAME = { value: "", source: "" };
  #LASTNAME = { value: "", source: "" };
  #BIRTHDATE = { value: "", source: "" };
  #CUIL = { value: "", source: "" };
  #SEX = { value: "", source: "" };
  #EXPIRATION_DATE = { value: "", source: "" };

  constructor(frontPath: string, backPath: string, filterConfidence = 90) {
    if (!(fs.existsSync(frontPath) && fs.existsSync(backPath))) {
      throw "PATHS DE IMAGENES NO VÁLIDOS";
    }

    this.#FRONT_PATH = frontPath;
    this.#BACK_PATH = backPath;
    this.#FILTER_CONFIDENCE = filterConfidence;
  }

  process = async (): Promise<ProccessResponse> => {
    // SE INTENTA PRIMERO LEER EL CODIGO PDF147
    await this.#readCodeFront();

    // SI NO SE PUDO CARGAR LA DATA, SE PROCEDE A USAR OC AWS
    if (this.#IDENTITY_DOCUMENT.value == "") {
      await this.#loadLabels();

      this.#loadPais();
      this.#readCodeBack();

      if (this.#IDENTITY_DOCUMENT.value == "") {
        this.#loadIndentityDocumentInTexts();
      }

      if (this.#LASTNAME.value == "") {
        this.#loadLastNameInTexts();
      }

      if (this.#NAME.value == "") {
        this.#loadNameInTexts();
      }

      if (this.#BIRTHDATE.value == "") {
        this.#loadBirthdateInTexts();
      }

      if (this.#CUIL.value == "") {
        this.#loadCUILInTexts();
      }
      if (this.#SEX.value == "") {
        this.#loadSexInTexts();
      }

      if (this.#EXPIRATION_DATE.value == "") {
        this.#loadExpirationDateInTexts();
      }
    }

    return {
      country: this.#COUNTRY,
      identity_document: this.#IDENTITY_DOCUMENT,
      name: this.#NAME,
      lastname: this.#LASTNAME,
      birthdate: this.#BIRTHDATE,
      cuil: this.#CUIL,
      sex: this.#SEX,
      expiration_date: this.#EXPIRATION_DATE,
    };
  };

  #loadLabels = async () => {
    const LABELS_FRONT_AWS = await this.#detectLabelsFromFile(this.#FRONT_PATH);
    const LABELS_BACK_AWS = await this.#detectLabelsFromFile(this.#BACK_PATH);

    this.#LABELS_FRONT = LABELS_FRONT_AWS.filter(
      (row: any) => row?.ParentId === undefined
    );

    this.#LABELS_BACK = LABELS_BACK_AWS.filter(
      (row: any) => row?.ParentId === undefined
    );
  };

  #readCodeFront = async () => {
    const ZXing = require("node-zxing");
    const reader = new ZXing();

    try {
      const result = await new Promise<string | null>((resolve, reject) => {
        reader.decode(this.#FRONT_PATH, (err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            if (result.includes("@")) {
              resolve(result);
            } else {
              resolve(null);
            }
          }
        });
      });

      if (result != null) {
        const parseData = result.split("@");

        if (parseData.length > 0) {
          this.#LASTNAME = {
            value: (parseData?.[1] || "").trim(),
            source: "CODE",
          };

          this.#NAME = {
            value: (parseData?.[2] || "").trim(),
            source: "CODE",
          };

          this.#IDENTITY_DOCUMENT = {
            value:
              (parseData?.[4] || "").trim().length == 8
                ? parseData?.[4].trim()
                : "",
            source: "CODE",
          };

          this.#BIRTHDATE = {
            value: (parseData?.[6] || "").trim(),
            source: "CODE",
          };

          const cuil =
            (parseData?.[8] || "").trim().length == 3 &&
            this.#IDENTITY_DOCUMENT.value != ""
              ? parseData?.[8].substring(0, 2) +
                this.#IDENTITY_DOCUMENT.value +
                parseData?.[8].substring(2)
              : "";

          this.#CUIL = {
            value: cuil,
            source: "CODE",
          };

          if ((parseData?.[3] || "").trim().toUpperCase() == "M") {
            this.#SEX = {
              value: Gender.MALE,
              source: "CODE",
            };
          } else if ((parseData?.[3] || "").trim().toUpperCase() == "F") {
            this.#SEX = {
              value: Gender.FEMALE,
              source: "CODE",
            };
          }

          this.#EXPIRATION_DATE = {
            value: (parseData?.[7] || "").trim(),
            source: "CODE",
          };

          this.#COUNTRY = {
            value: "ARGENTINA",
            source: "CODE",
          };
        }
      }
    } catch (error) {}
  };

  #readCodeBack = () => {
    let MRZ_DATA = "";

    for (let i = 0; i < this.#LABELS_BACK.length; i++) {
      if (this.#LABELS_BACK[i]?.DetectedText.toUpperCase().includes("IDARG")) {
        MRZ_DATA = this.#LABELS_BACK[i]?.DetectedText;
      } else if (
        MRZ_DATA != "" &&
        (this.#LABELS_BACK[i]?.DetectedText.includes("<") ||
          this.#LABELS_BACK[i]?.DetectedText.includes(">"))
      ) {
        MRZ_DATA += this.#LABELS_BACK[i]?.DetectedText;
        console.log(this.#LABELS_BACK[i]?.Confidence);
      }
    }

    while (MRZ_DATA.includes("<<")) {
      MRZ_DATA = MRZ_DATA.replace(/<</g, "<");
    }

    if (MRZ_DATA.trim() != "") {
      const mrz_parts = MRZ_DATA.split("<");

      let dni_part = (mrz_parts?.[0] || "").replace(/IDARG/g, "");

      if (this.#isDniArgentina(dni_part)) {
        this.#IDENTITY_DOCUMENT = {
          value: dni_part,
          source: "LABEL",
        };
      }

      let other_info = (mrz_parts?.[1] || "").trim().toUpperCase();

      if (other_info.endsWith("ARG") && other_info.length == 19) {
        if (other_info.includes("M")) {
          this.#SEX = {
            value: Gender.MALE,
            source: "LABEL",
          };
        } else if (other_info.includes("F")) {
          this.#SEX = {
            value: Gender.FEMALE,
            source: "LABEL",
          };
        }

        let numeros = other_info.match(/\d+/g)?.join("") || "";

        if (numeros.length == 15) {
          numeros = numeros.substring(1, numeros.length);

          let fecha_b = numeros.substring(0, 6);
          let anio = parseInt(fecha_b.substring(0, 2));
          let mes = parseInt(fecha_b.substring(2, 4));
          let dia = parseInt(fecha_b.substring(4, 6));

          if (!isNaN(anio) && !isNaN(mes) && !isNaN(dia)) {
            anio = this.#convertYear(anio);

            const birthdate = `${dia < 10 ? `0${dia}` : dia}/${
              mes < 10 ? `0${mes}` : mes
            }/${anio}`;

            this.#BIRTHDATE = {
              value: birthdate,
              source: "LABEL",
            };
          }
        }
      }
    }
  };

  #convertYear(dosDigitos: number) {
    let year = dosDigitos;

    if (year >= 0 && year <= 99) {
      // Obtener el year actual
      const yearActual = new Date().getFullYear();
      // Obtener el year base (primer year del siglo actual)
      const yearBase = yearActual - (yearActual % 100);

      // Decidir si el year es en el siglo actual o el anterior
      if (year + yearBase <= yearActual) {
        return year + yearBase;
      } else {
        return year + yearBase - 100;
      }
    }

    // Si el año es mayor a 99, se asume que ya es un año completo
    return year;
  }

  #loadNameInTexts() {
    // PRIMER PASO, OBTENGO EL INDICE DE LA LEYENDA NOMBRE / NAME
    const indice_leyenda = this.#LABELS_FRONT.findIndex((row: any) => {
      const text = row.DetectedText.trim().toUpperCase();
      return text.includes("NOMBRE") && text.includes("NAME");
    });

    const elementosOrdenados = this.#getElementsWithLabelReference(
      indice_leyenda,
      16
    );

    if (elementosOrdenados) {
      if (elementosOrdenados[0].confidence >= this.#FILTER_CONFIDENCE) {
        this.#NAME = { value: elementosOrdenados[0].label, source: "LABEL" };
      }
    }
  }

  #loadBirthdateInTexts() {
    // PRIMER PASO, OBTENGO EL INDICE DE LA LEYENDA Fecha de nacimiento / Date of birth
    const indice_leyenda = this.#LABELS_FRONT.findIndex((row: any) => {
      return (
        (row.DetectedText.trim().toUpperCase().includes("FECHA") ||
          row.DetectedText.trim().toUpperCase().includes("DATE")) &&
        row.DetectedText.trim().toUpperCase().includes("BIRTH")
      );
    });

    const elementosOrdenados = this.#getElementsWithLabelReference(
      indice_leyenda,
      10
    );

    if (elementosOrdenados) {
      const elementDate = elementosOrdenados.filter((row) => {
        return this.#isLabelDate(row.label);
      });

      if (Array.isArray(elementDate) && elementDate.length > 0) {
        if (elementDate[0].confidence >= this.#FILTER_CONFIDENCE) {
          const date_string = elementDate[0].label.trim().toUpperCase();

          const monthNumber = this.#getMonthNumberFromLabel(date_string);

          if (monthNumber !== null) {
            const partsLabel = date_string.split(" ");

            const numberlabel = partsLabel.filter((row: any) => !isNaN(row));

            if (numberlabel.length == 2) {
              const birthdate = `${
                numberlabel[0] > 9 ? numberlabel[0] : `0${numberlabel[0]}`
              }/${monthNumber > 9 ? monthNumber : `0${monthNumber}`}/${
                numberlabel[1]
              }`;

              this.#BIRTHDATE = {
                value: birthdate,
                source: "LABEL",
              };
            }
          }
        }
      }
    }
  }

  #loadExpirationDateInTexts() {
    // PRIMER PASO, OBTENGO EL INDICE DE LA LEYENDA Fecha de nacimiento / Date of birth
    const indice_leyenda = this.#LABELS_FRONT.findIndex((row: any) => {
      return (
        row.DetectedText.trim().toUpperCase().includes("VENCIMIENTO") ||
        row.DetectedText.trim().toUpperCase().includes("EXPIRY")
      );
    });

    const elementosOrdenados = this.#getElementsWithLabelReference(
      indice_leyenda,
      10
    );

    if (elementosOrdenados) {
      const elementDate = elementosOrdenados.filter((row) => {
        return this.#isLabelDate(row.label);
      });

      if (Array.isArray(elementDate) && elementDate.length > 0) {
        if (elementDate[0].confidence >= this.#FILTER_CONFIDENCE) {
          const date_string = elementDate[0].label.trim().toUpperCase();

          const monthNumber = this.#getMonthNumberFromLabel(date_string);

          if (monthNumber !== null) {
            const partsLabel = date_string.split(" ");

            const numberlabel = partsLabel.filter((row: any) => !isNaN(row));

            if (numberlabel.length == 2) {
              const expiration_date = `${
                numberlabel[0] > 9 ? numberlabel[0] : `0${numberlabel[0]}`
              }/${monthNumber > 9 ? monthNumber : `0${monthNumber}`}/${
                numberlabel[1]
              }`;

              this.#EXPIRATION_DATE = {
                value: expiration_date,
                source: "LABEL",
              };
            }
          }
        }
      }
    }
  }

  #loadCUILInTexts() {
    const cuitData = this.#LABELS_BACK.filter((row: any) =>
      this.#isCUITValidFormat(row.DetectedText)
    );

    if (cuitData.length > 0) {
      if (cuitData[0].Confidence >= this.#FILTER_CONFIDENCE) {
        this.#CUIL = {
          value: cuitData[0].DetectedText.replace(/[^\d]/g, ""),
          source: "LABEL",
        };
      }
    }
  }

  #loadSexInTexts() {
    // PRIMER PASO, OBTENGO EL INDICE DE LA LEYENDA Fecha de nacimiento / Date of birth
    const indice_leyenda = this.#LABELS_FRONT.findIndex((row: any) => {
      return (
        row.DetectedText.trim().toUpperCase().includes("SEXO") &&
        row.DetectedText.trim().toUpperCase().includes("SEX")
      );
    });

    const elementosOrdenados = this.#getElementsWithLabelReference(
      indice_leyenda,
      10
    );

    if (Array.isArray(elementosOrdenados) && elementosOrdenados.length > 0) {
      const sexElement = elementosOrdenados.filter(
        (row: any) =>
          row.label.trim().toUpperCase() == "M" ||
          row.label.trim().toUpperCase() == "F"
      );

      if (Array.isArray(sexElement) && sexElement.length > 0) {
        const sex =
          sexElement[0].label.trim().toUpperCase() == "M"
            ? Gender.MALE
            : Gender.FEMALE;

        this.#SEX = {
          value: sex,
          source: "LABEL",
        };
      }
    }
  }

  #isLabelDate(label: string) {
    const value = label.trim().toUpperCase();

    return (
      value.includes("ENE") ||
      value.includes("JAN") ||
      value.includes("FEB") ||
      value.includes("MAR") ||
      value.includes("ABR") ||
      value.includes("APR") ||
      value.includes("MAY") ||
      value.includes("JUN") ||
      value.includes("JUL") ||
      value.includes("AGO") ||
      value.includes("AUG") ||
      value.includes("SEP") ||
      value.includes("OCT") ||
      value.includes("NOV") ||
      value.includes("DIC") ||
      value.includes("DEC")
    );
  }

  #getMonthNumberFromLabel(label: string): number | null {
    const date_string = label.trim().toUpperCase();

    switch (true) {
      case date_string.includes("ENE") || date_string.includes("JAN"):
        return 1;

      case date_string.includes("FEB"):
        return 2;

      case date_string.includes("MAR"):
        return 3;

      case date_string.includes("ABR") || date_string.includes("APR"):
        return 4;

      case date_string.includes("MAY"):
        return 5;

      case date_string.includes("JUN"):
        return 6;

      case date_string.includes("JUL"):
        return 7;

      case date_string.includes("AGO") || date_string.includes("AUG"):
        return 8;

      case date_string.includes("SEP"):
        return 9;

      case date_string.includes("OCT"):
        return 10;

      case date_string.includes("NOV"):
        return 11;

      case date_string.includes("DIC") || date_string.includes("DEC"):
        return 12;
    }

    return null;
  }

  #getElementsWithLabelReference(
    index: number,
    limit_list = 16
  ): Array<any> | null {
    let elementosOrdenados = null;

    if (index >= 0) {
      const rowLeyenda = this.#LABELS_FRONT[index];

      const elementsWithDiferences = [];

      for (let i = index + 1; i < this.#LABELS_FRONT.length; i++) {
        if (this.#LABELS_FRONT[i].ParentId === undefined) {
          elementsWithDiferences.push({
            label: this.#LABELS_FRONT[i].DetectedText,
            confidence: this.#LABELS_FRONT[i].Confidence,
            dif_x: Math.abs(
              rowLeyenda.Geometry.Polygon[0].X -
                this.#LABELS_FRONT[i].Geometry.Polygon[0].X
            ),
            dif_y: Math.abs(
              rowLeyenda.Geometry.Polygon[0].Y -
                this.#LABELS_FRONT[i].Geometry.Polygon[0].Y
            ),
          });
        }
      }

      // PRIMERO ORDENO POR DIFERENCIA DE EJE X
      elementosOrdenados = elementsWithDiferences.sort(
        (a, b) => a.dif_x - b.dif_x
      );

      // RECORTO LOS ELEMENTOS A SOLO limit_list QUE SON COMO MUCHO TODOS LOS TEXTOS QUE SE PUEDEN ENCONTRAR ALINEADOS VERTICALMENTE IGUAL
      elementosOrdenados = elementosOrdenados.slice(
        0,
        elementosOrdenados.length > limit_list
          ? limit_list
          : elementosOrdenados.length
      );

      // AHORA LOS ORDENO HORIZONTALMENTE PARA OBTENER EL TEXTO CORRESPONDIENTE
      elementosOrdenados = elementosOrdenados.sort((a, b) => a.dif_y - b.dif_y);
    }

    return elementosOrdenados;
  }

  #loadIndentityDocumentInTexts() {
    // PRIMER PASO, OBTENGO EL INDICE DE LA LEYENDA DOCUMENT
    const indice_leyenda = this.#LABELS_FRONT.findIndex((row: any) => {
      return row.DetectedText.trim().toUpperCase().includes("DOCUMENT");
    });

    if (indice_leyenda >= 0) {
      const elementosOrdenados = this.#getElementsWithLabelReference(
        indice_leyenda,
        10
      );

      if (Array.isArray(elementosOrdenados) && elementosOrdenados.length > 0) {
        const dniElement = elementosOrdenados.filter((row: any) =>
          this.#isDniArgentina(row.label.replace(/\D/g, ""))
        );

        if (Array.isArray(dniElement) && dniElement.length > 0) {
          if (dniElement[0].confidence >= this.#FILTER_CONFIDENCE) {
            this.#IDENTITY_DOCUMENT = {
              value: dniElement[0].label.replace(/\D/g, ""),
              source: "LABEL",
            };
          }
        }
      }
    }
  }

  #loadLastNameInTexts() {
    // PRIMER PASO, OBTENGO EL INDICE DE LA LEYENDA APELLIDO / SURNAME
    const indice_leyenda = this.#LABELS_FRONT.findIndex((row: any) => {
      return (
        row.DetectedText.trim().toUpperCase().includes("APELLIDO") &&
        row.DetectedText.trim().toUpperCase().includes("SURNAME")
      );
    });

    const elementosOrdenados = this.#getElementsWithLabelReference(
      indice_leyenda,
      16
    );

    if (elementosOrdenados) {
      if (elementosOrdenados[0].confidence >= this.#FILTER_CONFIDENCE) {
        this.#LASTNAME = elementosOrdenados[0].label;
      }
    }
  }

  #isDniArgentina(dni: string | number) {
    const dniStr = dni.toString();
    const regex = /^(?:\d{8}|\d{9})$/;
    const regexConFormato = /^(?:\d{2}\.\d{3}\.\d{3}(?:\/\d)?)$/;
    return regex.test(dniStr) || regexConFormato.test(dniStr);
  }

  #isCUITValidFormat = (cuit: string) => {
    cuit = cuit.replace(/[^\d]/g, "");

    if (cuit.length !== 11) {
      return false;
    }

    const digitoVerificador = parseInt(cuit[10]);
    let suma = 0;
    const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 10; i++) {
      suma += parseInt(cuit[i]) * coeficientes[i];
    }
    const resto = suma % 11;
    const digitoCalculado = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

    if (digitoVerificador === digitoCalculado) {
      return true;
    } else {
      return digitoVerificador === 0 && digitoCalculado === 11;
    }
  };

  #loadPais() {
    // BUSCO CARGAR SI ES ARGENTINA
    let filtered = this.#LABELS_FRONT.filter((row: any) => {
      return row.DetectedText.toUpperCase().trim().includes("ARGENTINA");
    });

    if (filtered.length == 0) {
      filtered = this.#LABELS_BACK.filter((row: any) => {
        return row.DetectedText.toUpperCase().trim().includes("IDARG");
      });
    }

    if (Array.isArray(filtered) && filtered.length > 0) {
      this.#COUNTRY = {
        value: "ARGENTINA",
        source: "LABEL",
      };
    }
  }

  #detectLabelsFromFile = async (imagePath: string) => {
    try {
      // Lee la imagen desde el path como un buffer
      const imageBuffer = fs.readFileSync(path.join(imagePath));

      // Configura los parámetros para detectar texto
      const detectTextParams = {
        Image: {
          Bytes: imageBuffer, // La propiedad correcta es 'Bytes',
        },
      };

      // Envía la solicitud para detectar texto
      const textResult = await this.#REKOGNITION_CLIENT.send(
        new DetectTextCommand(detectTextParams)
      );

      if (
        Array.isArray(textResult?.TextDetections) &&
        textResult?.TextDetections.length > 0
      ) {
        return textResult?.TextDetections;
      }

      return [];
    } catch (error) {
      return [];
    }
  };
}
