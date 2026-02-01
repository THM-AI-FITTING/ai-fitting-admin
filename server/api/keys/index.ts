import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

export default defineEventHandler(async (event) => {
    const method = event.method;
    const { docClient, tableNames } = useAws();

    if (method === 'GET') {
        try {
            const data = await docClient.send(new ScanCommand({
                TableName: tableNames.keys
            }));

            const items = data.Items || [];

            // Mask keys: Show first 3 characters, mask the rest.
            return items.map((item: any) => {
                const key = item.apiKey || '';
                let masked = '';
                if (key.length > 3) {
                    masked = key.substring(0, 3) + '*'.repeat(key.length - 3);
                } else {
                    masked = '*'.repeat(key.length);
                }
                return {
                    ...item,
                    maskedKey: masked || '****'
                };
            });
        } catch (err) {
            console.error('List Keys Error:', err);
            return [];
        }
    }

    if (method === 'POST') {
        const body = await readBody(event);

        // Generate random key: xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx (8 chars each part)
        const gen = (len: number) => Math.random().toString(36).substring(2, 2 + len).padEnd(len, '0');
        const apiKey = `${gen(8)}-${gen(8)}-${gen(8)}-${gen(8)}`;

        const createdAt = body.createdAt || Date.now();
        const expiredAt = body.expiredAt || null;

        const newItem = {
            apiKey,
            owner: body.owner,
            status: 'ACTIVE',
            expiredAt,
            createdAt
        };

        try {
            await docClient.send(new PutCommand({
                TableName: tableNames.keys,
                Item: newItem
            }));

            return newItem; // Return full item including apiKey only once
        } catch (err) {
            console.error('Create Key Error:', err);
            throw createError({ statusCode: 500, message: 'Failed to create key' });
        }
    }
});
