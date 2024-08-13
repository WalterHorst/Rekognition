const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();

const params = {
    Image: {
        Bytes: , // Imagen en formato base64
    }
};

rekognition.detectFaces(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else {
        const faceDetails = data.FaceDetails;
        // Procesar los detalles de la cara detectada
        console.log(faceDetails);
    }
});
