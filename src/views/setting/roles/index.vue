<script setup lang="tsx">
import type { ActionItem } from '@/components/basicTable'
import { BasicTable, TableAction } from '@/components/basicTable'
import { fetchAppList, fetchDeleteRole, fetchRolesByApp } from '@/service'
import { DeleteOutlined, EditOutlined } from '@vicons/antd'
import RoleModal from './components/RoleModal.vue'
import TableModal from './components/TableModal.vue'

const tableModalRef = ref<InstanceType<typeof TableModal>>()
const roleModalRef = ref<InstanceType<typeof RoleModal>>()
const tableRef = ref()

interface AppRow { id?: number, app_code?: string, app_name?: string }
const appList = ref<AppRow[]>([])
const selectedApp = ref<AppRow | null>(null)
const appLoading = ref(false)

const columns = [
  { title: '角色名称', key: 'role_name', width: 180 },
  { title: '角色编码', key: 'role_code', ellipsis: { tooltip: true } },
]

function createActions(record: Entity.Role): ActionItem[] {
  return [
    {
      label: '分配权限',
      type: 'info',
      auth: ['role:menuEdit'],
      onClick: () => roleModalRef.value?.openModal(record),
    },
    {
      label: '编辑',
      icon: EditOutlined,
      auth: ['role:edit'],
      onClick: () => tableModalRef.value?.openModal('edit', record),
    },
    {
      label: '删除',
      icon: DeleteOutlined,
      type: 'error',
      auth: ['role:delete'],
      popConfirm: {
        title: `确认删除角色「${record.role_name}」？`,
        confirm: () => deleteRole(record.id!),
      },
    },
  ]
}

const actionColumn = reactive({
  title: '操作',
  key: 'action',
  align: 'center',
  width: 260,
  render(record: Entity.Role) {
    return h(TableAction as any, {
      style: 'button',
      actions: createActions(record),
    })
  },
})

onMounted(() => {
  loadAppList()
})

async function loadAppList() {
  appLoading.value = true
  const { data, isSuccess } = await fetchAppList()
  if (isSuccess) {
    appList.value = data ?? []
    if (appList.value.length > 0)
      await selectApp(appList.value[0])
  }
  appLoading.value = false
}

async function selectApp(app: AppRow) {
  selectedApp.value = app
  await nextTick()
  tableRef.value?.reload()
}

async function loadRoleData() {
  if (!selectedApp.value?.app_code)
    return { data: [], count: 0 }
  const { data, isSuccess } = await fetchRolesByApp(selectedApp.value.app_code)
  const list = Array.isArray(data) ? data : ((data as any)?.items ?? [])
  const total = typeof (data as any)?.total === 'number' ? (data as any).total : list.length
  return { data: isSuccess ? list : [], count: isSuccess ? total : 0 }
}

async function deleteRole(id: number) {
  const { isSuccess } = await fetchDeleteRole(id)
  if (isSuccess) {
    window.$message.success('删除成功')
    tableRef.value?.reload()
  }
}
</script>

<template>
  <NFlex :wrap="false" class="h-full">
    <!-- 左侧：应用列表 -->
    <n-card class="w-56 shrink-0" title="应用列表" size="small" :loading="appLoading">
      <n-list hoverable clickable :show-divider="false">
        <n-list-item
          v-for="app in appList"
          :key="app.app_code"
          :class="selectedApp?.app_code === app.app_code ? 'bg-primary/10 rounded' : ''"
          style="padding: 8px 12px"
          @click="selectApp(app)"
        >
          <div class="font-medium text-sm leading-tight">
            {{ app.app_name }}
          </div>
          <div class="text-xs text-gray-400 mt-0.5">
            {{ app.app_code }}
          </div>
        </n-list-item>
        <n-empty v-if="!appLoading && appList.length === 0" description="暂无应用" size="small" class="py-4" />
      </n-list>
    </n-card>

    <!-- 右侧：角色表格 -->
    <n-card class="flex-1 min-w-0" size="small">
      <template #header>
        <span v-if="selectedApp" class="font-medium">{{ selectedApp.app_name }}</span>
        <n-text v-else depth="3">
          请先选择应用
        </n-text>
      </template>

      <BasicTable
        ref="tableRef"
        :columns="columns"
        :request="loadRoleData"
        :row-key="(row: Entity.Role) => row.id"
        :action-column="actionColumn"
        :pagination="false"
        size="small"
        :scroll-x="700"
      >
        <template #tableTitle>
          <NButton
            v-if="selectedApp"
            v-permission="['role:add']"
            type="primary"
            @click="tableModalRef?.openModal('add')"
          >
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            新建
          </NButton>
        </template>
        <template #toolbar />
      </BasicTable>

      <TableModal
        ref="tableModalRef"
        :app-code="selectedApp?.app_code ?? ''"
        modal-name="角色"
        @close="() => tableRef?.reload()"
      />
      <RoleModal
        ref="roleModalRef"
        :app-code="selectedApp?.app_code ?? ''"
        modal-name="权限分配"
        @close="() => tableRef?.reload()"
      />
    </n-card>
  </NFlex>
</template>
