<template>
  <button
    class="btn"
    :class="['btn--' + variant, 'btn--' + size, { 'btn--disabled': disabled }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: v => ['primary', 'secondary', 'danger'].includes(v)
    },
    size: {
      type: String,
      default: 'md',
      validator: v => ['sm', 'md', 'lg'].includes(v)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.btn {
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: opacity 0.2s, transform 0.1s;
}

.btn:active:not(.btn--disabled) {
  transform: scale(0.97);
}

.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background-color: var(--color-secondary);
  color: var(--color-surface);
}

.btn--primary:hover:not(.btn--disabled) {
  opacity: 0.85;
}

.btn--secondary {
  background-color: #e8e8d8;
  color: var(--color-text-primary);
}

.btn--danger {
  background-color: var(--color-accent-admin);
  color: var(--color-surface);
}

.btn--sm {
  padding: var(--spacing-xxs) var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.btn--md {
  padding: var(--spacing-sm) var(--spacing-3xl);
  font-size: var(--font-size-md);
}

.btn--lg {
  padding: var(--spacing-lg) var(--spacing-5xl);
  font-size: var(--font-size-lg);
}
</style>
