/**
 * 이미지 미리보기 또는 다운로드를 위한 S3 Presigned URL을 명시적으로 생성하는 API입니다.
 */
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id'); // this is requestId
    const { docClient, s3, tableNames, bucketName } = useAws();

    try {
        // 1. 해당 requestId에 해당하는 작업 정보 조회 (resultKey 확인용)
        const jobData = await docClient.send(new GetCommand({
            TableName: tableNames.jobs,
            Key: { requestId: id }
        }));

        const job = jobData.Item;
        if (!job || !job.resultKey) {
            throw createError({ statusCode: 404, message: '이미지 정보를 찾을 수 없습니다.' });
        }

        // 2. S3 접근을 위한 서명된 URL 생성 (1시간 유효)
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
