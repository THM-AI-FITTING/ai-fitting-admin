import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export default defineEventHandler(async (event) => {
    const { docClient, tableNames } = useAws();

    try {
        // 1. Scan Jobs Table (Limit to N items to avoid massive scan in demo)
        // In a real high-scale scenario, we should use a separate aggregation table or metrics.
        // For now, we scan up to 1000 items to calculate stats.
        const jobData = await docClient.send(new ScanCommand({
            TableName: tableNames.jobs,
            Limit: 1000,

        }));

        const jobs = jobData.Items || [];

        // Calculate Counts
        const statusCounts = {
            START: 0,
            DONE: 0,
            FAILED: 0
        };

        jobs.forEach((job: any) => {
            if (statusCounts[job.status as keyof typeof statusCounts] !== undefined) {
                statusCounts[job.status as keyof typeof statusCounts]++;
            }
        });

        // Recent Jobs (Sort by sysRegDtm desc)
        // Client-side sort of the 1000 items
        const sortedJobs = [...jobs].sort((a: any, b: any) => b.sysRegDtm - a.sysRegDtm);

        const recentJobs = sortedJobs.slice(0, 5);

        // Failed Jobs
        const failedJobs = sortedJobs
            .filter((job: any) => job.status === 'FAILED')
            .slice(0, 5);

        return {
            totalJobs: jobs.length,
            statusCounts,
            recentJobs,
            failedJobs
        };
    } catch (err) {
        console.error('DynamoDB Stats Error:', err);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch dashboard stats'
        });
    }
});
