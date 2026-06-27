<script setup lang="tsx">
import type { FormSchema } from '@/components/basicForm'
import type { DataTableColumns } from 'naive-ui'
import { basicForm, useForm } from '@/components/basicForm'
import { BasicTable, TableAction } from '@/components/basicTable'

import { fetchDeleteQuestion, fetchQuestionList } from '@/service'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@vicons/antd'

import { NTag } from 'naive-ui'

import TableModal from './components/TableModal.vue'

const { t } = useI18n()

export interface ListData {
  id: number
  title: string
  keys: Array<string>
  content: string
  status: string

}

const schemas: FormSchema[] = [
  {
    field: 'title',
    component: 'NInput',
    label: t('quesiton.title'),
    componentProps: {
      onInput: (e: any) => {
        console.log(e)
      },
    },
  },
  {
    field: 'keys',
    component: 'NInputNumber',
    label: t('quesiton.keys'),
    componentProps: {
      showButton: false,
      onInput: (e: any) => {
        console.log(e)
      },
    },
  },

]
const [register] = useForm({
  gridProps: { cols: '1 s:1 m:2 l:3 xl:4 2xl:4' },
  schemas,
  showAdvancedButton: false,
})

const tableModalRef = ref()

const tableRef = ref()

const columns: DataTableColumns<Entity.Company> = [

  {
    title: t('quesiton.title'),
    key: 'title',
    width: 200,
  },
  {
    title: t('quesiton.keys'),
    align: 'center',
    key: 'keys',
  },
  {
    title: t('table.status'),
    align: 'center',
    key: 'status',

    render: (row) => {
      const status = row.status || 0

      const type = status ? 'success' : 'warning'
      const text = status ? '已发布' : '待发布'

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
    title: t('table.create_time'),
    align: 'center',
    key: 'create_time',

  },

]

// const tableData = ref<AppRoute.RowRoute[]>([])

function createActions(record: any) {
  return [
    // {
    //     label: '',
    //     icon: EditOutlined,
    //     onClick: handleEdit.bind(null, record),
    //     auth: ['basic_list'],
    //   },

    {
      label: t('table.edit'),
      icon: EditOutlined,
      type: 'info',
      onClick: handleEdit.bind(null, record),
      auth: ['question:edit'],
    },

    {
      label: t('table.delete'),
      // 配置 color 会覆盖 type
      type: 'error',
      icon: DeleteOutlined,
      onClick: handleDelete.bind(null, record),
      // 根据权限控制是否显示: 有权限，会显示，支持多个
      auth: ['question:delete'],
    },
    {
      label: t('table.detail'),
      // 配置 color 会覆盖 type

      icon: EyeOutlined,
      onClick: handleView.bind(null, record),
      // 根据权限控制是否显示: 有权限，会显示，支持多个
      auth: [],
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
    content: `您想删除【${record.title}】`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await fetchDeleteQuestion({ id: record.id })
      reloadTableData()
      window.$message.success('删除成功')
    },
    onNegativeClick: () => { },
  })
}

function handleEdit(record: any) {
  tableModalRef.value.openModal('edit', record)
}

function handleView(record: any) {
  tableModalRef.value.openModal('view', record)
}

function onCheckedRow(rowKeys: number[]) {
  console.log(rowKeys)
}

// onMounted(() => {
//   loadDataTable({})
// })
async function loadDataTable(res: any) {
  console.log(res)
  const { data, count } = await fetchQuestionList({ query: {} })

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
        <NButton v-permission="['question:add']" type="primary" @click="tableModalRef.openModal('add')">
          <template #icon>
            <icon-park-outline-add-one />
          </template>
          {{ $t('route.add') }}
        </NButton>
      </template>

      <template #toolbar />
    </BasicTable>
    <TableModal ref="tableModalRef" :modal-name="$t('model.question')" @close="reloadTableData" />
  </n-card>
</template>
