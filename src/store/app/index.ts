import type { GlobalThemeOverrides } from 'naive-ui'
import { local, setLocale } from '@/utils'
import { colord } from 'colord'
import { set } from 'radash'
import themeConfig from './theme.json'

export type TransitionAnimation = '' | 'fade-slide' | 'fade-bottom' | 'fade-scale' | 'zoom-fade' | 'zoom-out'
export type LayoutMode = 'leftMenu' | 'topMenu' | 'mixMenu'

const { VITE_DEFAULT_LANG, VITE_COPYRIGHT_INFO } = import.meta.env

const docEle = ref(document.documentElement)

const { isFullscreen, toggle } = useFullscreen(docEle)

const { system, store: colorModeStore } = useColorMode({
  emitAuto: true,
})

export const useAppStore = defineStore('app-store', () => {
  // state
  const footerText = ref(VITE_COPYRIGHT_INFO)
  const lang = ref(VITE_DEFAULT_LANG)
  const theme = ref<GlobalThemeOverrides>(themeConfig as GlobalThemeOverrides)
  const primaryColor = ref(themeConfig.common.primaryColor)
  const collapsed = ref(false)
  const grayMode = ref(false)
  const colorWeak = ref(false)
  const loadFlag = ref(true)
  const showLogo = ref(true)
  const showTabs = ref(true)
  const showFooter = ref(true)
  const showProgress = ref(true)
  const showBreadcrumb = ref(true)
  const showBreadcrumbIcon = ref(true)
  const showWatermark = ref(false)
  const showSetting = ref(false)
  const transitionAnimation = ref<TransitionAnimation>('fade-slide')
  const layoutMode = ref<LayoutMode>('leftMenu')
  const contentFullScreen = ref(false)

  // getters
  const storeColorMode = computed(() => colorModeStore.value)
  const colorMode = computed(() => colorModeStore.value === 'auto' ? system.value : colorModeStore.value)
  const fullScreen = computed(() => isFullscreen.value)

  // actions
  /* 设置主题色 */
  function setPrimaryColor(color: string) {
    const brightenColor = colord(color).lighten(0.05).toHex()
    const darkenColor = colord(color).darken(0.05).toHex()
    set(theme.value, 'common.primaryColor', color)
    set(theme.value, 'common.primaryColorHover', brightenColor)
    set(theme.value, 'common.primaryColorPressed', darkenColor)
    set(theme.value, 'common.primaryColorSuppl', brightenColor)
  }

  // 重置所有设置
  function resetAlltheme() {
    theme.value = themeConfig as GlobalThemeOverrides
    primaryColor.value = '#18a058'
    collapsed.value = false
    grayMode.value = false
    colorWeak.value = false
    loadFlag.value = true
    showLogo.value = true
    showTabs.value = true
    showFooter.value = true
    showBreadcrumb.value = true
    showBreadcrumbIcon.value = true
    showWatermark.value = false
    transitionAnimation.value = 'fade-slide'
    layoutMode.value = 'leftMenu'
    contentFullScreen.value = false

    // 重置所有配色
    setPrimaryColor(primaryColor.value)
  }

  function setAppLang(newLang: App.lang) {
    setLocale(newLang)
    local.set('lang', newLang)
    lang.value = newLang
  }

  function setColorMode(mode: 'light' | 'dark' | 'auto') {
    colorModeStore.value = mode
  }

  /* 切换侧边栏收缩 */
  function toggleCollapse() {
    collapsed.value = !collapsed.value
  }

  /* 切换全屏 */
  function toggleFullScreen() {
    toggle()
  }

  /**
   * @description: 页面内容重载
   * @param {number} delay - 延迟毫秒数
   * @return {*}
   */
  async function reloadPage(delay = 600) {
    loadFlag.value = false
    await nextTick()
    if (delay) {
      setTimeout(() => {
        loadFlag.value = true
      }, delay)
    }
    else {
      loadFlag.value = true
    }
  }

  /* 切换色弱模式 */
  function toggleColorWeak() {
    docEle.value.classList.toggle('color-weak')
    colorWeak.value = docEle.value.classList.contains('color-weak')
  }

  /* 切换灰色模式 */
  function toggleGrayMode() {
    docEle.value.classList.toggle('gray-mode')
    grayMode.value = docEle.value.classList.contains('gray-mode')
  }

  return {
    footerText,
    lang,
    theme,
    primaryColor,
    collapsed,
    grayMode,
    colorWeak,
    loadFlag,
    showLogo,
    showTabs,
    showFooter,
    showProgress,
    showBreadcrumb,
    showBreadcrumbIcon,
    showWatermark,
    showSetting,
    transitionAnimation,
    layoutMode,
    contentFullScreen,
    storeColorMode,
    colorMode,
    fullScreen,
    resetAlltheme,
    setAppLang,
    setPrimaryColor,
    setColorMode,
    toggleCollapse,
    toggleFullScreen,
    reloadPage,
    toggleColorWeak,
    toggleGrayMode,
  }
}, {
  persist: {
    storage: localStorage,
  },
})
