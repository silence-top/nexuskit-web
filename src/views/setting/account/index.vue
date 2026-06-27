<script setup lang="tsx">
import type { FormSchema } from '@/components/basicForm'
import type { ActionItem } from '@/components/basicTable'
import { basicForm, useForm } from '@/components/basicForm'
import { BasicTable, TableAction } from '@/components/basicTable'
import { useBoolean } from '@/hooks'
import { fetchDeleteUser, fetchDeptList, fetchForceLogout, fetchUpdateUser, fetchUserList } from '@/service'
import { arrayToTree } from '@/utils'
import { DeleteOutlined, EditOutlined } from '@vicons/antd'
import { NPopconfirm, NSwitch } from 'naive-ui'
import TableModal from './components/TableModal.vue'
import UserAppModal from './components/UserAppModal.vue'
import UserRoleModal from './components/UserRoleModal.vue'

const tableModalRef = ref<InstanceType<typeof TableModal>>()
const userAppModalRef = ref<InstanceType<typeof UserAppModal>>()
const userRoleModalRef = ref<InstanceType<typeof UserRoleModal>>()
const tableRef = ref()

const { bool: deptLoading, setTrue: startDeptLoading, setFalse: endDeptLoading } = useBoolean(false)
const deptTree = ref<Entity.Department[]>([])
const flatDepts = ref<Entity.Department[]>([])
const selectedDeptId = ref<number | null>(null)

// ── 搜索表单 ──────────────────────────────────────────────────────────────
const schemas: FormSchema[] = [
  {
    field: 'keyword',
    component: 'NInput',
    label: '用户名/邮箱',
    componentProps: { placeholder: '请输入关键词' },
  },
  {
    field: 'is_active',
    component: 'NSelect',
    label: '状态',
    componentProps: {
      placeholder: '全部',
      clearable: true,
      options: [
        { label: '启用', value: '1' },
        { label: '停用', value: '0' },
      ],
    },
  },
]
const [register, { getFieldsValue }] = useForm({
  gridProps: { cols: '1 s:1 m:2 l:3 xl:4 2xl:4' },
  labelWidth: 80,
  schemas,
  showAdvancedButton: false,
})

// ── 表格列 ────────────────────────────────────────────────────────────────
const columns = [
  { title: '用户名', key: 'username', width: 130 },
  { title: '邮箱', key: 'email', ellipsis: { tooltip: true }, render: (row: Entity.User) => row.email ?? '—' },
  { title: '手机号', key: 'phone', width: 130, render: (row: Entity.User) => row.phone ?? '—' },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    align: 'center' as const,
    render: (row: Entity.User) => (
      <NPopconfirm onPositiveClick={() => toggleStatus(row)}>
        {{
          default: () => `确认${row.is_active ? '禁用' : '启用'}用户「${row.username}」？`,
          trigger: () => <NSwitch value={row.is_active} size="small" />,
        }}
      </NPopconfirm>
    ),
  },
]

function createActions(record: Entity.User): ActionItem[] {
  return [
    {
      label: '编辑',
      icon: EditOutlined,
      auth: ['user:edit'],
      onClick: () => tableModalRef.value?.openModal('edit', record),
    },
    {
      label: '重置密码',
      type: 'warning',
      auth: ['user:edit'],
      onClick: () => tableModalRef.value?.openModal('reset', record),
    },
    {
      label: '平台授权',
      type: 'info',
      auth: ['user:edit'],
      onClick: () => userAppModalRef.value?.openModal(record),
    },
    {
      label: '角色绑定',
      type: 'info',
      auth: ['user:edit'],
      onClick: () => userRoleModalRef.value?.openModal(record),
    },
    {
      label: '强制下线',
      type: 'error',
      auth: ['user:delete'],
      popConfirm: {
        title: `强制下线「${record.username}」？`,
        confirm: () => forceLogoutUser(record.id!),
      },
    },
    {
      label: '删除',
      icon: DeleteOutlined,
      type: 'error',
      auth: ['user:delete'],
      popConfirm: {
        title: `确认删除用户「${record.username}」？`,
        confirm: () => deleteUser(record.id!),
      },
    },
  ]
}

