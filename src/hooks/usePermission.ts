import { useRouteStore } from '@/store'

/** 权限判断 */
export function usePermission() {
  const userStore = useRouteStore()

  function hasPermission(
    permission: string[] = [],
  ) {
    // super_admin 拥有所有权限
    if (userStore.roles.includes('super_admin'))
      return true

    if (!permission)
      return true
    if (!userStore.permission_keys)
      return false
    if (permission.length === 0)
      return true
    if (permission.length > 0 && userStore.permission_keys.length === 0)
      return false
    return permission.some(item => userStore.permission_keys.includes(item))
  }

  return {
    hasPermission,
  }
}
