import type { RouteLocationNormalized } from 'vue-router'
import { router } from '@/router'

export const useTabStore = defineStore('tab-store', () => {
  // state
  const pinTabs = ref<RouteLocationNormalized[]>([])
  const tabs = ref<RouteLocationNormalized[]>([])
  const currentTabPath = ref('')

  // getters
  const allTabs = computed(() => [...pinTabs.value, ...tabs.value])

  // actions
  function addTab(route: RouteLocationNormalized) {
    // 根据meta确定是否不添加，可用于错误页,登录页等
    if (route.meta.without_tab)
      return

    // 如果标签名称已存在则不添加
    if (hasExistTab(route.fullPath as string))
      return

    // 根据meta.pinTab传递到不同的分组中
    if (route.meta.pin_tab)
      pinTabs.value.push(route)
    else
      tabs.value.push(route)
  }

  async function closeTab(fullPath: string) {
    const tabsLength = tabs.value.length
    // 如果动态标签大于一个,才会标签跳转
    if (tabs.value.length > 1) {
      // 获取关闭的标签索引
      const index = getTabIndex(fullPath)
      const isLast = index + 1 === tabsLength
      // 如果是关闭的当前页面，路由跳转到原先标签的后一个标签
      if (currentTabPath.value === fullPath && !isLast) {
        // 跳转到后一个标签
        router.push(tabs.value[index + 1].fullPath)
      }
      else if (currentTabPath.value === fullPath && isLast) {
        // 已经是最后一个了，就跳转前一个
        router.push(tabs.value[index - 1].fullPath)
      }
    }
    // 删除标签
    tabs.value = tabs.value.filter((item) => {
      return item.fullPath !== fullPath
    })
    // 删除后如果清空了，就跳转到默认首页
    if (tabsLength - 1 === 0)
      router.push('/')
  }

  function closeOtherTabs(fullPath: string) {
    const index = getTabIndex(fullPath)
    tabs.value = tabs.value.filter((_item, i) => i === index)
  }

  function closeLeftTabs(fullPath: string) {
    const index = getTabIndex(fullPath)
    tabs.value = tabs.value.filter((_item, i) => i >= index)
  }

  function closeRightTabs(fullPath: string) {
    const index = getTabIndex(fullPath)
    tabs.value = tabs.value.filter((_item, i) => i <= index)
  }

  function clearAllTabs() {
    tabs.value.length = 0
    pinTabs.value.length = 0
  }

  function closeAllTabs() {
    tabs.value.length = 0
    router.push('/')
  }

  function hasExistTab(fullPath: string) {
    const _tabs = [...tabs.value, ...pinTabs.value]
    return _tabs.some((item) => {
      return item.fullPath === fullPath
    })
  }

  /* 设置当前激活的标签 */
  function setCurrentTab(fullPath: string) {
    currentTabPath.value = fullPath
  }

  function getTabIndex(fullPath: string) {
    return tabs.value.findIndex((item) => {
      return item.fullPath === fullPath
    })
  }

  function modifyTab(fullPath: string, modifyFn: (route: RouteLocationNormalized) => void) {
    const index = getTabIndex(fullPath)
    modifyFn(tabs.value[index])
  }

  return {
    pinTabs,
    tabs,
    currentTabPath,
    allTabs,
    addTab,
    closeTab,
    closeOtherTabs,
    closeLeftTabs,
    closeRightTabs,
    clearAllTabs,
    closeAllTabs,
    hasExistTab,
    setCurrentTab,
    getTabIndex,
    modifyTab,
  }
}, {
  persist: {
    storage: sessionStorage,
  },
})
