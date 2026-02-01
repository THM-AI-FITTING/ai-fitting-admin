import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id'); // this is requestId
    const { docClient, s3, tableNames, bucketName } = useAws();

    try {
        // 1. Get Job to find resultKey
        const jobData = await docClient.send(new GetCommand({
            TableName: tableNames.jobs,
            Key: { requestId: id }
        }));

        const job = jobData.Item;
        if (!job || !job.resultKey) {
            throw createError({ statusCode: 404, message: 'Image not found' });
        }

        // 2. Generate Signed URL
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: job.resultKey
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return {
            url,
            expiresAt: Date.now() + 3600000
        };
    } catch (err) {
        console.error('Signed URL Error:', err);
        throw createError({ statusCode: 500, message: 'Failed to generate URL' });
    }
});
