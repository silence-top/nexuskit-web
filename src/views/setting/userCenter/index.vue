<script setup lang="ts">
import type { FormInst, FormItemRule } from 'naive-ui'
import { useBoolean } from '@/hooks'
import { fetchChangeMyPassword, fetchMe, fetchUpdateMe } from '@/service'

const { bool: pageLoading, setTrue: startPage, setFalse: endPage } = useBoolean(false)
const { bool: infoLoading, setTrue: startInfo, setFalse: endInfo } = useBoolean(false)
const { bool: pwdLoading, setTrue: startPwd, setFalse: endPwd } = useBoolean(false)

const userInfo = ref<Entity.User>({})
const activeTab = ref<'info' | 'security'>('info')

// ── 基本信息 ──────────────────────────────────────────────────────────────
interface InfoForm {
  email: string
  phone: string
}
const infoFormRef = ref<FormInst | null>(null)
const infoForm = ref<InfoForm>({ email: '', phone: '' })
const infoRules: Record<string, FormItemRule | FormItemRule[]> = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
}

// ── 修改密码 ──────────────────────────────────────────────────────────────
interface PwdForm {
  old_password: string
  new_password: string
  confirm_password: string
}
const pwdFormRef = ref<FormInst | null>(null)
const pwdForm = ref<PwdForm>({ old_password: '', new_password: '', confirm_password: '' })
const pwdRules: Record<string, FormItemRule | FormItemRule[]> = {
  old_password: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_: any, value: string) => {
        if (value !== pwdForm.value.new_password)
          return new Error('两次输入的密码不一致')
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
}

// ── 数据加载 ──────────────────────────────────────────────────────────────
onMounted(() => loadMe())

async function loadMe() {
  startPage()
  const { data, isSuccess } = await fetchMe()
  if (isSuccess && data) {
    userInfo.value = data
    infoForm.value = {
      email: data.email ?? '',
      phone: data.phone ?? '',
    }
  }
  endPage()
}

// ── 提交基本信息 ──────────────────────────────────────────────────────────
async function submitInfo() {
  await infoFormRef.value?.validate()
  startInfo()
  try {
    const { isSuccess, data } = await fetchUpdateMe({
      email: infoForm.value.email || undefined,
      phone: infoForm.value.phone || undefined,
    })
    if (isSuccess && data) {
      userInfo.value = data
      window.$message.success('个人信息更新成功')
    }
  }
  finally {
    endInfo()
  }
}

// ── 提交修改密码 ──────────────────────────────────────────────────────────
async function submitPassword() {
  await pwdFormRef.value?.validate()
  startPwd()
  try {
    const { isSuccess } = await fetchChangeMyPassword(
      pwdForm.value.old_password,
      pwdForm.value.new_password,
    )
    if (isSuccess) {
      window.$message.success('密码修改成功，请重新登录')
      pwdForm.value = { old_password: '', new_password: '', confirm_password: '' }
    }
  }
  finally {
    endPwd()
  }
}
</script>

<template>
  <div class="p-4">
    <n-spin :show="pageLoading">
      <n-grid :cols="24" :x-gap="16" :y-gap="16">
        <!-- 左侧：用户信息卡 -->
        <n-gi :span="7">
          <n-card>
            <div class="flex flex-col items-center py-4 gap-4">
              <n-avatar
                round
                :size="80"
                :style="{ background: 'var(--n-color-embedded)', fontSize: '36px' }"
              >
                {{ userInfo.username?.charAt(0)?.toUpperCase() ?? 'U' }}
              </n-avatar>
              <div class="text-center">
                <div class="text-lg font-semibold">
                  {{ userInfo.username ?? '-' }}
                </div>
                <div class="text-sm text-gray-400 mt-1">
                  {{ userInfo.email ?? '暂未设置邮箱' }}
                </div>
              </div>
              <n-divider class="my-0!" />
              <n-descriptions label-placement="left" :column="1" class="w-full">
                <n-descriptions-item label="用户名">
                  {{ userInfo.username ?? '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="邮箱">
                  {{ userInfo.email ?? '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="手机号">
                  {{ userInfo.phone ?? '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="状态">
                  <n-tag :type="userInfo.is_active ? 'success' : 'warning'" size="small">
                    {{ userInfo.is_active ? '启用' : '停用' }}
                  </n-tag>
                </n-descriptions-item>
              </n-descriptions>
            </div>
          </n-card>
        </n-gi>

        <!-- 右侧：编辑区 -->
        <n-gi :span="17">
          <n-card>
            <n-tabs v-model:value="activeTab" type="line" animated>
              <!-- 基本信息 -->
              <n-tab-pane name="info" tab="基本信息">
                <n-form
                  ref="infoFormRef"
                  :model="infoForm"
                  :rules="infoRules"
                  label-placement="left"
                  label-width="80"
                  class="max-w-lg mt-4"
                >
                  <n-form-item label="用户名">
                    <n-input :value="userInfo.username" disabled placeholder="用户名不可修改" />
                  </n-form-item>
                  <n-form-item label="邮箱" path="email">
                    <n-input
                      v-model:value="infoForm.email"
                      placeholder="请输入邮箱"
                    />
                  </n-form-item>
                  <n-form-item label="手机号" path="phone">
                    <n-input
                      v-model:value="infoForm.phone"
                      placeholder="请输入手机号（可选）"
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button
                      type="primary"
                      :loading="infoLoading"
                      @click="submitInfo"
                    >
                      保存修改
                    </n-button>
                  </n-form-item>
                </n-form>
              </n-tab-pane>

              <!-- 安全设置 -->
              <n-tab-pane name="security" tab="安全设置">
                <n-form
                  ref="pwdFormRef"
                  :model="pwdForm"
                  :rules="pwdRules"
                  label-placement="left"
                  label-width="90"
                  class="max-w-lg mt-4"
                >
                  <n-form-item label="当前密码" path="old_password">
                    <n-input
                      v-model:value="pwdForm.old_password"
                      type="password"
                      show-password-on="click"
                      placeholder="请输入当前密码"
                    />
                  </n-form-item>
                  <n-form-item label="新密码" path="new_password">
                    <n-input
                      v-model:value="pwdForm.new_password"
                      type="password"
                      show-password-on="click"
                      placeholder="请输入新密码（至少 6 位）"
                    />
                  </n-form-item>
                  <n-form-item label="确认新密码" path="confirm_password">
                    <n-input
                      v-model:value="pwdForm.confirm_password"
                      type="password"
                      show-password-on="click"
                      placeholder="请再次输入新密码"
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button
                      type="primary"
                      :loading="pwdLoading"
                      @click="submitPassword"
                    >
                      修改密码
                    </n-button>
                  </n-form-item>
                </n-form>
              </n-tab-pane>
            </n-tabs>
          </n-card>
        </n-gi>
      </n-grid>
    </n-spin>
  </div>
</template>
