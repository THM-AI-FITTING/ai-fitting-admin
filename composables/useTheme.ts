/**
 * 어플리케이션의 테마(다크/라이트 모드)를 관리하는 컴포저블입니다.
 * 사용자의 설정 정보를 localStorage에 저장하고 body 태그의 class를 제어합니다.
 */
import { onMounted, watch } from 'vue';
import { useState } from '#app';

export const useTheme = () => {
    const theme = useState<'dark' | 'light'>('theme', () => 'dark');

    /**
     * 테마를 토글(다크 <-> 라이트)하고 설정을 저장합니다.
     */
    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
        if (typeof window !== 'undefined') {
            // 브라우저 로컬 스토리지에 테마 유지
            localStorage.setItem('theme-preference', theme.value);
            updateBodyClass();
        }
    };

    /**
     * body 태그에 테마 관련 class를 적용하여 CSS 변수를 제어합니다.
     */
    const updateBodyClass = () => {
        if (typeof document !== 'undefined') {
            if (theme.value === 'light') {
                document.body.classList.add('light-mode');
            } else {
                document.body.classList.remove('light-mode');
            }
        }
    };

    /**
     * 앱 초기 로드 시 저장된 테마 설정을 불러옵니다.
     */
    onMounted(() => {
        const savedTheme = localStorage.getItem('theme-preference') as 'dark' | 'light' | null;
        if (savedTheme) {
            theme.value = savedTheme;
        }
        updateBodyClass();
    });

    return {
        theme,
        toggleTheme
    };
};
