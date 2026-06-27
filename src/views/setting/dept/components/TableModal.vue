<script setup lang="ts">
import type { FormItemRule, SelectOption } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { fetchCreateDept, fetchUpdateDept } from '@/service'

interface Props {
  modalName?: string
  /** 所有部门（用于父级选择器） */
  allDepts: Entity.Department[]
}

const { modalName = '', allDepts } = defineProps<Props>()
const emit = defineEmits<{ open: [], close: [] }>()

const { t, locale } = useI18n()
const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)

interface DeptForm {
  id?: number
  parent_id: number | null
  dept_name: string
  sort: number
  leader: string
  phone: string
  email: string
  is_active: boolean
}

const formDefault: DeptForm = {
  parent_id: null,
  dept_name: '',
  sort: 0,
  leader: '',
  phone: '',
  email: '',
  is_active: true,
}
const formModel = ref<DeptForm>({ ...formDefault })

type ModalType = 'add' | 'edit'
const modalType = shallowRef<ModalType>('add')

const modalTitle = computed(() => {
  const map: Record<ModalType, string> = { add: t('model.add'), edit: t('model.edit') }
  return locale.value === 'enUS' ? `${map[modalType.value]} ${modalName}` : `${map[modalType.value]}${modalName}`
})

/** 父级部门选项（不包含自身及子孙，编辑时） */
const parentOptions = computed<SelectOption[]>(() => {
  const editId = formModel.value.id
  const exclude = new Set<number>()

  // 收集要排除的 ID（自身 + 所有子孙）
  if (editId) {
    function collectChildren(id: number) {
      exclude.add(id)
      allDepts.forEach((d) => {
        if (d.parent_id === id && d.id !== undefined)
          collectChildren(d.id)
      })
    }
    collectChildren(editId)
  }

  return allDepts
    .filter(d => d.id !== undefined && !exclude.has(d.id))
    .map(d => ({ label: d.dept_name ?? '', value: d.id! }))
})

/**
 * @param type 操作类型
 * @param data 编辑时传入部门数据
 * @param parent 新建子部门时传入父部门
 */
async function openModal(type: ModalType = 'add', data?: Entity.Department, parent?: Entity.Department) {
  emit('open')
  modalType.value = type
  showModal()
  if (type === 'add') {
    formModel.value = { ...formDefault, parent_id: parent?.id ?? null }
  }
  else if (data) {
    formModel.value = {
      id: data.id,
      parent_id: data.parent_id ?? null,
      dept_name: data.dept_name ?? '',
      sort: data.sort ?? 0,
      leader: data.leader ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      is_active: data.is_active ?? true,
    }
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
    const payload = {
      parent_id: formModel.value.parent_id,
      dept_name: formModel.value.dept_name,
      sort: formModel.value.sort,
      leader: formModel.value.leader || null,
      phone: formModel.value.phone || null,
      email: formModel.value.email || null,
      is_active: formModel.value.is_active,
    }
    if (modalType.value === 'add') {
      await fetchCreateDept(payload)
      window.$message.success('新增成功')
    }
    else {
      await fetchUpdateDept(formModel.value.id!, payload)
      window.$message.success('编辑成功')
    }
    closeModal()
  }
  finally {
    endLoading()
  }
}

const rules: Record<string, FormItemRule | FormItemRule[]> = {
  dept_name: { required: true, message: '请输入部门名称', trigger: 'blur' },
  sort: { required: true, type: 'number', message: '请输入排序权重', trigger: 'blur' },
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
    <n-form ref="formRef" :rules="rules" label-placement="left" :label-width="90" :model="formModel">
      <n-grid :cols="2" :x-gap="18">
        <n-form-item-grid-item :span="2" label="上级部门" path="parent_id">
          <n-select
            v-model:value="formModel.parent_id"
            clearable
            placeholder="不选则为根部门"
            :options="parentOptions"
          />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="2" label="部门名称" path="dept_name">
          <n-input v-model:value="formModel.dept_name" placeholder="请输入部门名称" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="1" label="负责人" path="leader">
          <n-input v-model:value="formModel.leader" placeholder="请输入负责人姓名" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="1" label="排序" path="sort">
          <n-input-number v-model:value="formModel.sort" :min="0" class="w-full" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="1" label="联系电话" path="phone">
          <n-input v-model:value="formModel.phone" placeholder="请输入联系电话" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="1" label="联系邮箱" path="email">
          <n-input v-model:value="formModel.email" placeholder="请输入联系邮箱" />
        </n-form-item-grid-item>
        <n-form-item-grid-item :span="2" label="状态" path="is_active">
          <n-switch v-model:value="formModel.is_active">
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
