<template>
  <div class="modal-overlay" v-if="visible" @click.self="handleClose">
    <div class="modal-register">
      <button class="modal-register__close" @click="handleClose" aria-label="關閉">&times;</button>

      <div class="modal-register__header">
        <h2 class="modal-register__title">註冊帳號</h2>
        <p class="modal-register__subtitle">建立您的帳號以開始使用社區小尖兵</p>
      </div>

      <div class="modal-register__body">
        <div class="modal-register__form-group">
          <label class="modal-register__label">姓名</label>
          <input
            v-model="form.name"
            type="text"
            class="modal-register__input"
            :class="{ 'modal-register__input--error': errors.name }"
            placeholder="請輸入您的姓名"
            @input="clearFieldError('name')"
          />
          <p v-if="errors.name" class="modal-register__field-error">姓名為必填</p>
        </div>

        <div class="modal-register__form-group">
          <label class="modal-register__label">帳號</label>
          <input
            v-model="form.username"
            type="text"
            class="modal-register__input"
            :class="{ 'modal-register__input--error': errors.username }"
            placeholder="請輸入帳號"
            @input="clearFieldError('username')"
          />
          <p v-if="errors.username" class="modal-register__field-error">帳號為必填</p>
        </div>

        <div class="modal-register__form-group">
          <label class="modal-register__label">密碼</label>
          <input
            v-model="form.password"
            type="password"
            class="modal-register__input"
            :class="{ 'modal-register__input--error': errors.password }"
            placeholder="請輸入密碼"
            @input="clearFieldError('password')"
          />
          <p v-if="errors.password" class="modal-register__field-error">密碼長度至少為 6 個字元</p>
        </div>

        <div class="modal-register__form-group">
          <label class="modal-register__label">確認密碼</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="modal-register__input"
            :class="{ 'modal-register__input--error': errors.confirmPassword }"
            placeholder="再次輸入密碼"
            @input="clearFieldError('confirmPassword')"
          />
          <p v-if="errors.confirmPassword" class="modal-register__field-error">密碼與確認密碼不一致</p>
        </div>

        <p v-if="submitError" class="modal-register__error">{{ submitError }}</p>
      </div>

      <div class="modal-register__footer">
        <BaseButton variant="secondary" size="md" @click="handleClose">取消</BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          註冊
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'

export default {
  name: 'RegisterModal',
  components: { BaseButton },
  props: {
    visible: { type: Boolean, default: false }
  },
  data() {
    return {
      form: {
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'resident'
      },
      validRoles: ['resident'],
      submitted: false,
      errors: {
        name: false,
        username: false,
        password: false,
        confirmPassword: false
      },
      submitError: ''
    }
  },
  computed: {
    canSubmit() {
      return (
        this.form.name.trim() &&
        this.form.username.trim() &&
        this.form.password &&
        this.form.confirmPassword
      )
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetForm()
      }
    }
  },
  methods: {
    resetForm() {
      this.form = {
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'resident'
      }
      this.submitted = false
      this.errors = { name: false, username: false, password: false, confirmPassword: false }
      this.submitError = ''
    },
    clearFieldError(field) {
      this.errors[field] = false
    },
    handleClose() {
      this.$emit('close')
    },
    validate() {
      let valid = true
      this.errors = { name: false, username: false, password: false, confirmPassword: false }
      this.submitError = ''

      if (!this.form.name.trim()) {
        this.errors.name = true
        valid = false
      }
      if (!this.form.username.trim()) {
        this.errors.username = true
        valid = false
      }
      if (!this.form.password || this.form.password.length < 6) {
        this.errors.password = true
        valid = false
      }
      if (!this.form.confirmPassword) {
        this.errors.confirmPassword = true
        valid = false
      }
      if (this.form.password !== this.form.confirmPassword) {
        this.errors.confirmPassword = true
        valid = false
      }
      return valid
    },
    handleSubmit() {
      this.submitted = true
      if (!this.validate()) return
      if (!this.canSubmit) return

      this.$emit('register', { ...this.form })
      this.handleClose()
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
}

.modal-register {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-register__close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  z-index: 10;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-register__close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.modal-register__header {
  padding: var(--spacing-4xl) var(--spacing-4xl) 0;
  flex-shrink: 0;
}

.modal-register__title {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.modal-register__subtitle {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
}

.modal-register__body {
  padding: var(--spacing-3xl) var(--spacing-4xl);
  overflow-y: auto;
  flex: 1;
}

.modal-register__form-group {
  margin-bottom: var(--spacing-2xl);
}

.modal-register__label {
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xxs);
}

.modal-register__input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.modal-register__input:focus {
  border-color: var(--color-secondary);
}

.modal-register__input--error {
  border-color: var(--color-accent-admin);
}

.modal-register__input--error:focus {
  border-color: var(--color-accent-admin);
}

.modal-register__field-error {
  color: var(--color-accent-admin);
  font-size: var(--font-size-sm);
  margin: var(--spacing-xxs) 0 0;
}

.modal-register__error {
  color: var(--color-accent-admin);
  font-size: var(--font-size-sm);
  margin: var(--spacing-sm) 0 0;
}

.modal-register__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-3xl) var(--spacing-4xl);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-register {
    max-width: 100%;
    max-height: 92vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .modal-register__header {
    padding: var(--spacing-4xl) var(--spacing-3xl) 0;
  }

  .modal-register__body {
    padding: var(--spacing-2xl) var(--spacing-3xl);
  }

  .modal-register__footer {
    padding: var(--spacing-2xl) var(--spacing-3xl);
  }
}
</style>
