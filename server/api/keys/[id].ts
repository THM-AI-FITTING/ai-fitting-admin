import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const method = event.method;
    const { docClient, tableNames } = useAws();

    if (method === 'GET') {
        try {
            const data = await docClient.send(new GetCommand({
                TableName: tableNames.keys,
                Key: { apiKey: id }
            }));
            return data.Item;
        } catch (err) {
            console.error('Fetch Key Error:', err);
            throw createError({ statusCode: 500, message: 'Failed to fetch key' });
        }
    }

    if (method === 'PUT') {
        const body = await readBody(event);

        try {
            await docClient.send(new UpdateCommand({
                TableName: tableNames.keys,
                Key: { apiKey: id },
                UpdateExpression: 'set #status = :s, #owner = :o, #createdAt = :c, #expiredAt = :e',
                ExpressionAttributeNames: {
                    '#status': 'status',
                    '#owner': 'owner',
                    '#createdAt': 'createdAt',
                    '#expiredAt': 'expiredAt'
                },
                ExpressionAttributeValues: {
                    ':s': body.status,
                    ':o': body.owner,
                    ':c': body.createdAt,
                    ':e': body.expiredAt
                }
            }));
            return { success: true };
        } catch (err) {
            console.error('Update Key Error:', err);
            throw createError({ statusCode: 500, message: 'Failed to update key' });
        }
    }

    if (method === 'DELETE') {
        try {
            await docClient.send(new DeleteCommand({
                TableName: tableNames.keys,
                Key: { apiKey: id }
            }));
            return { success: true };
        } catch (err) {
            console.error('Delete Key Error:', err);
            throw createError({ statusCode: 500, message: 'Failed to delete key' });
        }
    }
});
