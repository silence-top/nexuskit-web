<script setup lang="ts">
import { useBoolean } from '@/hooks'
import { fetchAddQuestion, fetchUpdateQuestion } from '@/service'

import wangEditor from './wangEditor.vue'

const {
  modalName = '',
} = defineProps<Props>()

const emit = defineEmits<{
  open: []
  close: []
}>()

const { t, locale } = useI18n()

interface Props {
  modalName?: string
}

const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)

const formDefault: Entity.Question = {
  title: '',
  keys: [],
  content: '',
  description: '',
}
const formModel = ref<Entity.Question>({ ...formDefault })
const contentEditorRef = ref()

type ModalType = 'add' | 'view' | 'edit'
const modalType = shallowRef<ModalType>('add')
const modalTitle = computed(() => {
  const titleMap: Record<ModalType, string> = {
    add: t('model.add'),
    view: t('model.view'),
    edit: t('model.edit'),
  }
  if (locale.value === 'zhCN') {
    return `${titleMap[modalType.value]}${modalName}`
  }
  return `${titleMap[modalType.value]} ${modalName}`
})

async function openModal(type: ModalType = 'add', data: Entity.Question) {
  emit('open')
  modalType.value = type

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
  showModal()
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
  const { delete_images, all_images } = await contentEditorRef.value?.getDeleteImages()

  const handlers = {
    async add() {
      return new Promise((resolve) => {
        const formModelValue: any = {
          ...formModel.value,
          all_images,
          delete_images,
        }
        fetchAddQuestion(formModelValue).then(() => {
          window.$message.success('新增成功')
          resolve(true)
        })
      })
    },
    async edit() {
      return new Promise((resolve) => {
        const formModelValue = {
          id: formModel.value.id,
          question_info: {
            title: formModel.value.title,
            keys: formModel.value.keys,
            content: formModel.value.content,
            description: formModel.value.description,
            all_images,
            delete_images,
          },
        }
        fetchUpdateQuestion(formModelValue).then(() => {
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
  title: {
    required: true,
    message: t('common.inputPlaceholder'),
    trigger: 'blur',
  },
  keys: {
    required: true,
    message: t('common.selectPlaceholder'),
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
        <n-form-item-grid-item :span="2" :label="$t('quesiton.title')" path="title">
          <n-input v-model:value="formModel.title" :placeholder="$t('common.inputPlaceholder')" />
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" :label="$t('quesiton.keys')" path="onboarding_time">
          <n-select
            v-model:value="formModel.keys" class="w-100%" filterable multiple tag :placeholder="$t('common.selectPlaceholder')"
            :options="[]"
          />
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" :label="$t('quesiton.content')" path="separation_time">
          <wangEditor ref="contentEditorRef" v-model:model-value="formModel.content" :disabled="modalType === 'view'" />
          <!-- <n-input
            v-model:value="formModel.content" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入问答内容"
          /> -->
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" :label="$t('table.description')" path="description">
          <n-input
            v-model:value="formModel.description" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }"
            :placeholder="$t('common.inputPlaceholder')"
          />
        </n-form-item-grid-item>
      </n-grid>
    </n-form>
    <template v-if="modalType !== 'view'" #action>
      <n-space justify="center">
        <n-button @click="closeModal">
          {{ $t('common.cancel') }}
        </n-button>
        <n-button type="primary" :loading="submitLoading" @click="submitModal">
          {{ $t('common.confirm') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>

</style>
