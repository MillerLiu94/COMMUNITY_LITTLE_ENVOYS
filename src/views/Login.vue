<template>
  <div class="login-page">
    <div class="login-page__left">
      <img class="login-page__icon" src="@/assets/img/social-media.png" alt="社區小尖兵">
      <h1 class="login-page__title">社區小尖兵</h1>
      <p class="login-page__subtitle">讓社區變得更好，從你我開始</p>
      <p class="login-page__desc">
        即時通報社區事件、追蹤處理進度、凝聚鄰里共識<br>
        一起守護我們的家園
      </p>
    </div>
    <div class="login-page__right">
      <div class="login-page__card">
        <h2 class="login-page__heading">登入</h2>
        <RoleTabs v-model="selectedRole" />
        <div class="login-page__form-group">
          <label class="login-page__form-label">帳號</label>
          <input
            v-model="userName"
            type="text"
            class="login-page__form-input"
            placeholder="請輸入帳號"
          />
        </div>
        <div class="login-page__form-group">
          <label class="login-page__form-label">密碼</label>
          <input
            v-model="password"
            type="password"
            class="login-page__form-input"
            placeholder="請輸入密碼"
          />
        </div>
        <BaseButton
          variant="primary"
          size="lg"
          class="login-page__btn"
          :disabled="!canLogin"
          @click="handleLogin"
        >
          登入
        </BaseButton>
        <div class="login-page__links">
          <button class="login-page__link" @click="showRegister = true">註冊帳號</button>
        </div>
        <p class="login-page__hint">測試帳號：resident / chief / admin，密碼皆為 123</p>
      </div>
    </div>
    <RegisterModal :visible="showRegister" @close="showRegister = false" @register="handleRegister" />
    <Toast
      :visible="toastVisible"
      :message="toastMessage"
      type="error"
      @close="toastVisible = false"
    />
  </div>
</template>

<script>
import { RoleTabs, RegisterModal } from '@/components/auth'
import BaseButton from '@/components/common/BaseButton.vue'
import Toast from '@/components/common/Toast.vue'
import { mapActions } from 'vuex'

export default {
  name: 'LoginPage',
  components: { RoleTabs, BaseButton, RegisterModal, Toast },
  data() {
    return {
      selectedRole: '',
      userName: '',
      password: '',
      showRegister: false,
      toastVisible: false,
      toastMessage: ''
    }
  },
  computed: {
    canLogin() {
      return this.userName.trim() && this.password.trim()
    }
  },
  methods: {
    ...mapActions('auth', ['setRole', 'registerUser']),
    async handleLogin() {
      if (!this.canLogin) return
      if (!this.selectedRole) {
        this.toastMessage = '請選擇身份'
        this.toastVisible = true
        return
      }
      try {
        await this.setRole({
          selectedRole: this.selectedRole,
          userName: this.userName.trim(),
          password: this.password.trim()
        })
        this.$router.push('/home')
      } catch (err) {
        this.toastMessage = err.message
        this.toastVisible = true
      }
    },
    async handleRegister(form) {
      try {
        await this.registerUser({ ...form, name: form.name.trim() })
        this.toastMessage = '註冊成功，請登入'
        this.toastVisible = true
      } catch (err) {
        this.toastMessage = err.message
        this.toastVisible = true
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
}

.login-page__left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-6xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary-light) 100%);
  text-align: center;
}

.login-page__icon {
  width: 160px;
  height: auto;
}

.login-page__title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
}

.login-page__subtitle {
  font-size: var(--font-size-2xl);
  color: var(--color-secondary);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.login-page__desc {
  font-size: var(--font-size-md);
  color: var(--color-text-disabled);
  line-height: 1.8;
  margin: 0;
}

.login-page__right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-6xl);
  background: var(--color-surface);
}

.login-page__card {
  width: 360px;
  max-width: 100%;
}

.login-page__heading {
  margin: 0 0 var(--spacing-4xl);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-align: center;
}

.login-page__form-group {
  margin-top: var(--spacing-2xl);
}

.login-page__form-label {
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xxs);
}

.login-page__form-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  outline: none;
  transition: border-color 0.25s;
  box-sizing: border-box;
}

.login-page__form-input:focus {
  border-color: var(--color-secondary);
}

.login-page__btn {
  width: 100%;
  margin-top: var(--spacing-4xl);
}

.login-page__links {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-2xl);
}

.login-page__link {
  background: none;
  border: none;
  padding: 0;
  font-size: var(--font-size-sm);
  color: var(--color-secondary);
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.2s;
}

.login-page__link:hover {
  opacity: 0.75;
}

.login-page__hint {
  margin: var(--spacing-md) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .login-page__left {
    padding: var(--spacing-5xl) var(--spacing-3xl);
  }

  .login-page__icon {
    width: 100px;
  }

  .login-page__title {
    font-size: var(--font-size-3xl);
  }

  .login-page__subtitle {
    font-size: var(--font-size-lg);
  }

  .login-page__desc {
    font-size: var(--font-size-base);
  }

  .login-page__right {
    padding: var(--spacing-3xl);
  }
}
</style>
