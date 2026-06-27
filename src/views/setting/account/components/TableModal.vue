<script setup lang="ts">
import type { FormItemRule, SelectOption } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { fetchCreateUser, fetchResetPassword, fetchUpdateUser } from '@/service'

interface Props {
  modalName?: string
  /** 所有部门（用于部门选择器） */
  allDepts: Entity.Department[]
}

const { modalName = '', allDepts } = defineProps<Props>()
const emit = defineEmits<{ open: [], close: [] }>()

const { t, locale } = useI18n()
const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)

// 操作类型：add=新建 | edit=编辑 | reset=重置密码
type ModalType = 'add' | 'edit' | 'reset'
const modalType = shallowRef<ModalType>('add')

interface UserForm {
  id?: number
  username: string
  email: string
  phone: string
  password: string
  dept_id: number | null
  is_active: boolean
}
interface ResetForm { id?: number, password: string, confirm: string }

const userFormDefault: UserForm = {
  username: '',
  email: '',
  phone: '',
  password: '',
  dept_id: null,
  is_active: true,
}
const userForm = ref<UserForm>({ ...userFormDefault })
const resetForm = ref<ResetForm>({ password: '', confirm: '' })

const modalTitle = computed(() => {
  const map: Record<ModalType, string> = {
    add: t('model.add'),
    edit: t('model.edit'),
    reset: '重置密码',
  }
  const name = modalType.value === 'reset' ? '' : modalName
  return locale.value === 'enUS' ? `${map[modalType.value]} ${name}` : `${map[modalType.value]}${name}`
})

/** 部门选项（平铺，前端展示 dept_name） */
const deptOptions = computed<SelectOption[]>(() =>
  allDepts.map(d => ({ label: d.dept_name ?? '', value: d.id! })),
)

async function openModal(type: ModalType, data?: Entity.User) {
  emit('open')
  modalType.value = type
  showModal()
  if (type === 'add') {
    userForm.value = { ...userFormDefault }
    resetForm.value = { password: '', confirm: '' }
  }
  else if (type === 'edit' && data) {
    userForm.value = {
      id: data.id,
      username: data.username ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      password: '',
      dept_id: data.dept_id ?? null,
      is_active: data.is_active ?? true,
    }
  }
  else if (type === 'reset' && data) {
    resetForm.value = { id: data.id, password: '', confirm: '' }
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
      await fetchCreateUser({
        username: userForm.value.username,
        email: userForm.value.email,
        password: userForm.value.password,
        phone: userForm.value.phone || undefined,
        dept_id: userForm.value.dept_id,
        is_active: userForm.value.is_active,
      })
      window.$message.success('新建成功')
    }
    else if (modalType.value === 'edit') {
      const { isSuccess } = await fetchUpdateUser(userForm.value.id!, {
        email: userForm.value.email || undefined,
        phone: userForm.value.phone || undefined,
        dept_id: userForm.value.dept_id,
        is_active: userForm.value.is_active,
      })
      if (isSuccess)
        window.$message.success('编辑成功')
    }
    else if (modalType.value === 'reset') {
      await fetchResetPassword(resetForm.value.id!, resetForm.value.password)
      // new_password 参数已通过 fetchResetPassword 封装映射
      window.$message.success('密码重置成功')
    }
    closeModal()
  }
  finally {
    endLoading()
  }
}

const userRules: Record<string, FormItemRule | FormItemRule[]> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3~20 位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}
const resetRules: Record<string, FormItemRule | FormItemRule[]> = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string) => {
        if (value !== resetForm.value.password)
          return new Error('两次输入密码不一致')
        return true
      },
      trigger: 'blur',
    },
  ],
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    :mask-closable="false"
    preset="card"
    :title="modalTitle"
    class="w-580px"
    :segmented="{ content: true, action: true }"
  >
    <!-- 重置密码表单 -->
    <template v-if="modalType === 'reset'">
      <n-form ref="formRef" :rules="resetRules" label-placement="left" :label-width="90" :model="resetForm">
        <n-grid :cols="1" :x-gap="18">
          <n-form-item-grid-item :span="1" label="新密码" path="password">
            <n-input v-model:value="resetForm.password" type="password" show-password-on="click" placeholder="请输入新密码（至少6位）" />
          </n-form-item-grid-item>
          <n-form-item-grid-item :span="1" label="确认密码" path="confirm">
            <n-input v-model:value="resetForm.confirm" type="password" show-password-on="click" placeholder="请再次输入新密码" />
          </n-form-item-grid-item>
        </n-grid>
      </n-form>
    </template>

    <!-- 新增 / 编辑用户表单 -->
    <template v-else>
      <n-form ref="formRef" :rules="userRules" label-placement="left" :label-width="90" :model="userForm">
        <n-grid :cols="2" :x-gap="18">
          <n-form-item-grid-item :span="2" label="用户名" path="username">
            <n-input v-model:value="userForm.username" :disabled="modalType === 'edit'" placeholder="3~20 位，创建后不可修改" />
          </n-form-item-grid-item>
          <n-form-item-grid-item :span="2" label="邮箱" path="email">
            <n-input v-model:value="userForm.email" placeholder="请输入邮箱" />
          </n-form-item-grid-item>
          <n-form-item-grid-item :span="1" label="手机号" path="phone">
            <n-input v-model:value="userForm.phone" placeholder="可选" />
          </n-form-item-grid-item>
          <n-form-item-grid-item v-if="modalType === 'add'" :span="1" label="初始密码" path="password">
            <n-input v-model:value="userForm.password" type="password" show-password-on="click" placeholder="至少6位" />
          </n-form-item-grid-item>
          <n-form-item-grid-item :span="2" label="所属部门" path="dept_id">
            <n-select
              v-model:value="userForm.dept_id"
              clearable
              filterable
              placeholder="不选则无部门"
              :options="deptOptions"
            />
          </n-form-item-grid-item>
          <n-form-item-grid-item :span="2" label="状态" path="is_active">
            <n-switch v-model:value="userForm.is_active">
              <template #checked>
                启用
              </template>
              <template #unchecked>
                停用
              </template>
            </n-switch>
          </n-form-item-grid-item>
        </n-grid>
      </n-form>
    </template>

    <template #action>
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
