<template>
  <div class="modal-overlay" v-if="visible" @click.self="handleCancel">
    <div class="modal-confirm">
      <button class="modal-confirm__close" @click="handleCancel" aria-label="關閉">&times;</button>

      <div class="modal-confirm__header">
        <h2 class="modal-confirm__title">{{ title }}</h2>
        <p class="modal-confirm__message">{{ message }}</p>
      </div>

      <div class="modal-confirm__footer">
        <BaseButton variant="secondary" size="md" @click="handleCancel">取消</BaseButton>
        <BaseButton variant="danger" size="md" @click="handleConfirm">確認{{ confirmText }}</BaseButton>
      </div>
    </div>
  </div>
</template>

<script>
import BaseButton from './BaseButton.vue'

export default {
  name: 'ConfirmModal',
  components: { BaseButton },
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '確認操作' },
    message: { type: String, default: '確定要執行此操作？' },
    confirmText: { type: String, default: '' }
  },
  emits: ['confirm', 'cancel', 'close'],
  watch: {
    visible(val) {
      if (val) {
        this._onKeyDown = (e) => {
          if (e.key === 'Escape') this.handleCancel()
        }
        document.addEventListener('keydown', this._onKeyDown)
      } else {
        if (this._onKeyDown) {
          document.removeEventListener('keydown', this._onKeyDown)
          this._onKeyDown = null
        }
      }
    }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm')
      this.$emit('close')
    },
    handleCancel() {
      this.$emit('cancel')
      this.$emit('close')
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

.modal-confirm {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-confirm__close {
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

.modal-confirm__close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.modal-confirm__header {
  padding: var(--spacing-5xl) var(--spacing-4xl) var(--spacing-3xl);
  text-align: center;
}

.modal-confirm__title {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.modal-confirm__message {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.modal-confirm__footer {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) var(--spacing-4xl) var(--spacing-4xl);
}

@media (max-width: 767px) {
  .modal-overlay {
    padding: var(--spacing-lg);
  }
}
</style>
