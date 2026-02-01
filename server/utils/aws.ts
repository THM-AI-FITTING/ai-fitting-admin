/**
 * AWS SDK 클라이언트를 관리하는 유틸리티입니다.
 * 싱글톤 패턴을 사용하여 클라이언트 인스턴스를 재사용합니다.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

let _dynamoClient: DynamoDBClient;
let _docClient: DynamoDBDocumentClient;
let _s3Client: S3Client;

export const useAws = () => {
    const config = useRuntimeConfig();

    // DynamoDB 클라이언트 초기화 (필요 시에만 생성)
    if (!_dynamoClient) {
        _dynamoClient = new DynamoDBClient({
            region: config.awsRegion,
            credentials: {
                accessKeyId: config.awsAccessKeyId,
                secretAccessKey: config.awsSecretAccessKey
            }
        });
        _docClient = DynamoDBDocumentClient.from(_dynamoClient);
    }

    // S3 클라이언트 초기화 (필요 시에만 생성)
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
