/**
 * AI 가상 피팅 작업 목록의 상태를 관리하는 컴포저블입니다.
 * 페이지 이동 시에도 필터, 페이지 크기, 보기 모드 등을 유지하기 위해 Nuxt의 useState를 사용합니다.
 */
import { useState } from '#app';

export const useJobsState = () => {
    // 검색 필터 상태 (파트너명, 작업 상태, 사용자 ID)
    const filters = useState('jobs-filters', () => ({
        owner: '',
        status: '',
        userId: ''
    }));

    // 현재 목록에 표시할 아이템 개수 (더보기 기능에 사용)
    const pageSize = useState('jobs-pageSize', () => 15);

    // 작업 목록 보기 모드 ('list': 리스트형, 'grid': 썸네일형)
    const viewMode = useState<'list' | 'grid'>('jobs-viewMode', () => 'list');

    return {
        filters,
        pageSize,
        viewMode
    };
};
