export default defineNuxtRouteMiddleware((to, from) => {
    const apiKey = useCookie('ai_admin_key')

    if (!apiKey.value && to.path !== '/login') {
        return navigateTo('/login')
    }

    if (apiKey.value && to.path === '/login') {
        return navigateTo('/')
    }
})
