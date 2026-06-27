<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { fetchAppList, fetchGrantUserApp, fetchRevokeUserApp, fetchUpdateUserApp, fetchUserAppGrants } from '@/service'
import { NButton, NFlex, NPopconfirm, NSwitch, NTag, NText } from 'naive-ui'

interface AppGrantRow {
  app_code: string
  app_name: string
  perm_mode?: string
  description?: string | null
  grant?: Entity.UserApp
}

const { bool: visible, setTrue: openDialog, setFalse: closeDialog } = useBoolean(false)
const { bool: loading, setTrue: startLoad, setFalse: endLoad } = useBoolean(false)

const currentUser = ref<Entity.User | null>(null)
const allApps = ref<AppGrantRow[]>([])
const grantMap = ref<Map<string, Entity.UserApp>>(new Map())

const rows = computed<AppGrantRow[]>(() =>
  allApps.value.map(app => ({
    ...app,
    grant: grantMap.value.get(app.app_code),
  })),
)

async function openModal(user: Entity.User) {
  currentUser.value = user
  openDialog()
  await loadData()
}
defineExpose({ openModal })

async function loadData() {
  if (!currentUser.value?.id)
    return
  startLoad()
  const [appsRes, grantsRes] = await Promise.all([
    fetchAppList(),
    fetchUserAppGrants(currentUser.value.id),
  ])
  if (appsRes.isSuccess && appsRes.data) {
    allApps.value = (appsRes.data as any[]).map(a => ({
      app_code: a.app_code,
      app_name: a.app_name,
      perm_mode: a.perm_mode,
      description: a.description,
    }))
  }
  if (grantsRes.isSuccess && grantsRes.data) {
    grantMap.value = new Map(grantsRes.data.map((g: Entity.UserApp) => [g.app_code, g]))
  }
  endLoad()
}

async function toggleGrant(row: AppGrantRow) {
  if (!currentUser.value?.id)
    return
  if (row.grant) {
    const { isSuccess } = await fetchRevokeUserApp(currentUser.value.id, row.app_code)
    if (isSuccess) {
      grantMap.value.delete(row.app_code)
      window.$message?.success('已撤销授权')
    }
  }
  else {
    const { isSuccess, data } = await fetchGrantUserApp(currentUser.value.id, {
      app_code: row.app_code,
      is_active: true,
    })
    if (isSuccess && data) {
      grantMap.value.set(row.app_code, data as Entity.UserApp)
      window.$message?.success('授权成功')
    }
  }
}

async function toggleActive(row: AppGrantRow, val: boolean) {
  if (!currentUser.value?.id || !row.grant)
    return
  const { isSuccess, data } = await fetchUpdateUserApp(currentUser.value.id, row.app_code, { is_active: val })
  if (isSuccess && data)
    grantMap.value.set(row.app_code, data as Entity.UserApp)
}

const columns: DataTableColumns<AppGrantRow> = [
  {
    title: '应用名称',
    key: 'app_name',
    width: 140,
  },
  {
    title: '应用编码',
    key: 'app_code',
    width: 130,
    render: row => (
      <NTag size="small" bordered={false} type="info">{row.app_code}</NTag>
    ),
  },
  {
    title: '授权状态',
    key: 'granted',
    width: 90,
    align: 'center',
    render: row => row.grant
      ? <NTag type="success" size="small">已授权</NTag>
      : <NTag type="default" size="small">未授权</NTag>,
  },
  {
    title: '是否启用',
    key: 'is_active',
    width: 80,
    align: 'center',
    render: row => row.grant
      ? (
          <NSwitch
            value={row.grant.is_active}
            size="small"
            onUpdateValue={(val: boolean) => toggleActive(row, val)}
          />
        )
      : <NText depth={3} style="font-size:12px">-</NText>,
  },
  {
    title: '过期时间',
    key: 'expired_at',
    render: row => row.grant
      ? row.grant.expired_at
        ? <NTag size="small" type="warning">{new Date(row.grant.expired_at).toLocaleDateString()}</NTag>
        : <NTag size="small" type="success">永久</NTag>
      : <NText depth={3} style="font-size:12px">-</NText>,
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 100,
    render: row => row.grant
      ? (
          <NPopconfirm onPositiveClick={() => toggleGrant(row)}>
            {{
              default: () => `确认撤销「${row.app_name}」的访问权限？`,
              trigger: () => <NButton size="small" type="error" ghost>撤销授权</NButton>,
            }}
          </NPopconfirm>
        )
      : (
          <NButton size="small" type="primary" ghost onClick={() => toggleGrant(row)}>
            授权访问
          </NButton>
        ),
  },
]
</script>

<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    style="width: 700px"
    :title="`平台授权管理 - ${currentUser?.username}`"
    :mask-closable="false"
  >
    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :row-key="(row) => row.app_code"
      size="small"
    />

    <template #footer>
      <NFlex justify="end">
        <NButton @click="closeDialog">
          关闭
        </NButton>
      </NFlex>
    </template>
  </n-modal>
</template>
