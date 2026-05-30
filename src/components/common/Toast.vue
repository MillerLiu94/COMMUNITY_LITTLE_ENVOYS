<template>
  <transition name="toast-slide">
    <div v-if="visible" class="toast" :class="['toast--' + type]">
      <span class="toast__message">{{ message }}</span>
      <button class="toast__close" @click="dismiss">&times;</button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Toast',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'error',
      validator: v => ['error', 'success', 'info'].includes(v)
    },
    duration: {
      type: Number,
      default: 4000
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.setTimer()
        this.ignoreNextClick = true
      } else {
        this.clearTimer()
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleOutsideClick)
  },
  beforeDestroy() {
    this.clearTimer()
    document.removeEventListener('click', this.handleOutsideClick)
  },
  methods: {
    dismiss() {
      this.$emit('close')
    },
    setTimer() {
      this.clearTimer()
      this._timer = setTimeout(() => {
        this.$emit('close')
      }, this.duration)
    },
    clearTimer() {
      if (this._timer) {
        clearTimeout(this._timer)
        this._timer = null
      }
    },
    handleOutsideClick(e) {
      if (this.ignoreNextClick) {
        this.ignoreNextClick = false
        return
      }
      if (this.visible && this.$el && !this.$el.contains(e.target)) {
        this.dismiss()
      }
    }
  }
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  z-index: 9999;
  min-width: 280px;
  max-width: 480px;
}

.toast--error {
  background-color: var(--color-accent-admin);
  color: #fff;
}

.toast--success {
  background-color: var(--color-accent-resident);
  color: #fff;
}

.toast--info {
  background-color: var(--color-secondary);
  color: #fff;
}

.toast__message {
  flex: 1;
}

.toast__close {
  background: none;
  border: none;
  color: inherit;
  font-size: var(--font-size-xl);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.toast__close:hover {
  opacity: 1;
}

.toast-slide-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-slide-leave-active {
  animation: toast-out 0.25s ease-in forwards;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}
</style>
