<script setup lang="ts">
import type { FormItemRule } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { fetchAddApp, fetchUpdateApp } from '@/service'

interface Props {
  modalName?: string
}

const { modalName = '' } = defineProps<Props>()

const emit = defineEmits<{
  open: []
  close: []
}>()

const { t, locale } = useI18n()
const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)

/** 客户端生成密码（等同于 Python secrets.token_urlsafe(32)） */
function generateSecret() {
  const array = new Uint8Array(32)
  window.crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const formDefault: Entity.App = {
  app_code: '',
  app_name: '',
  app_secret: '',
  perm_mode: 'full',
  description: '',
}
const formModel = ref<Entity.App>({ ...formDefault })

type ModalType = 'add' | 'view' | 'edit'
const modalType = shallowRef<ModalType>('add')

const modalTitle = computed(() => {
  const titleMap: Record<ModalType, string> = {
    add: t('model.add'),
    view: t('model.view'),
    edit: t('model.edit'),
  }
  if (locale.value === 'enUS')
    return `${titleMap[modalType.value]} ${modalName}`
  return `${titleMap[modalType.value]}${modalName}`
})

const permModeOptions: { label: string, value: Entity.AppPermMode }[] = [
  { label: '完整 RBAC', value: 'full' },
  { label: '仅角色', value: 'role_only' },
  { label: 'SSO 直通', value: 'passthru' },
]

async function openModal(type: ModalType = 'add', data?: Entity.App) {
  emit('open')
  modalType.value = type
  showModal()
  const handlers: Record<ModalType, () => void> = {
    add() { formModel.value = { ...formDefault } },
    view() { formModel.value = data ? { ...data } : { ...formDefault } },
    edit() { formModel.value = data ? { ...data } : { ...formDefault } },
  }
  handlers[type]()
}

function closeModal() {
  hiddenModal()
  endLoading()
  emit('close')
}

defineExpose({ openModal })

const formRef = ref()

async function submitModal() {
  await formRef.value?.validate()
  startLoading()
  try {
    if (modalType.value === 'add') {
      const { app_code, app_name, app_secret, perm_mode, description } = formModel.value
      const { isSuccess } = await fetchAddApp({ app_code: app_code!, app_name: app_name!, app_secret: app_secret!, perm_mode, description })
      if (isSuccess) {
        window.$message.success('新增成功')
        closeModal()
      }
    }
    else if (modalType.value === 'edit') {
      const { app_name, perm_mode, description } = formModel.value
      // 编辑时不传 app_secret（后端加密存储，变更通过“重置密码”操作完成）
      const payload: Parameters<typeof fetchUpdateApp>[1] = { app_name, perm_mode, description }
      const { isSuccess } = await fetchUpdateApp(formModel.value.app_code!, payload)
      if (isSuccess) {
        window.$message.success('编辑成功')
        closeModal()
      }
    }
  }
  finally {
    endLoading()
  }
}

const rules: Record<string, FormItemRule | FormItemRule[]> = {
  app_name: {
    required: true,
    message: '请输入应用名称',
    trigger: 'blur',
  },
  app_code: [
    { required: true, message: '请输入应用编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]{1,31}$/,
      message: '编码只能包含小写字母、数字、下划线，以字母开头',
      trigger: 'blur',
    },
  ],
  // 密码仅新增时必填
  app_secret: [
    { required: true, message: '请输入或生成应用密码', trigger: 'blur' },
  ],
  perm_mode: {
    required: true,
    message: '请选择权限模式',
    trigger: 'change',
  },
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    :mask-closable="false"
    preset="card"
    :title="modalTitle"
    class="w-700px"
    :segmented="{ content: true, action: true }"
  >
    <n-form
      ref="formRef"
      :rules="rules"
      label-placement="left"
      :label-width="100"
      :model="formModel"
      :disabled="modalType === 'view'"
    >
      <n-grid :cols="2" :x-gap="18">
        <n-form-item-grid-item :span="2" label="应用名称" path="app_name">
          <n-input v-model:value="formModel.app_name" placeholder="Eg: NexusKit 平台" />
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" label="应用编码" path="app_code">
          <n-input
            v-model:value="formModel.app_code"
            placeholder="Eg: nexuskit"
            :disabled="modalType === 'edit'"
          />
        </n-form-item-grid-item>

        <!-- 应用密码仅新建时可设置，后端加密存储，查看/编辑均不显示 -->
        <n-form-item-grid-item v-if="modalType === 'add'" :span="2" label="应用密钥" path="app_secret">
          <n-input-group>
            <n-input
              v-model:value="formModel.app_secret"
              placeholder="请输入或点击生成应用密钥"
              clearable
            />
            <n-button
              type="primary"
              ghost
              style="width: 80px"
              @click="formModel.app_secret = generateSecret()"
            >
              生成
            </n-button>
          </n-input-group>
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" label="权限模式" path="perm_mode">
          <n-select
            v-model:value="formModel.perm_mode"
            :options="permModeOptions"
            placeholder="请选择权限模式"
          />
        </n-form-item-grid-item>

        <n-form-item-grid-item :span="2" label="系统描述" path="description">
          <n-input
            v-model:value="formModel.description"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入系统描述（可选）"
          />
        </n-form-item-grid-item>
      </n-grid>
    </n-form>

    <template #action>
      <n-space justify="center">
        <n-button @click="closeModal">
          {{ t('common.cancel') }}
        </n-button>
        <n-button v-if="modalType !== 'view'" type="primary" :loading="submitLoading" @click="submitModal">
          {{ t('common.confirm') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped></style>
