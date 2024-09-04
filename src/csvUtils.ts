import fs from 'fs';
import { Readable } from 'stream';
import AWS from 'aws-sdk';
import { parse } from 'fast-csv';
import path from 'path';
import { Address, ShippingAddress, customerRow } from './types';

// to use the file stored in local machine in c drive
const baseDir = process.env.baseDir || 'C:\\Users\\ranjani.sakthivel\\Downloads';

AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.region
});

const S3 = new AWS.S3();

// Define your bucket and file key
const bucketName = process.env.shipping_details_bucket || '';
const fileKey = process.env.csv_file_name || '';
const response_csv = process.env.response_csv_file_name || '';

// logic to read the CSV file if shipping address is missing for a customer in request body
export const readShippingDetailsCSV = async (customerID: string): Promise<{ shippingAddress: ShippingAddress } | null> => {
    const params: AWS.S3.GetObjectRequest = {
        Bucket: bucketName,
        Key: fileKey
      };
    const s3Object = await S3.getObject(params).promise();
    
    return new Promise((resolve, reject) => {
        const results: customerRow[] = [];
      
          // Create a readable stream from the S3 object
          const s3Stream = new Readable();
          s3Stream._read = () => {}; // No-op
          s3Stream.push(s3Object.Body as Buffer);
          s3Stream.push(null);
      
          // Parse the CSV data
          s3Stream
            .pipe(parse({ headers: true }))
            .on('data', (row: customerRow) => results.push(row))
            .on('end', () => {
                const customerDetails = results.find(row => row.customerId === customerID);
                if (customerDetails) {
                    const address: Address = {
                        line1: customerDetails.line1 || '',
                        line2: customerDetails.line2 || '',
                        city: customerDetails.city || '',
                        state: customerDetails.state || '',
                        postalCode: customerDetails.postalCode || '',
                        country: customerDetails.country || ''
                    };
                    resolve({ shippingAddress: { address } });
                } else {
                    resolve(null);
                }
            })
            .on('error', reject);
    });
};

export const writeResponseToCSV = async (response: { customerId: string | undefined, status: number, message: string }) => {
    // Create the new row for the CSV
    const newRow = `${response.customerId},${response.status},${response.message}\n`;

    try {
        // Check if the file exists in the S3 bucket
        let existingContent = '';
        try {
            // Attempt to get the existing file from S3
            const result = await S3.getObject({
                Bucket: bucketName,
                Key: response_csv,
            }).promise();
            existingContent = result.Body?.toString('utf-8') || '';
        } catch (err) {
            // Type assertion to any since TypeScript cannot infer the type of the error
            const error = err as AWS.AWSError;

            if (error.code === 'NoSuchKey') {
                // If the file does not exist, it will be created with header
                existingContent = ''; // No content exists
            } else {
                // Throw any other error
                throw error;
            }
        }

        // If the file is empty, add the CSV header
        const headerRow = existingContent ? '' : 'customerId,status,message\n';

        // Combine existing content with the new row
        const updatedContent = headerRow + existingContent + newRow;

        // Upload the updated content to S3
        await S3.upload({
            Bucket: bucketName,
            Key: response_csv,
            Body: updatedContent,
            ContentType: 'text/csv',
        }).promise();
    } catch (error) {
        throw error;
    }
};

// // logic to write the acknowledgement response from the API
// export const writeResponseToCSV = async (response: { customerId: string | undefined, status: number, message: string }) => {
//     // Use /tmp directory for writable files
//     const outputCsvFilePath = path.join('/tmp', 'response_tracker.csv');
//     // const outputCsvFilePath = path.join(__dirname, 'response_tracker.csv');
//     console.log('writeResponseToCSV')
//     return new Promise<void>((resolve, reject) => {
//         try {
//             const row = `${response.customerId},${response.status},${response.message}\n`;
//             const fileExists = fs.existsSync(outputCsvFilePath);

//             const fileStream = fs.createWriteStream(outputCsvFilePath, { flags: 'a' });

//             if (!fileExists) {
//                 fileStream.write('customerId,status,message\n');
//             }

//             fileStream.write(row);
//             fileStream.end();

//             fileStream.on('finish', resolve);
//             fileStream.on('error', reject);

//         } catch (error) {
//             console.log('error writeResponseToCSV')
//             reject(error);
//         }
//     });
// }
