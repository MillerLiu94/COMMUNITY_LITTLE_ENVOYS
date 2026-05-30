<template>
  <div class="collapsible-section">
    <button class="collapsible-section__header" @click="toggle" :aria-expanded="isOpen">
      <span class="collapsible-section__title">
        <slot name="title" />
      </span>
      <svg
        class="collapsible-section__chevron"
        :class="{ 'collapsible-section__chevron--open': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <transition
      name="collapse"
      @before-enter="beforeEnter"
      @enter="enter"
      @after-enter="afterEnter"
      @before-leave="beforeLeave"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div v-show="isOpen" class="collapsible-section__body" ref="body">
        <div class="collapsible-section__content">
          <slot />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'CollapsiblePanel',
  props: {
    open: { type: Boolean, default: false }
  },
  data() {
    return { isOpen: this.open }
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen
    },
    beforeEnter(el) {
      el.style.height = '0'
      el.style.opacity = '0'
    },
    enter(el) {
      void el.offsetHeight
      el.style.height = el.scrollHeight + 'px'
      el.style.opacity = '1'
    },
    afterEnter(el) {
      el.style.height = ''
      el.style.opacity = ''
    },
    beforeLeave(el) {
      el.style.height = el.scrollHeight + 'px'
      el.style.opacity = ''
    },
    leave(el) {
      void el.offsetHeight
      el.style.height = '0'
      el.style.opacity = '0'
    },
    afterLeave(el) {
      el.style.height = ''
      el.style.opacity = ''
    }
  }
}
</script>

<style scoped>
.collapsible-section {
  margin-bottom: var(--spacing-5xl);
}

.collapsible-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-sm);
  padding: 0 0 var(--spacing-xs);
  border: none;
  border-bottom: 2px solid var(--color-border-light);
  background: none;
  cursor: pointer;
  color: var(--color-text-primary);
  text-align: left;
  font-family: var(--font-family-base);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  position: relative;
  transition: color var(--transition-fast);
}

.collapsible-section__header:hover {
  color: var(--color-secondary);
}

.collapsible-section__header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 48px;
  height: 2px;
  background: var(--color-secondary);
  border-radius: 1px;
  transition: width 1s ease;
}

.collapsible-section__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxs);
}

.collapsible-section__header:hover::after {
  width: 100%;
}

.collapsible-section__chevron {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--transition-base);
}

.collapsible-section__chevron--open {
  transform: rotate(180deg);
  color: var(--color-secondary);
}

.collapsible-section__body {
  overflow: hidden;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.35s ease, opacity 0.2s ease;
}

.collapsible-section__content {
  overflow: hidden;
}
</style>
