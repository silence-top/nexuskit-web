<script setup lang="ts">
import { useBoolean } from '@/hooks'
import { fetchAddCompany, fetchUpdateCompany } from '@/service'

interface Props {
  modalName?: string
}
const {
  modalName = '',
} = defineProps<Props>()
const emit = defineEmits<{
  open: []
  close: []
}>()
const { t, locale } = useI18n()
const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)

const formDefault: Entity.Company = {
  name: '',
  address: '',
  description: '',
  onboarding_time: null,
  separation_time: null,
}
const formModel = ref<Entity.Company>({ ...formDefault })

type ModalType = 'add' | 'view' | 'edit'
const modalType = shallowRef<ModalType>('add')
const modalTitle = computed(() => {
  const titleMap: Record<ModalType, string> = {
    add: t('model.add'),
    view: t('model.view'),
    edit: t('model.edit'),
  }
  if (locale.value === 'enUS') {
    return `${titleMap[modalType.value]} ${modalName}`
  }
  return `${titleMap[modalType.value]}${modalName}`
})

async function openModal(type: ModalType = 'add', data: Entity.Company) {
  emit('open')
  modalType.value = type
  // getRoleList()
  showModal()
  const handlers = {
    async add() {
      formModel.value = { ...formDefault }
    },
    async view() {
      if (!data)
        return
      formModel.value = { ...data }
    },
    async edit() {
      if (!data)
        return
      formModel.value = { ...data }
    },
  }
  await handlers[type]()
}

function closeModal() {
  hiddenModal()
  endLoading()
  emit('close')
}

defineExpose({
  openModal,
})

const formRef = ref()
async function submitModal() {
  const handlers = {
    async add() {
      return new Promise((resolve) => {
        fetchAddCompany(formModel.value).then(() => {
          window.$message.success('新增成功')
          resolve(true)
        })
      })
    },
    async edit() {
      return new Promise((resolve) => {
        const formModelValue = {
          id: formModel.value.id,
          company_info: {
            name: formModel.value.name,
            address: formModel.value.address,
            onboarding_time: formModel.value.onboarding_time,
            separation_time: formModel.value.separation_time,
            description: formModel.value.description,
          },
        }
        fetchUpdateCompany(formModelValue).then(() => {
          window.$message.success('编辑成功')
          resolve(true)
        })

        // setTimeout(() => {
        //   window.$message.success('模拟编辑成功')
        //   resolve(true)
        // }, 2000)
      })
    },
    async view() {
      return true
    },
  }
  await formRef.value?.validate()
  startLoading()
  await handlers[modalType.value]() && closeModal()
}

const rules = {
  name: {
    required: true,
    message: '请输入公司名称',
    trigger: 'blur',
  },
  onboarding_time: {
    required: true,
    message: '请选择入职时间',
    trigger: 'blur',
  },

}

// const options = ref()
// async function getRoleList() {
//   const { data } = await fetchRoleList()
//   options.value = data
// }
</script>

<template>
  <n-modal
    v-model:show="modalVisible" :mask-closable="false" preset="card" :title="modalTitle" class="w-700px"
    :segmented="{
      content: true,
      action: true,
    }"
  >
    <n-form
      ref="formRef" :rules="rules" label-placement="left" :label-width="100" :model="formModel"
      :disabled="modalType === 'view'"
    >
      <n-grid :cols="2" :x-gap="18">
        <n-form-item-grid-item :span="2" label="公司名称" path="name">
          <n-input v-model:value="formModel.name" placeholder="请输入公司名称" />
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" label="入职时间" path="onboarding_time">
          <n-date-picker v-model:formatted-value="formModel.onboarding_time" class="w-100%" format="yyyy-MM-dd HH:mm:ss" type="datetime" clearable path="onboarding_time" />
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" label="离职时间" path="separation_time">
          <n-date-picker v-model:formatted-value="formModel.separation_time" class="w-100%" format="yyyy-MM-dd HH:mm:ss" type="datetime" clearable path="onboarding_time" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="2" label="公司地址" path="remark">
          <n-input
            v-model:value="formModel.address" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入公司地址"
          />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="2" label="描述" path="description">
          <n-input
            v-model:value="formModel.description" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入描述"
          />
        </n-form-item-grid-item>
      </n-grid>
    </n-form>
    <template v-if="modalType !== 'view'" #action>
      <n-space justify="center">
        <n-button @click="closeModal">
          取消
        </n-button>
        <n-button type="primary" :loading="submitLoading" @click="submitModal">
          提交
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>

</style>