const actionColumn = reactive({
  title: '操作',
  key: 'action',
  fixed: 'right',
  align: 'center',
  width: 500,
  render(record: Entity.User) {
    return h(TableAction as any, {
      style: 'button',
      actions: createActions(record),
    })
  },
})

// ── 数据加载 ──────────────────────────────────────────────────────────────
onMounted(() => {
  loadDepts()
})

async function loadDepts() {
  startDeptLoading()
  const { data, isSuccess } = await fetchDeptList()
  if (isSuccess && data) {
    flatDepts.value = data
    // 剥离已有 children 字段，防止 arrayToTree 重复追加
    deptTree.value = arrayToTree((data as any[]).map((d: any) => ({ ...d, children: undefined })))
  }
  endDeptLoading()
}

async function loadUserData(params: { page: number, page_size: number }) {
  const formVals = getFieldsValue()
  const query: Record<string, any> = { ...params }
  if (selectedDeptId.value)
    query.dept_id = selectedDeptId.value
  if (formVals.keyword)
    query.keyword = formVals.keyword
  if (formVals.is_active === '1')
    query.is_active = true
  else if (formVals.is_active === '0')
    query.is_active = false
  const { data, isSuccess } = await fetchUserList(query)
  // 兼容两种格式：data 是直接数组 或 { items: [...], total: N }
  const list = Array.isArray(data) ? data : ((data as any)?.items ?? [])
  const total = typeof (data as any)?.total === 'number' ? (data as any).total : list.length
  return { data: isSuccess ? list : [], count: isSuccess ? total : 0 }
}

function handleDeptSelect(keys: number[]) {
  selectedDeptId.value = keys[0] ?? null
  tableRef.value?.reload()
}

async function toggleStatus(row: Entity.User) {
  const { isSuccess } = await fetchUpdateUser(row.id!, { is_active: !row.is_active })
  if (isSuccess) {
    window.$message.success(!row.is_active ? '已启用' : '已停用')
    tableRef.value?.reload()
  }
}

async function forceLogoutUser(id: number) {
  const { isSuccess } = await fetchForceLogout(id)
  if (isSuccess)
    window.$message.success('已强制下线')
}

async function deleteUser(id: number) {
  const { isSuccess } = await fetchDeleteUser(id)
  if (isSuccess) {
    window.$message.success('删除成功')
    tableRef.value?.reload()
  }
}
</script>

<template>
  <NFlex :wrap="false" class="h-full">
    <!-- 左侧：部门树 -->
    <n-card class="w-56 shrink-0" title="组织架构" size="small" :loading="deptLoading">
      <n-tree
        block-line
        :data="deptTree"
        key-field="id"
        label-field="dept_name"
        children-key="children"
        default-expand-all
        :selected-keys="selectedDeptId ? [selectedDeptId] : []"
        @update:selected-keys="handleDeptSelect"
      />
      <n-empty
        v-if="!deptLoading && deptTree.length === 0"
        description="暂无部门"
        size="small"
        class="py-4"
      />
    </n-card>

    <!-- 右侧：用户列表 -->
    <n-card class="flex-1 min-w-0" size="small">
      <template #header>
        <basic-form @register="register" />
      </template>

      <BasicTable
        ref="tableRef"
        :columns="columns"
        :request="loadUserData"
        :row-key="(row: Entity.User) => row.id"
        :action-column="actionColumn"
        :scroll-x="1100"
        :striped="true"
      >
        <template #tableTitle>
          <NButton v-permission="['user:add']" type="primary" @click="tableModalRef?.openModal('add')">
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
        modal-name="用户"
        @close="() => tableRef?.reload()"
      />
      <UserAppModal ref="userAppModalRef" />
      <UserRoleModal ref="userRoleModalRef" />
    </n-card>
  </NFlex>
</template>
