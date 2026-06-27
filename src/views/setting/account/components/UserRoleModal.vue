<script setup lang="tsx">
import { useBoolean } from '@/hooks'
import { fetchAppList, fetchAssignUserRole, fetchRevokeUserRole, fetchRolesByApp, fetchUserAppGrants, fetchUserRoles } from '@/service'

interface AppOption {
  app_code: string
  app_name: string
}

const { bool: visible, setTrue: openDialog, setFalse: closeDialog } = useBoolean(false)
const { bool: loading, setTrue: startLoad, setFalse: endLoad } = useBoolean(false)
const { bool: submitLoading, setTrue: startSubmit, setFalse: endSubmit } = useBoolean(false)

const currentUser = ref<Entity.User | null>(null)
const grantedApps = ref<AppOption[]>([])
const selectedApp = ref<string | null>(null)

const allRoles = ref<Entity.Role[]>([])
const originalRoleIds = ref<number[]>([])
const selectedRoles = ref<number[]>([])

const appOptions = computed(() =>
  grantedApps.value.map(app => ({ label: app.app_name, value: app.app_code })),
)

const roleOptions = computed(() =>
  allRoles.value.map(role => ({
    label: `${role.role_name} (${role.role_code})`,
    value: role.id!,
    disabled: !selectedApp.value,
  })),
)

async function openModal(user: Entity.User) {
  currentUser.value = user
  selectedApp.value = null
  allRoles.value = []
  originalRoleIds.value = []
  selectedRoles.value = []
  openDialog()
  await loadGrantedApps()
}
defineExpose({ openModal })

async function loadGrantedApps() {
  if (!currentUser.value?.id)
    return
  startLoad()
  const [appsRes, grantsRes] = await Promise.all([
    fetchAppList(),
    fetchUserAppGrants(currentUser.value.id),
  ])

  let apps: AppOption[] = []
  if (appsRes.isSuccess && appsRes.data) {
    apps = (appsRes.data as any[]).map(a => ({
      app_code: a.app_code,
      app_name: a.app_name,
    }))
  }

  let grantedCodes = new Set<string>()
  if (grantsRes.isSuccess && grantsRes.data) {
    grantedCodes = new Set(grantsRes.data.map((g: Entity.UserApp) => g.app_code))
  }

  // 只保留已授权且启用的平台
  grantedApps.value = apps.filter(app => grantedCodes.has(app.app_code))

  // 默认选中第一个平台
  if (grantedApps.value.length > 0 && !selectedApp.value)
    selectedApp.value = grantedApps.value[0].app_code

  await loadAppRoles()
  endLoad()
}

async function loadAppRoles() {
  if (!currentUser.value?.id || !selectedApp.value)
    return
  startLoad()
  const [rolesRes, userRolesRes] = await Promise.all([
    fetchRolesByApp(selectedApp.value),
    fetchUserRoles(currentUser.value.id, selectedApp.value),
  ])

  if (rolesRes.isSuccess && rolesRes.data)
    allRoles.value = rolesRes.data
  else
    allRoles.value = []

  if (userRolesRes.isSuccess && userRolesRes.data) {
    originalRoleIds.value = userRolesRes.data.map((r: Entity.Role) => r.id!).filter(Boolean)
  }
  else {
    originalRoleIds.value = []
  }
  selectedRoles.value = [...originalRoleIds.value]
  endLoad()
}

watch(selectedApp, () => {
  loadAppRoles()
})

async function submit() {
  if (!currentUser.value?.id || !selectedApp.value)
    return
  startSubmit()
  try {
    const userId = currentUser.value.id
    const original = new Set(originalRoleIds.value)
    const selected = new Set(selectedRoles.value)

    const toAdd = [...selected].filter(id => !original.has(id))
    const toRemove = [...original].filter(id => !selected.has(id))

    await Promise.all([
      ...toAdd.map(roleId => fetchAssignUserRole(userId, roleId)),
      ...toRemove.map(roleId => fetchRevokeUserRole(userId, roleId)),
    ])

    window.$message.success('角色绑定已更新')
    await loadAppRoles()
    closeModal()
  }
  finally {
    endSubmit()
  }
}
</script>

<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    style="width: 640px"
    :title="`角色绑定 - ${currentUser?.username}`"
    :mask-closable="false"
  >
    <n-spin :show="loading" description="加载中...">
      <n-empty v-if="!loading && grantedApps.length === 0" description="该用户暂无已授权平台，请先到「平台授权」开通" class="py-8" />
      <template v-else>
        <n-form-item label="选择平台" label-placement="left" :label-width="70">
          <n-select
            v-model:value="selectedApp"
            :options="appOptions"
            placeholder="请选择已授权平台"
            clearable
          />
        </n-form-item>

        <n-empty v-if="!loading && selectedApp && allRoles.length === 0" description="该平台暂无角色" class="py-6" />
        <n-transfer
          v-else-if="selectedApp"
          v-model:value="selectedRoles"
          :options="roleOptions"
          source-title="可选角色"
          target-title="已绑定角色"
          class="mt-4"
        />
      </template>
    </n-spin>

    <template #action>
      <n-space justify="center">
        <n-button @click="closeDialog">
          取消
        </n-button>
        <n-button type="primary" :loading="submitLoading" :disabled="!selectedApp" @click="submit">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
