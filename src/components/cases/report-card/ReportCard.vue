<template>
  <div class="card-item" @click="$emit('click', cardData)">
    <div class="card-item__image-wrap">
      <img
        v-if="cardData.images && cardData.images[0]"
        class="card-item__image"
        :src="cardData.images[0]"
        :alt="categoryLabel"
      />
      <img v-else class="card-item__image card-item__image--placeholder" src="@/assets/img/no-pictures.png" alt="無圖片">
      <span class="card-item__status" :class="'card-item__status--' + cardData.status">
        {{ statusLabel }}
      </span>
    </div>
    <div class="card-item__body">
      <h3 class="card-item__title">{{ categoryLabel }}</h3>
      <p class="card-item__desc">{{ truncatedDesc }}</p>
      <div class="card-item__meta">
        <span class="card-item__author">{{ cardData.author.name }}</span>
        <span class="card-item__comments">{{ (cardData.comments || []).length }} 則留言</span>
        <span class="card-item__time">{{ timeAgo }}</span>
      </div>
      <div class="card-item__actions">
        <button
          v-if="showEdit"
          class="card-item__edit"
          @click.stop="$emit('edit', cardData)"
        >
          編輯
        </button>
        <button
          v-if="showDelete"
          class="card-item__delete"
          @click.stop="$emit('delete', cardData.id)"
        >
          刪除
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

const STATUS_MAP = {
  pending: '待處理',
  processing: '處理中',
  resolved: '已結案'
}

const CATEGORY_LABELS = {
  '路燈故障': '路燈故障',
  '道路破損': '道路破損',
  '垃圾堆積': '垃圾堆積',
  '違規停車': '違規停車',
  '環境髒亂': '環境髒亂'
}

export default {
  name: 'ReportCard',
  props: {
    cardData: { type: Object, required: true }
  },
  computed: {
    ...mapGetters('auth', ['currentRole', 'canDelete', 'userName']),
    statusLabel() {
      return STATUS_MAP[this.cardData.status] || this.cardData.status
    },
    categoryLabel() {
      return CATEGORY_LABELS[this.cardData.category] || this.cardData.category
    },
    truncatedDesc() {
      const desc = this.cardData.description || ''
      return desc.length > 60 ? desc.slice(0, 60) + '…' : desc
    },
    showEdit() {
      if (this.cardData.status !== 'pending') return false
      if (this.canDelete === 'own') return this.cardData.author.name === this.userName
      return false
    },
    showDelete() {
      if (this.cardData.status !== 'pending') return false
      if (this.canDelete === 'all') return true
      if (this.canDelete === 'own') return this.cardData.author.name === this.userName
      return false
    },
    timeAgo() {
      const d = new Date(this.cardData.createdAt)
      return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0')
    }
  }
}
</script>

<style scoped>
.card-item {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.card-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.card-item__image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.card-item__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-item__image--placeholder {
  object-fit: contain;
  padding: 16px;
  box-sizing: border-box;
  background: var(--color-bg-muted, #f0f0eb);
}

.card-item__status {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  padding: 2px var(--spacing-md);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  line-height: 1.6;
}

.card-item__status--pending {
  background-color: #E54B4B;
}

.card-item__status--processing {
  background-color: #F0CF61;
  color: var(--color-text-primary);
}

.card-item__status--resolved {
  background-color: #32B67A;
}

.card-item__body {
  padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-xl);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-item__title {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.card-item__desc {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  flex: 1;
}

.card-item__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.card-item__author {
  font-weight: var(--font-weight-semibold);
}

.card-item__comments {
  color: var(--color-secondary);
}

.card-item__time {
  margin-left: auto;
}

.card-item__actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  align-self: flex-end;
}

.card-item__edit {
  padding: var(--spacing-xxs) var(--spacing-lg);
  border: 1px solid var(--color-secondary);
  background: transparent;
  color: var(--color-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background 0.2s;
}

.card-item__edit:hover {
  background: var(--color-secondary);
  color: #fff;
}

.card-item__delete {
  padding: var(--spacing-xxs) var(--spacing-lg);
  border: 1px solid var(--color-accent-admin);
  background: transparent;
  color: var(--color-accent-admin);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background 0.2s;
}

.card-item__delete:hover {
  background: var(--color-accent-admin);
  color: #fff;
}

@media (max-width: 767px) {
  .card-item__meta {
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .card-item__time {
    margin-left: 0;
  }
}
</style>
