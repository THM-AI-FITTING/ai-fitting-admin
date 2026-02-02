import { watch } from 'vue';
import { useState, useCookie } from '#app';

export const useTheme = () => {
    // 쿠키를 사용하여 서버 사이드에서도 테마 정보를 알 수 있게 합니다.
    const themeCookie = useCookie<'dark' | 'light'>('theme-preference', {
        default: () => 'dark',
        path: '/',
        maxAge: 60 * 60 * 24 * 365 // 1년 유지
    });

    const theme = useState<'dark' | 'light'>('theme', () => themeCookie.value || 'dark');

    /**
     * 테마를 토글(다크 <-> 라이트)하고 설정을 저장합니다.
     */
    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
        themeCookie.value = theme.value;
        updateBodyClass();
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

    // 테마 상태 변경 시 쿠키 동기화
    watch(theme, (newTheme) => {
        themeCookie.value = newTheme;
        updateBodyClass();
    });

    return {
        theme,
        toggleTheme,
        updateBodyClass
    };
};
