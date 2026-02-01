import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

let _dynamoClient: DynamoDBClient;
let _docClient: DynamoDBDocumentClient;
let _s3Client: S3Client;

export const useAws = () => {
    const config = useRuntimeConfig();

    if (!_dynamoClient) {
        _dynamoClient = new DynamoDBClient({
            region: config.awsRegion,
            credentials: {
                accessKeyId: config.awsAccessKeyId,
                secretAccessKey: config.awsSecretAccessKey // In production, consider real IAM roles if possible
            }
        });
        _docClient = DynamoDBDocumentClient.from(_dynamoClient);
    }

    if (!_s3Client) {
        _s3Client = new S3Client({
            region: config.awsRegion,
            credentials: {
                accessKeyId: config.awsAccessKeyId,
                secretAccessKey: config.awsSecretAccessKey
            }
        });
    }

    return {
        dynamodb: _dynamoClient,
        docClient: _docClient,
        s3: _s3Client,
        tableNames: {
            jobs: config.aiFittingJobTable,
            keys: config.aiFittingApiKeyTable
        },
        bucketName: config.s3Bucket,
        sqsUrl: config.sqsUrl
    };
};
