<!-- 
  대시보드 메인 페이지
  전체 작업 통계 현황과 최근 작업/실패 내역을 한눈에 확인할 수 있는 요약 화면입니다.
-->
<template>
  <div class="dashboard-page">
    <!-- Stat Cards -->
    <div class="stats-grid">
      <BaseCard class="stat-card animate-fade-in stagger-1">
        <template #header>
          <div class="stat-header">
            <span class="stat-title">전체 작업 수</span>
            <div class="icon-box primary">
              <Activity :size="20" />
            </div>
          </div>
        </template>
        <div class="stat-value">{{ stats?.totalJobs?.toLocaleString() || 0 }}</div>
        <div class="stat-change positive">
          <TrendingUp :size="16" />
          <span>전체 누적</span>
        </div>
      </BaseCard>

      <BaseCard class="stat-card animate-fade-in stagger-2">
        <template #header>
          <div class="stat-header">
            <span class="stat-title">진행 중</span>
            <div class="icon-box warning">
              <Loader2 :size="20" />
            </div>
          </div>
        </template>
        <div class="stat-value">{{ stats?.statusCounts?.START || 0 }}</div>
        <div class="stat-desc">현재 처리 중</div>
      </BaseCard>

      <BaseCard class="stat-card animate-fade-in stagger-3">
        <template #header>
          <div class="stat-header">
            <span class="stat-title">완료됨</span>
            <div class="icon-box success">
              <CheckCircle :size="20" />
            </div>
          </div>
        </template>
        <div class="stat-value">{{ stats?.statusCounts?.DONE?.toLocaleString() || 0 }}</div>
        <div class="stat-desc">성공적으로 완료</div>
      </BaseCard>

      <BaseCard class="stat-card animate-fade-in stagger-4">
        <template #header>
          <div class="stat-header">
            <span class="stat-title">실패</span>
            <div class="icon-box danger">
              <AlertOctagon :size="20" />
            </div>
          </div>
        </template>
        <div class="stat-value">{{ stats?.statusCounts?.FAILED || 0 }}</div>
        <div class="stat-change negative" v-if="(stats?.statusCounts?.FAILED || 0) > 0">
          <span>확인 필요</span>
        </div>
      </BaseCard>
    </div>

    <div class="content-grid">
      <!-- Recent Jobs -->
      <div class="section-main animate-fade-in stagger-4">
        <BaseCard title="최근 작업">
          <template #header>
            <BaseButton size="sm" variant="ghost" @click="refresh">
              <RefreshCw :size="16" :class="{ 'spin': pending }" />
            </BaseButton>
          </template>
          
          <!-- Desktop Table View -->
          <div class="hidden-mobile">
            <BaseTable 
              :columns="jobColumns" 
              :data="stats?.recentJobs || []" 
              :loading="pending"
              @row-click="goToJobDetail"
            >
              <template #status="{ row }">
                <StatusBadge :status="row.status" />
              </template>
              <template #sysRegDtm="{ row }">
                {{ formatDate(row.sysRegDtm) }}
              </template>
            </BaseTable>
          </div>

          <!-- Mobile Card List View -->
          <div class="mobile-only job-list-mobile">
            <div 
              v-for="job in stats?.recentJobs || []" 
              :key="job.requestId"
              class="mobile-job-card"
              @click="goToJobDetail(job)"
            >
              <div class="job-card-header">
                <span class="job-id mono">{{ job.requestId }}</span>
                <StatusBadge :status="job.status" size="sm" />
              </div>
              <div class="job-card-footer">
                <span class="job-owner">{{ job.owner }}</span>
                <span class="job-date">{{ formatDate(job.sysRegDtm) }}</span>
              </div>
            </div>
          </div>
          
          <template #footer>
            <div class="flex-center">
              <BaseButton variant="ghost" size="sm" @click="$router.push('/jobs')">
                전체 보기
              </BaseButton>
            </div>
          </template>
        </BaseCard>
      </div>

      <!-- Recent Failed Jobs -->
      <div class="section-side animate-fade-in stagger-5">
        <BaseCard title="최근 실패 목록">
          <div class="failed-list">
            <div 
              v-for="job in stats?.failedJobs || []" 
              :key="job.requestId" 
              class="failed-item"
              @click="goToJobDetail(job)"
            >
              <div class="failed-header">
                <span class="failed-id">{{ job.requestId }}</span>
                <span class="failed-time">{{ formatTimeAgo(job.sysRegDtm) }}</span>
              </div>
              <div class="failed-reason">
                {{ job.message || '상세 사유 없음' }}
              </div>
            </div>
            
            <div v-if="!stats?.failedJobs?.length" class="empty-text">
              최근 실패 내역이 없습니다.
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { 
  Activity, 
  TrendingUp, 
  Loader2, 
  CheckCircle, 
  AlertOctagon,
  RefreshCw 
} from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseTable from '~/components/ui/BaseTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';

