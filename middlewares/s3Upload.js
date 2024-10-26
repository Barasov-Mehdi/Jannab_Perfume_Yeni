const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'your-bucket-name', // S3 bucket adınızı buraya girin
    acl: 'public-read', // Dosyaların herkese açık erişim izni
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname)
    }
  })
});

module.exports = upload;
