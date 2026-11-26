const crypto = require("crypto");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

// dépose le fichier et renvoie sa CLÉ (c'est elle qu'on range sur la fiche)
async function televerser(buffer, contentType) {
  const cle = `justificatifs/${crypto.randomUUID()}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET, Key: cle, Body: buffer, ContentType: contentType,
  }));
  return cle;
}

// fabrique un lien signé valable 5 minutes
async function lienTemporaire(cle) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: cle }), { expiresIn: 300 });
}

module.exports = { televerser, lienTemporaire };