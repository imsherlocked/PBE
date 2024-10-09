const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'inventorydbsecondary'; // Primary table
const ARCHIVE_TABLE_NAME = 'archivedb'; // Archive table

module.exports = { dynamoDB, TABLE_NAME, ARCHIVE_TABLE_NAME };