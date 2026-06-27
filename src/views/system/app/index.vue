<script setup lang="tsx">
import type { ActionItem } from '@/components/basicTable'
import { BasicTable, TableAction } from '@/components/basicTable'
import CopyText from '@/components/custom/CopyText.vue'
import { fetchAppList, fetchDeleteApp, fetchResetAppSecret } from '@/service'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@vicons/antd'
import { NButton, NFlex, NInput, NTag } from 'naive-ui'
import AppModal from './components/AppModal.vue'

const appModalRef = ref<InstanceType<typeof AppModal>>()
const tableRef = ref()

const permModeTagMap: Record<string, { type: 'success' | 'warning' | 'info', label: string }> = {
  full: { type: 'success', label: '完整 RBAC' },
  role_only: { type: 'warning', label: '仅角色' },
  passthru: { type: 'info', label: 'SSO 直通' },
}

const columns = [
  { title: '应用名称', key: 'app_name', width: 160 },
  {
    title: '应用编码',
    key: 'app_code',
    width: 160,
    render: (row: any) => h(CopyText as any, { value: row.app_code }),
  },
  {
    title: '权限模式',
    key: 'perm_mode',
    align: 'center' as const,
    width: 120,
    render: (row: any) => {
      const { type, label } = permModeTagMap[row.perm_mode ?? 'full']
      return h(NTag, { type }, () => label)
    },
  },
  {
    title: '系统描述',
    key: 'description',
    ellipsis: { tooltip: true },
    render: (row: any) => row.description || '-',
  },
]

function createActions(record: any): ActionItem[] {
  return [
    {
      label: '查看',
      icon: EyeOutlined,
      auth: ['app:view'],
      onClick: () => appModalRef.value?.openModal('view', record),
    },
    {
      label: '编辑',
      icon: EditOutlined,
      auth: ['app:edit'],
      onClick: () => appModalRef.value?.openModal('edit', record),
    },
    {
      label: '重置密码',
      auth: ['app:secret:reset'],
      type: 'warning' as const,
      popConfirm: {
        title: `确认重置「${record.app_name}」的密码？旧密码将立即失效。`,
        confirm: () => resetAppSecret(record.app_code, record.app_name),
      },
    },
    {
      label: '删除',
      icon: DeleteOutlined,
      type: 'error',
      auth: ['app:delete'],
      popConfirm: {
        title: `确认删除应用「${record.app_name}」？`,
        confirm: () => deleteApp(record.app_code),
      },
    },
  ]
}

const actionColumn = reactive({
  title: '操作',
  key: 'action',
  align: 'center',
  width: 300,
  render(record: any) {
    return h(TableAction as any, {
      style: 'button',
      actions: createActions(record),
    })
  },
})

async function loadAppData() {
  const { data, isSuccess } = await fetchAppList()
  const list = Array.isArray(data) ? data : ((data as any)?.items ?? [])
  const total = typeof (data as any)?.total === 'number' ? (data as any).total : list.length
  return { data: isSuccess ? list : [], count: isSuccess ? total : 0 }
}

async function resetAppSecret(app_code: string, app_name: string) {
  const { data, isSuccess } = await fetchResetAppSecret(app_code)
  if (!isSuccess)
    return
  // 取出明文密码（后端可能放在 data.app_secret 或 data 本身）
  const secret: string = (data as any)?.app_secret ?? data as any ?? ''
  if (!secret) {
    window.$message.warning('重置成功，但未返回密码明文')
    return
  }
  // 一次性密码展示弹窗
  const dialog = window.$dialog.warning({
    title: `「${app_name}」密码已重置`,
    content: () =>
      h('div', { class: 'space-y-3 py-2' }, [
        h('p', { class: 'text-sm text-amber-600 mb-3' }, '⚠️ 仅此一次可见！请立即复制并妥善保管，关闭后无法再次查看明文密码。'),
        h(NFlex, { align: 'center', gap: 8 }, () => [
          h(NInput, {
            value: secret,
            readonly: true,
            style: 'flex: 1; font-family: monospace; font-size: 13px;',
          }),
          h(NButton, {
            type: 'primary',
            size: 'small',
            onClick: () => {
              navigator.clipboard.writeText(secret)
              window.$message.success('已复制到剪贴板')
            },
          }, () => '复制'),
        ]),
      ]),
    positiveText: '已确认保存，关闭',
    onPositiveClick: () => { dialog.destroy() },
    closable: false,
    maskClosable: false,
  })
}

async function deleteApp(app_code: string) {
  const { isSuccess } = await fetchDeleteApp(app_code)
  if (isSuccess) {
    window.$message.success('删除成功')
    tableRef.value?.reload()
  }
}
</script>

<template>
  <n-card>
    <BasicTable
      ref="tableRef"
      :columns="columns"
      :request="loadAppData"
      :row-key="(row: any) => row.id"
      :action-column="actionColumn"
      :pagination="false"
      :scroll-x="800"
      :striped="true"
    >
      <template #tableTitle>
        <NButton v-permission="['app:add']" type="primary" @click="appModalRef?.openModal('add')">
          <template #icon>
            <icon-park-outline-add-one />
          </template>
          新建
        </NButton>
      </template>
      <template #toolbar />
    </BasicTable>

    <AppModal ref="appModalRef" modal-name="应用" @close="() => tableRef?.reload()" />
  </n-card>
</template>
