import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const { docClient, s3, tableNames, bucketName } = useAws();

    if (!id) throw createError({ statusCode: 400 });

    try {
        const data = await docClient.send(new GetCommand({
            TableName: tableNames.jobs,
            Key: { requestId: id }
        }));

        if (!data.Item) {
            throw createError({ statusCode: 404, message: 'Job not found' });
        }

        const item = data.Item;
        if (item.status === 'DONE' && item.resultKey) {
            try {
                const command = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: item.resultKey
                });
                item.url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            } catch (e) {
                console.error('URL generation error', e);
            }
        }

        return item;
    } catch (err) {
        console.error('Job Detail Error:', err);
        throw createError({ statusCode: 500, message: 'Failed to fetch job' });
    }
});