definePageMeta({
  title: '대시보드'
});

const config = useRuntimeConfig();
console.log('Using API Base:', config.public.apiBase); // 배포된 페이지에서 이 값이 어떻게 찍히는지 확인용
const { data: stats, pending, refresh } = await useFetch(`${config.public.apiBase}/api/stats`);

const jobColumns = [
  { key: 'requestId', label: '요청 ID' },
  { key: 'owner', label: '파트너' },
  { key: 'status', label: '상태' },
  { key: 'sysRegDtm', label: '요청 시간' },
];

const formatDate = (ts: number) => new Date(ts).toLocaleString('ko-KR');

const formatTimeAgo = (ts: any) => {
  const date = new Date(ts);
  const time = date.getTime();
  if (!time || isNaN(time)) return '-일 전';
  
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

const router = useRouter();
const goToJobDetail = (row: any) => {
  router.push(`/jobs/${row.requestId}`);
};
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

.stat-card :deep(.card-header) {
  padding: 1rem 1.25rem 0.5rem;
  border-bottom: none;
}

.stat-card :deep(.card-body) {
  padding: 0 1.25rem 1rem;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stat-title {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  margin-right: 1rem;
}

.icon-box {
  padding: 0.6rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box.primary { color: var(--color-primary); background: rgba(99, 102, 241, 0.1); }
.icon-box.warning { color: var(--color-warning); background: rgba(245, 158, 11, 0.1); }
.icon-box.success { color: var(--color-success); background: rgba(16, 185, 129, 0.1); }
.icon-box.danger { color: var(--color-danger); background: rgba(239, 68, 68, 0.1); }

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .stat-value {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .stat-card :deep(.card-body) {
    padding: 0 1rem 0.75rem;
  }
  .stat-header {
    width: 100%;
    justify-content: space-between; /* 아이콘을 우측 끝으로 밀어냄 */
    margin-bottom: 0.5rem;
  }
  .stat-title {
    font-size: 0.8rem;
    white-space: nowrap; /* 줄바꿈 방지 */
    margin-right: 0.25rem;
  }
  .stat-change, .stat-desc {
    font-size: 0.75rem;
    white-space: nowrap; /* 줄바꿈 방지 */
    letter-spacing: -0.02em;
  }
  .icon-box {
    padding: 0.4rem; /* 모바일에서 아이콘 박스 크기 축소 */
  }
}

.stat-change, .stat-desc {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-change.positive { color: var(--color-success); }
.stat-change.negative { color: var(--color-danger); }
.stat-desc { color: var(--color-text-muted); }

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    width: 100%;
    overflow: hidden;
  }
}

@media (max-width: 640px) {
  .dashboard-page {
    gap: 1rem;
  }
}

.section-main,
.section-side {
  min-width: 0;
  width: 100%;
}

.spin {
  animation: spin 1s linear infinite;
}

/* Mobile Job Card List */
.mobile-only {
  display: none !important; /* 기본적으로 숨김 (PC) */
}

@media (max-width: 768px) {
  .hidden-mobile {
    display: none !important; /* 모바일에서 숨김 */
  }
  .mobile-only {
    display: block !important; /* 모바일에서만 표시 */
  }
}

.job-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.mobile-job-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.mobile-job-card:active {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.98);
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.job-id {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.job-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.job-owner {
  font-weight: 500;
  color: var(--color-text-main);
}

/* Failed List */
.failed-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.failed-item {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-md);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.failed-item:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: translateX(4px);
}

.failed-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.failed-id {
  font-weight: 600;
  color: var(--color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.failed-time {
  color: var(--color-text-muted);
  flex-shrink: 0;
  white-space: nowrap;
  text-align: right;
  min-width: 70px;
}

.failed-reason {
  font-size: 0.9rem;
  color: var(--color-danger);
  word-break: break-all;
}

.empty-text {
  text-align: center;
  color: var(--color-text-muted);
  padding: 2rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
