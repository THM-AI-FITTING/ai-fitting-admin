/**
 * 특정 가상 피팅 작업의 상세 정보를 조회하는 API입니다.
 * 요청 ID(requestId)를 기반으로 정보를 가져오며, 결과 이미지가 있으면 S3 URL을 생성합니다.
 */
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
            throw createError({ statusCode: 404, message: '작업을 찾을 수 없습니다.' });
        }

        const item = data.Item;

        // 작업이 완료(DONE) 상태이고 결과물 S3 키가 있는 경우
        if (item.status === 'DONE' && item.resultKey) {
            try {
                // 보안을 위해 1시간(3600초) 유효한 임시 URL 생성
                const command = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: item.resultKey
                });
                item.url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            } catch (e) {
                console.error('URL 생성 실패:', e);
            }
        }

        return item;
    } catch (err) {
        console.error('Job Detail Error:', err);
        throw createError({ statusCode: 500, message: 'Failed to fetch job' });
    }
});
