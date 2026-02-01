import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default defineEventHandler(async (event) => {
    const { docClient, s3, tableNames, bucketName } = useAws();

    try {
        const data = await docClient.send(new ScanCommand({
            TableName: tableNames.jobs,
            FilterExpression: '#status = :done',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':done': 'DONE' },
            Limit: 100
        }));

        const rawItems = data.Items || [];
        rawItems.sort((a: any, b: any) => b.sysModDtm - a.sysModDtm);

        const items = await Promise.all(rawItems.map(async (item: any) => {
            if (item.resultKey) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: bucketName,
                        Key: item.resultKey,
                    });
                    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                    return { ...item, url };
                } catch (e) {
                    return { ...item, url: '' };
                }
            }
            return item;
        }));

        return items.filter((item: any) => item.resultKey);
    } catch (err) {
        console.error('Image List Error:', err);
        return [];
    }
});
