import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

export const handler: APIGatewayProxyHandler = async (event) => {
  const s3 = new AWS.S3();
  const bucket = process.env.shipping_details_bucket || 'default-bucket';
  const fileName = process.env.csv_file_name || 'default.csv';

  try {
    // Simulate S3 operation
    const data = await s3.getObject({ Bucket: bucket, Key: fileName }).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File retrieved successfully', data: data.Body.toString() }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error retrieving file', error: error.message }),
    };
  }
};
