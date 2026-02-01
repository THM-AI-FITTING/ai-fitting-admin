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
            ScanIndexForward: false, // Descending sort for GSI
        };

        if (query.owner) {
            // Use Owner GSI
            input = {
                ...input,
                IndexName: 'owner-sysRegDtm-index',
                KeyConditionExpression: '#owner = :owner',
                ExpressionAttributeNames: { '#owner': 'owner' },
                ExpressionAttributeValues: { ':owner': query.owner }
            };
            command = new QueryCommand(input);
        } else if (query.userId) {
            // Use UserID GSI
            input = {
                ...input,
                IndexName: 'userId-sysRegDtm-index',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: { ':userId': query.userId }
            };
            command = new QueryCommand(input);
        } else {
            // Fallback to Scan (Limit 100 for performance safety)
            // Note: Scan doesn't guarantee order effectively without sorting client side or using an index
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
