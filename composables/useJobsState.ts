import { useState } from '#app';

export const useJobsState = () => {
    const filters = useState('jobs-filters', () => ({
        owner: '',
        status: '',
        userId: ''
    }));

    const pageSize = useState('jobs-pageSize', () => 15);
    const viewMode = useState<'list' | 'grid'>('jobs-viewMode', () => 'list');

    return {
        filters,
        pageSize,
        viewMode
    };
};
