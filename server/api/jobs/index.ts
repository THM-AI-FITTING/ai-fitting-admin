/**
 * 가상 피팅 작업 목록을 조회하는 API 엔드포인트입니다.
 * 필터 조건(owner, userId, status)에 따라 DynamoDB에서 데이터를 조회하고
 * 완료된 작업에 대해서는 S3 프리사인드(Presigned) URL을 생성하여 반환합니다.
 */
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const { docClient, s3, tableNames, bucketName } = useAws();

    try {
        let command;
        let input: any = {
            TableName: tableNames.jobs,
            ScanIndexForward: false, // GSI 조회 시 최신순 정렬
        };

        // 1. 쿼리 파라미터에 따른 조회 방식 결정
        if (query.owner) {
            // 파트너명(owner)으로 조회 -> 전용 인덱스 사용
            input = {
                ...input,
                IndexName: 'owner-sysRegDtm-index',
                KeyConditionExpression: '#owner = :owner',
                ExpressionAttributeNames: { '#owner': 'owner' },
                ExpressionAttributeValues: { ':owner': query.owner }
            };
            command = new QueryCommand(input);
        } else if (query.userId) {
            // 사용자 ID로 조회 -> 전용 인덱스 사용
            input = {
                ...input,
                IndexName: 'userId-sysRegDtm-index',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: { ':userId': query.userId }
            };
            command = new QueryCommand(input);
        } else {
            // 필터가 없는 경우 전체 Scan (보안상 최근 100개 제한)
            input = {
                TableName: tableNames.jobs,
                Limit: 100
            };
            command = new ScanCommand(input);
        }

        const data = await docClient.send(command);
        let items = data.Items || [];

        // Filter by status if requested (post-filter as we don't have partial compositie keys for status in GSI)
        if (query.status) {
            items = items.filter((item: any) => item.status === query.status);
        }

        // Sort if it was a Scan (Query with Index is already sorted)
        if (!query.owner && !query.userId) {
            items.sort((a: any, b: any) => b.sysRegDtm - a.sysRegDtm);
        }

        // Add signed URLs
        const itemsWithUrl = await Promise.all(items.map(async (item: any) => {
            if (item.status === 'DONE' && item.resultKey) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: bucketName,
                        Key: item.resultKey
                    });
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                    return { ...item, url };
                } catch (e) {
                    console.error('URL error for item', item.requestId, e);
                }
            }
            return item;
        }));

        return itemsWithUrl;
    } catch (err) {
        console.error('Jobs List Error:', err);
        return [];
    }
});
