<script setup lang="ts">
import type { FormItemRule } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { fetchCreateRole, fetchUpdateRole } from '@/service'

interface Props {
  modalName?: string
  appCode: string
}

const { modalName = '', appCode } = defineProps<Props>()
const emit = defineEmits<{ open: [], close: [] }>()

const { t, locale } = useI18n()
const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)

interface RoleForm { id?: number, role_name: string, role_code: string }
const formDefault: RoleForm = { role_name: '', role_code: '' }
const formModel = ref<RoleForm>({ ...formDefault })

type ModalType = 'add' | 'edit'
const modalType = shallowRef<ModalType>('add')
const modalTitle = computed(() => {
  const map: Record<ModalType, string> = { add: t('model.add'), edit: t('model.edit') }
  return locale.value === 'enUS' ? `${map[modalType.value]} ${modalName}` : `${map[modalType.value]}${modalName}`
})

async function openModal(type: ModalType = 'add', data?: Entity.Role) {
  emit('open')
  modalType.value = type
  showModal()
  if (type === 'add') {
    formModel.value = { ...formDefault }
  }
  else if (data) {
    formModel.value = { id: data.id, role_name: data.role_name ?? '', role_code: data.role_code ?? '' }
  }
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
      await fetchCreateRole(appCode, { role_name: formModel.value.role_name, role_code: formModel.value.role_code })
      window.$message.success('新增成功')
    }
    else {
      await fetchUpdateRole(formModel.value.id!, { role_name: formModel.value.role_name, role_code: formModel.value.role_code })
      window.$message.success('编辑成功')
    }
    closeModal()
  }
  finally {
    endLoading()
  }
}

const rules: Record<string, FormItemRule | FormItemRule[]> = {
  role_name: { required: true, message: '请输入角色名称', trigger: 'blur' },
  role_code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-z0-9_:]+$/, message: '编码只能包含小写字母、数字、下划线、冒号', trigger: 'blur' },
  ],
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    :mask-closable="false"
    preset="card"
    :title="modalTitle"
    class="w-560px"
    :segmented="{ content: true, action: true }"
  >
    <n-form ref="formRef" :rules="rules" label-placement="left" :label-width="90" :model="formModel">
      <n-grid :cols="1" :x-gap="18">
        <n-form-item-grid-item :span="1" label="角色名称" path="role_name">
          <n-input v-model:value="formModel.role_name" placeholder="Eg: 系统管理员" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="1" label="角色编码" path="role_code">
          <n-input v-model:value="formModel.role_code" :disabled="modalType === 'edit'" placeholder="Eg: nexuskit:admin" />
        </n-form-item-grid-item>
      </n-grid>
    </n-form>
    <template #action>
      <n-space justify="center">
        <n-button @click="closeModal">取消</n-button>
        <n-button type="primary" :loading="submitLoading" @click="submitModal">提交</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
