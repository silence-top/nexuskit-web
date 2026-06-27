<script setup lang="tsx">
import type { FormSchema } from '@/components/basicForm'
import type { DataTableColumns } from 'naive-ui'
import { basicForm, useForm } from '@/components/basicForm'
import { BasicTable, TableAction } from '@/components/basicTable'

import { fetchCompanyList, fetchDeleteCompany } from '@/service'
import { DeleteOutlined, EditOutlined } from '@vicons/antd'
import { NTag } from 'naive-ui'

import TableModal from './components/TableModal.vue'

const { t } = useI18n()
export interface ListData {
  id: number
  name: string
  sex: string
  avatar: string
  email: string
  city: string
  status: string
  type: string
  createDate: string
}

const schemas: FormSchema[] = [
  {
    field: 'name',
    component: 'NInput',
    label: t('company.name'),
    componentProps: {
      placeholder: t('common.inputPlaceholder'),
      onInput: (e: any) => {
        console.log(e)
      },
    },
  },

]
const [register] = useForm({
  gridProps: { cols: '1 s:1 m:2 l:3 xl:4 2xl:4' },
  labelWidth: 80,

  schemas,
})

// console.log('register', register)

const tableModalRef = ref()

const tableRef = ref()

const columns: DataTableColumns<Entity.Company> = [

  {
    title: t('company.name'),
    key: 'name',
    width: 200,
  },
  {
    title: t('company.address'),
    align: 'center',
    key: 'address',
  },
  {
    title: t('table.status'),
    align: 'center',
    key: 'status',

    render: (row) => {
      const status = row.status || 0

      const type = status ? 'success' : 'warning'
      const text = status ? t('table.enable') : t('table.disable')

      return <NTag type={type}>{text}</NTag>
    },
  },

  {
    title: t('table.description'),
    align: 'center',
    key: 'description',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: t('company.onboarding_time'),
    align: 'center',
    key: 'onboarding_time',

  },
  {
    title: t('company.separation_time'),
    align: 'center',
    key: 'separation_time',

  },
  {
    title: t('table.create_time'),
    align: 'center',
    key: 'create_time',

  },

]

// const tableData = ref<AppRoute.RowRoute[]>([])

function createActions(record: any) {
  return [
    {
      label: t('table.edit'),
      icon: EditOutlined,
      onClick: handleEdit.bind(null, record),
      auth: ['company:edit'],
    },

    {
      label: t('table.delete'),
      // 配置 color 会覆盖 type
      type: 'error',
      icon: DeleteOutlined,
      onClick: handleDelete.bind(null, record),
      // 根据权限控制是否显示: 有权限，会显示，支持多个
      auth: ['company:delete'],
    },
  ]
}
const actionColumn = reactive({

  title: t('table.action'),
  key: 'action',
  fixed: 'right',
  align: 'center',
  render(record: any) {
    return h(TableAction as any, {
      style: 'button',
      select: (action: any) => {
        console.log(action)
      },
      actions: createActions(record),
    })
  },
})

function handleDelete(record: any) {
  console.log(record)

  window.$dialog.info({
    title: '提示',
    content: `您想删除${record.name}`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await fetchDeleteCompany({ id: record.id })
      reloadTableData()
      window.$message.success('删除成功')
    },
    onNegativeClick: () => { },
  })
}

function handleEdit(record: any) {
  tableModalRef.value.openModal('edit', record)
}

function onCheckedRow(rowKeys: number[]) {
  console.log(rowKeys)
}

// onMounted(() => {
//   loadDataTable({})
// })
async function loadDataTable(res: any) {
  console.log(res)
  const { data, count } = await fetchCompanyList({ query: {} })

  // tableData.value = arrayToTree(data)
  return {
    data,
    total: count,
  }
}
function reloadTableData() {
  tableRef.value.reload()

  // actionRef.value.closeModal()
}
</script>

<template>
  <n-card>
    <template #header>
      <basic-form @register="register">
        <template #statusSlot="{ model, field }">
          <n-input v-model:value="model[field]" />
        </template>
      </basic-form>
    </template>
    <BasicTable
      ref="tableRef" :columns="columns" :request="loadDataTable" :row-key="(row: ListData) => row.id"
      :action-column="actionColumn" :selection="true" :scroll-x="1090" :striped="true"
      @update:checked-row-keys="onCheckedRow"
    >
      <template #tableTitle>
        <NButton v-permission="['company:add']" type="primary" @click="tableModalRef.openModal('add')">
          <template #icon>
            <icon-park-outline-add-one />
          </template>
          {{ t('table.add') }}
        </NButton>
      </template>

      <template #toolbar />
    </BasicTable>
    <TableModal ref="tableModalRef" :modal-name="$t('model.company')" @close="reloadTableData" />
  </n-card>
</template>
