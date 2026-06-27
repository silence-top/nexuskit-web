<script setup lang="tsx">
import type { ActionItem } from '@/components/basicTable'
import { BasicTable, TableAction } from '@/components/basicTable'
import { fetchDeleteDept, fetchDeptList } from '@/service'
import { arrayToTree } from '@/utils'
import { DeleteOutlined, EditOutlined } from '@vicons/antd'
import { NTag } from 'naive-ui'
import TableModal from './components/TableModal.vue'

const tableModalRef = ref<InstanceType<typeof TableModal>>()
const tableRef = ref()
const flatDepts = ref<Entity.Department[]>([])

const columns = [
  { title: '部门名称', key: 'dept_name', width: 220 },
  { title: '负责人', key: 'leader', width: 120, render: (row: Entity.Department) => row.leader ?? '-' },
  { title: '联系电话', key: 'phone', width: 140, render: (row: Entity.Department) => row.phone ?? '-' },
  { title: '联系邮箱', key: 'email', ellipsis: { tooltip: true }, render: (row: Entity.Department) => row.email ?? '-' },
  { title: '排序', key: 'sort', width: 70, align: 'center' as const },
  {
    title: '状态',
    key: 'is_active',
    width: 80,
    align: 'center' as const,
    render: (row: Entity.Department) => h(NTag, { type: row.is_active ? 'success' : 'warning', size: 'small' }, () => row.is_active ? '启用' : '停用'),
  },
]

function createActions(record: Entity.Department): ActionItem[] {
  return [
    {
      label: '编辑',
      icon: EditOutlined,
      auth: ['dept:edit'],
      onClick: () => tableModalRef.value?.openModal('edit', record),
    },
    {
      label: '删除',
      icon: DeleteOutlined,
      type: 'error',
      auth: ['dept:delete'],
      popConfirm: {
        title: `确认删除「${record.dept_name}」及其所有子部门？`,
        confirm: () => deleteDept(record.id!),
      },
    },
  ]
}

const actionColumn = reactive({
  title: '操作',
  key: 'action',
  align: 'center',
  width: 160,
  render(record: Entity.Department) {
    return h(TableAction as any, {
      style: 'button',
      actions: createActions(record),
    })
  },
})

async function loadDeptData() {
  const { data, isSuccess } = await fetchDeptList()
  if (isSuccess && data) {
    flatDepts.value = data
    // 剥离已有 children 字段，防止 arrayToTree 重复追加
    const flat = (data as any[]).map((d: any) => ({ ...d, children: undefined }))
    const tree = arrayToTree(flat) as Entity.Department[]
    return { data: tree, count: tree.length }
  }
  return { data: [], count: 0 }
}

async function deleteDept(id: number) {
  const { isSuccess } = await fetchDeleteDept(id)
  if (isSuccess) {
    window.$message.success('删除成功')
    tableRef.value?.reload()
  }
}
</script>

<template>
  <n-card size="small">
    <BasicTable
      ref="tableRef"
      :columns="columns"
      :request="loadDeptData"
      :row-key="(row: Entity.Department) => row.id"
      :action-column="actionColumn"
      :pagination="false"
      :scroll-x="900"
      children-key="children"
      default-expand-all
      :striped="false"
    >
      <template #tableTitle>
        <NButton v-permission="['dept:add']" type="primary" @click="tableModalRef?.openModal('add')">
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
      :all-depts="flatDepts"
      modal-name="部门"
      @close="() => tableRef?.reload()"
    />
  </n-card>
</template>
