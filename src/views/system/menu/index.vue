<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui'
import CopyText from '@/components/custom/CopyText.vue'
import { useBoolean, usePermission } from '@/hooks'
import { fetchAllRoutes, fetchAppList, fetchDeleteRoutes } from '@/service'
import { arrayToTree, createIcon } from '@/utils'
import { NButton, NFlex, NPopconfirm, NTag } from 'naive-ui'
import TableModal from './components/TableModal.vue'

const { hasPermission } = usePermission()
const { bool: appLoading, setTrue: startAppLoading, setFalse: endAppLoading } = useBoolean(false)
const { bool: menuLoading, setTrue: startMenuLoading, setFalse: endMenuLoading } = useBoolean(false)

const tableModalRef = ref<InstanceType<typeof TableModal>>()
const appList = ref<Entity.App[]>([])
const selectedApp = ref<Entity.App | null>(null)
const menuList = ref<AppRoute.AdminMenu[]>([])

const menuTypeMap: Record<AppRoute.MenuTypeCode, { type: NaiveUI.ThemeColor, label: string }> = {
  M: { type: 'primary', label: '目录' },
  C: { type: 'success', label: '菜单' },
  F: { type: 'info', label: '按钮' },
  L: { type: 'warning', label: '外链' },
}

/** 将平铺列表组装成树（供 n-data-table 展开展示） */
const menuTreeData = computed(() => {
  // 剥离后端可能携带的 children 字段，防止 arrayToTree 重复追加子节点
  const flat = menuList.value.map(item => ({ ...item, children: undefined }))
  return arrayToTree(flat)
})

const columns: DataTableColumns<AppRoute.AdminMenu> = [
  {
    title: '名称',
    key: 'name',
    width: 180,
  },
  {
    title: '类型',
    key: 'type',
    align: 'center',
    width: 72,
    render: (row) => {
      const cfg = menuTypeMap[row.type] ?? { type: 'default' as NaiveUI.ThemeColor, label: row.type }
      return <NTag type={cfg.type} size="small">{cfg.label}</NTag>
    },
  },
  {
    title: '权限标识',
    key: 'code',
    render: row => <CopyText value={row.code} />,
  },
  {
    title: '路由路径',
    key: 'path',
    ellipsis: { tooltip: true },
    render: row => row.path || '-',
  },
  {
    title: '图标',
    key: 'icon',
    align: 'center',
    width: 60,
    render: row => row.icon ? createIcon(row.icon, { size: 18 }) : h('span', { class: 'text-gray-300' }, '-'),
  },
  {
    title: '排序',
    key: 'sort',
    align: 'center',
    width: 60,
  },
  {
    title: '可见',
    key: 'is_visible',
    align: 'center',
    width: 64,
    render: row => (
      <NTag type={row.is_visible ? 'success' : 'default'} size="small">
        {row.is_visible ? '是' : '否'}
      </NTag>
    ),
  },
  {
    title: '启用',
    key: 'is_active',
    align: 'center',
    width: 64,
    render: row => (
      <NTag type={row.is_active ? 'success' : 'warning'} size="small">
        {row.is_active ? '是' : '否'}
      </NTag>
    ),
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    width: '14em',
    render: (row) => {
      return (
        <NFlex justify="center">
          <NButton size="small" onClick={() => tableModalRef.value?.openModal('view', row)}>
            查看
          </NButton>
          {hasPermission(['menu:edit']) && (
            <NButton size="small" onClick={() => tableModalRef.value?.openModal('edit', row)}>
              编辑
            </NButton>
          )}
          {hasPermission(['menu:delete']) && (
            <NPopconfirm onPositiveClick={() => deleteMenu(row.id)}>
              {{
                default: () => `确认删除「${row.name}」？`,
                trigger: () => <NButton size="small" type="error">删除</NButton>,
              }}
            </NPopconfirm>
          )}
        </NFlex>
      )
    },
  },
]

onMounted(() => {
  loadAppList()
})

async function loadAppList() {
  startAppLoading()
  const { data, isSuccess } = await fetchAppList()
  if (isSuccess) {
    appList.value = data ?? []
    if (appList.value.length > 0)
      await selectApp(appList.value[0])
  }
  endAppLoading()
}

async function selectApp(app: Entity.App) {
  selectedApp.value = app
  await loadMenuList()
}

async function loadMenuList() {
  if (!selectedApp.value?.app_code)
    return
  startMenuLoading()
  const { data, isSuccess } = await fetchAllRoutes(selectedApp.value.app_code)
  if (isSuccess)
    menuList.value = data ?? []
  endMenuLoading()
}

async function deleteMenu(id: number) {
  const { isSuccess } = await fetchDeleteRoutes(id)
  if (isSuccess) {
    window.$message.success('删除成功')
    loadMenuList()
  }
}
</script>

<template>
  <NFlex :wrap="false" class="h-full">
    <!-- 左侧：应用列表 -->
    <n-card
      class="w-56 shrink-0"
      title="应用列表"
      size="small"
      :loading="appLoading"
    >
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

    <!-- 右侧：菜单表格 -->
    <n-card class="flex-1 min-w-0" size="small">
      <template #header>
        <NFlex align="center" :size="8">
          <span v-if="selectedApp" class="font-medium">
            {{ selectedApp.app_name }}
          </span>
          <n-text v-else depth="3">
            请先选择应用
          </n-text>
        </NFlex>
      </template>

      <template #header-extra>
        <NFlex>
          <NButton
            v-if="selectedApp"
            v-permission="['menu:add']"
            type="primary"
            size="small"
            @click="tableModalRef?.openModal('add')"
          >
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            新建
          </NButton>
          <NButton
            type="primary"
            secondary
            size="small"
            :disabled="!selectedApp"
            @click="loadMenuList"
          >
            <template #icon>
              <icon-park-outline-refresh />
            </template>
            刷新
          </NButton>
        </NFlex>
      </template>

      <n-data-table
        :columns="columns"
        :data="menuTreeData"
        :loading="menuLoading"
        :row-key="(row) => row.id"
        children-key="children"
        default-expand-all
        size="small"
        :scroll-x="900"
      />

      <TableModal
        ref="tableModalRef"
        :app-code="selectedApp?.app_code ?? ''"
        :all-menus="menuList"
        modal-name="菜单"
        @close="loadMenuList"
      />
    </n-card>
  </NFlex>
</template>
