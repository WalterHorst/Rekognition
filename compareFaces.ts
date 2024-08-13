const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();

const params = {
    SourceImage: {
        Bytes:, /* Buffer de la imagen de la cara del DNI */
    },
    TargetImage: {
        Bytes:, /* Buffer de la imagen de la cara del video */
    }
};

rekognition.compareFaces(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else {
        const match = data.FaceMatches[0];
        if (match) {
            console.log('Rostros coinciden:', match);
        } else {
            console.log('No hay coincidencia.');
        }
    }
});
