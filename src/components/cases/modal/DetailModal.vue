<template>
  <div class="modal-overlay" v-if="visible" @click.self="handleClose">
    <div class="modal-detail">
      <button class="modal-detail__close" @click="handleClose" aria-label="關閉">&times;</button>

      <div class="modal-detail__layout">
        <div class="modal-detail__carousel-section">
          <div class="carousel__main" @click="openLightbox">
            <img
              v-if="images.length"
              :src="currentImage"
              :alt="categoryLabel"
              class="carousel__image"
            />
            <div v-else class="carousel__placeholder">無圖片</div>
            <button
              v-if="images.length > 1"
              class="carousel__arrow carousel__arrow--prev"
              @click.stop="prevImage"
              aria-label="上一張"
            >&#8249;</button>
            <button
              v-if="images.length > 1"
              class="carousel__arrow carousel__arrow--next"
              @click.stop="nextImage"
              aria-label="下一張"
            >&#8250;</button>
            <span v-if="images.length > 1" class="carousel__counter">
              {{ currentIndex + 1 }} / {{ images.length }}
            </span>
          </div>
          <div v-if="images.length > 1" class="carousel__thumbs">
            <img
              v-for="(img, i) in images"
              :key="i"
              :src="img"
              :class="['carousel__thumb', { 'carousel__thumb--active': i === currentIndex }]"
              @click="currentIndex = i"
              :alt="'圖片 ' + (i + 1)"
            />
          </div>
        </div>

        <div class="modal-detail__info-section">
      <div class="detail__header">
            <div class="detail__header-top">
              <h2 class="detail__title">{{ categoryLabel }}</h2>
              <span class="detail__status" :class="'detail__status--' + caseData.status">
                {{ statusLabel }}
              </span>
            </div>
            <div v-if="canChangeStatus && nextStatuses.length" class="detail__status-control">
              <select v-model="selectedStatus" @change="handleStatusChange" class="status-select">
                <option value="" disabled>變更狀態…</option>
                <option v-for="s in nextStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div v-if="canReject && caseData.status === 'processing' && !showRejectInput" class="detail__reject-area">
              <BaseButton size="sm" variant="warning" @click="showRejectInput = true">駁回</BaseButton>
            </div>
            <div v-if="showRejectInput" class="detail__reject-input-area">
              <textarea v-model="rejectReason" class="detail__reject-textarea" rows="3" placeholder="請寫駁回理由（選填）"></textarea>
              <div class="detail__reject-btn-row">
                <BaseButton size="sm" variant="danger" @click="confirmReject" :disabled="!rejectReason.trim()">確認駁回</BaseButton>
                <BaseButton size="sm" variant="secondary" @click="cancelReject">取消</BaseButton>
              </div>
            </div>
            <div v-if="caseData.rejectReason && caseData.status === 'pending'" class="detail__reject-info">
              <span class="detail__reject-label">駁回原因：</span>{{ caseData.rejectReason }}
            </div>
            <div v-if="canEditDelete && !editMode" class="detail__action-btns">
              <BaseButton size="sm" variant="secondary" @click="toggleEdit">編輯</BaseButton>
              <BaseButton size="sm" variant="danger" @click="handleDelete">刪除</BaseButton>
            </div>
          </div>

          <div v-if="editMode" class="detail__edit-area">
            <textarea v-model="editDescription" class="detail__edit-textarea" rows="4" placeholder="編輯描述…"></textarea>
            <div class="detail__edit-actions">
              <BaseButton size="sm" @click="saveEdit" :disabled="!editDescription.trim()">儲存</BaseButton>
              <BaseButton size="sm" variant="secondary" @click="cancelEdit">取消</BaseButton>
            </div>
          </div>
          <p v-else class="detail__description">{{ caseData.description }}</p>

          <div class="detail__meta">
            <span class="detail__author">回報者：{{ caseData.author.name }}</span>
            <span class="detail__time">{{ formatTime(caseData.createdAt) }}</span>
            <span
              v-if="caseData.addressText"
              class="detail__location"
            >
              <img class="detail__location-icon" src="@/assets/img/location.png" alt="��m">
              {{ caseData.addressText }}
            </span>
          </div>

          <div class="detail__comments">
              <h3 class="comments__title">
              討論區
              <span class="comments__count">{{ (caseData.comments || []).length }}</span>
            </h3>
            <div class="comments__list" ref="commentList">
              <div
                v-for="comment in (caseData.comments || [])"
                :key="comment.id"
                class="comment__item"
              >
                <div class="comment__header">
                  <span class="comment__role" :class="'comment__role--' + comment.author.role">
                    {{ roleLabelMap[comment.author.role] }}
                  </span>
                  <span v-if="comment.author.role === 'chief'" class="comment__official-tag">官方回覆</span>
                  <span class="comment__name">{{ comment.author.name }}</span>
                  <span class="comment__time">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <p class="comment__text">{{ comment.text }}</p>
              </div>
              <div v-if="!(caseData.comments || []).length" class="comments__empty">
                尚無留言，快來第一個留言吧！
              </div>
            </div>

            <div class="comments__input-area">
              <textarea
                v-model="newComment"
                class="comments__textarea"
                placeholder="輸入留言…"
                rows="2"
              ></textarea>
              <BaseButton
                size="sm"
                :disabled="!newComment.trim()"
                @click="submitComment"
              >發送留言</BaseButton>
            </div>
          </div>
        </div>
      </div>

      <div v-if="lightboxActive" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox__close" @click="closeLightbox" aria-label="關閉">&times;</button>
        <img :src="currentImage" class="lightbox__image" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BaseButton from '@/components/common/BaseButton.vue'

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

const ROLE_LABEL_MAP = {
  resident: '居民',
  chief: '里長',
  admin: '管理員'
}

const NEXT_STATUS = {
  pending: [{ value: 'processing', label: '處理中' }],
  processing: [{ value: 'resolved', label: '已結案' }],
  resolved: []
}

export default {
  name: 'DetailModal',
  components: { BaseButton },
  props: {
    visible: { type: Boolean, default: false },
    caseData: { type: Object, required: true }
  },
  data() {
    return {
      currentIndex: 0,
      lightboxActive: false,
      newComment: '',
      selectedStatus: '',
      editMode: false,
      editDescription: '',
      showRejectInput: false,
      rejectReason: ''
    }
  },
  computed: {
    ...mapGetters('auth', ['currentRole', 'userName', 'canChangeStatus', 'canReject']),
    images() {
      return this.caseData.images || []
    },
    currentImage() {
      return this.images[this.currentIndex] || ''
    },
    categoryLabel() {
      return CATEGORY_LABELS[this.caseData.category] || this.caseData.category
    },
    statusLabel() {
      return STATUS_MAP[this.caseData.status] || this.caseData.status
    },
    roleLabelMap() {
      return ROLE_LABEL_MAP
    },
    nextStatuses() {
      return NEXT_STATUS[this.caseData.status] || []
    },
    canEditDelete() {
      return this.caseData.status === 'pending' && this.caseData.author.name === this.userName
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.currentIndex = 0
        this.lightboxActive = false
        this.newComment = ''
        this.selectedStatus = ''
        this.editMode = false
        this.editDescription = ''
        this.showRejectInput = false
        this.rejectReason = ''
      }
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    ...mapActions('cases', ['addComment', 'updateCaseStatus', 'editCase', 'rejectCase']),
    handleKeydown(e) {
      if (!this.visible) return
      if (e.key === 'Escape') {
        if (this.lightboxActive) {
          this.closeLightbox()
        } else {
          this.handleClose()
        }
      }
    },
    handleClose() {
      this.$emit('close')
    },
    prevImage() {
      if (this.images.length < 2) return
      this.currentIndex = this.currentIndex === 0 ? this.images.length - 1 : this.currentIndex - 1
    },
    nextImage() {
      if (this.images.length < 2) return
      this.currentIndex = this.currentIndex === this.images.length - 1 ? 0 : this.currentIndex + 1
    },
    openLightbox() {
      if (this.images.length) {
        this.lightboxActive = true
      }
    },
    closeLightbox() {
      this.lightboxActive = false
    },
    submitComment() {
      const text = this.newComment.trim()
      if (!text) return
      const comment = {
        id: Date.now(),
        text,
        author: { name: this.userName, role: this.currentRole },
        createdAt: Date.now()
      }
      this.addComment({ caseId: this.caseData.id, comment })
      this.newComment = ''
      this.$nextTick(() => {
        const list = this.$refs.commentList
        if (list) {
          list.scrollTop = list.scrollHeight
        }
      })
    },
    handleStatusChange() {
      if (!this.selectedStatus) return
      this.updateCaseStatus({ caseId: this.caseData.id, status: this.selectedStatus })
      this.selectedStatus = ''
    },
    toggleEdit() {
      this.editMode = true
      this.editDescription = this.caseData.description
    },
    saveEdit() {
      this.editCase({ caseId: this.caseData.id, updates: { description: this.editDescription } })
      this.editMode = false
    },
    cancelEdit() {
      this.editMode = false
    },
    handleDelete() {
      this.$emit('delete', this.caseData.id)
      this.handleClose()
    },
    confirmReject() {
      if (!this.rejectReason.trim()) return
      this.rejectCase({ caseId: this.caseData.id, rejectReason: this.rejectReason.trim(), rejectedBy: this.userName })
      this.showRejectInput = false
      this.rejectReason = ''
    },
    cancelReject() {
      this.showRejectInput = false
      this.rejectReason = ''
    },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0')
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

.modal-detail {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 1100px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-detail__close {
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

.modal-detail__close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.modal-detail__layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.modal-detail__carousel-section {
  flex: 0 0 55%;
  display: flex;
  flex-direction: column;
  background: #f5f5f0;
}

.carousel__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 300px;
  cursor: zoom-in;
  overflow: hidden;
}

.carousel__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.carousel__placeholder {
  color: var(--color-text-disabled);
  font-size: var(--font-size-lg);
}

.carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  opacity: 0;
}

.carousel__main:hover .carousel__arrow {
  opacity: 1;
}

.carousel__arrow:hover {
  background: rgba(0, 0, 0, 0.7);
}

.carousel__arrow--prev {
  left: var(--spacing-md);
}

.carousel__arrow--next {
  right: var(--spacing-md);
}

.carousel__counter {
  position: absolute;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 2px var(--spacing-md);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
}

.carousel__thumbs {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  overflow-x: auto;
  flex-shrink: 0;
}

.carousel__thumb {
  width: 60px;
  height: 45px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.carousel__thumb:hover {
  opacity: 0.8;
}

.carousel__thumb--active {
  opacity: 1;
  outline: 2px solid var(--color-secondary);
}

.modal-detail__info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.detail__header {
  padding: var(--spacing-3xl) var(--spacing-3xl) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.detail__header-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.detail__title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.detail__status {
  flex-shrink: 0;
  padding: 2px var(--spacing-lg);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  line-height: 1.6;
}

.detail__status--pending {
  background-color: #E54B4B;
}

.detail__status--processing {
  background-color: #F0CF61;
  color: var(--color-text-primary);
}

.detail__status--resolved {
  background-color: #32B67A;
}

.detail__status-control {
  margin-top: var(--spacing-md);
}

.detail__reject-area {
  margin-top: var(--spacing-md);
}

.detail__reject-input-area {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-muted, #f9f9f5);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.detail__reject-textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-base);
  resize: vertical;
  outline: none;
  line-height: 1.5;
  box-sizing: border-box;
}

.detail__reject-textarea:focus {
  border-color: var(--color-accent-admin);
}

.detail__reject-btn-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.detail__reject-info {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: #fff3e0;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.detail__reject-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent-admin);
}

.comment__official-tag {
  display: inline-block;
  padding: 1px var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-accent-chief);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.detail__action-btns {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.detail__edit-area {
  padding: var(--spacing-lg) var(--spacing-3xl);
  flex-shrink: 0;
}

.detail__edit-textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  resize: vertical;
  outline: none;
  line-height: 1.5;
  box-sizing: border-box;
}

.detail__edit-textarea:focus {
  border-color: var(--color-secondary);
}

.detail__edit-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.status-select {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background: var(--color-surface);
  cursor: pointer;
  outline: none;
}

.status-select:focus {
  border-color: var(--color-secondary);
}

.detail__description {
  padding: var(--spacing-lg) var(--spacing-3xl);
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  flex-shrink: 0;
}

.detail__meta {
  padding: 0 var(--spacing-3xl) var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.detail__author {
  font-weight: var(--font-weight-semibold);
}

.detail__location {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-secondary);
  font-weight: var(--font-weight-semibold);
}

.detail__location-icon {
  width: 14px;
  height: 14px;
}

.detail__comments {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--color-border);
}

.comments__title {
  margin: 0;
  padding: var(--spacing-lg) var(--spacing-3xl);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.comments__count {
  color: var(--color-text-disabled);
  font-weight: var(--font-weight-normal);
}

.comments__list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-3xl);
}

.comments__empty {
  text-align: center;
  color: var(--color-text-disabled);
  font-size: var(--font-size-sm);
  padding: var(--spacing-4xl) 0;
}

.comment__item {
  padding: var(--spacing-lg) 0;
  border-bottom: 1px solid var(--color-border);
}

.comment__item:last-child {
  border-bottom: none;
}

.comment__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.comment__role {
  display: inline-block;
  padding: 1px var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
  line-height: 1.5;
}

.comment__role--resident {
  background-color: var(--color-accent-resident);
}

.comment__role--chief {
  background-color: var(--color-accent-chief);
  color: var(--color-text-primary);
}

.comment__role--admin {
  background-color: var(--color-accent-admin);
}

.comment__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.comment__time {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.comment__text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.comments__input-area {
  padding: var(--spacing-lg) var(--spacing-3xl);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
  flex-shrink: 0;
}

.comments__textarea {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-base);
  resize: none;
  outline: none;
  line-height: 1.4;
}

.comments__textarea:focus {
  border-color: var(--color-secondary);
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
}

.lightbox__close {
  position: absolute;
  top: var(--spacing-2xl);
  right: var(--spacing-2xl);
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 50%;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.lightbox__close:hover {
  background: rgba(255, 255, 255, 0.4);
}

.lightbox__image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
}

@media (max-width: 767px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-detail {
    max-width: 100%;
    max-height: 92vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .modal-detail__layout {
    flex-direction: column;
    overflow-y: auto;
  }

  .modal-detail__carousel-section {
    flex: none;
    min-height: 240px;
  }

  .carousel__main {
    min-height: 240px;
  }

  .modal-detail__info-section {
    overflow: visible;
  }

  .detail__header {
    padding: var(--spacing-2xl) var(--spacing-2xl) var(--spacing-md);
  }

  .detail__description {
    padding: var(--spacing-md) var(--spacing-2xl);
  }

  .detail__meta {
    padding: 0 var(--spacing-2xl) var(--spacing-md);
    gap: var(--spacing-md);
  }

  .comments__title {
    padding: var(--spacing-md) var(--spacing-2xl);
  }

  .comments__list {
    padding: 0 var(--spacing-2xl);
  }

  .comments__input-area {
    padding: var(--spacing-md) var(--spacing-2xl);
  }

  .modal-detail__close {
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .carousel__main {
    min-height: 200px;
  }

  .modal-detail__carousel-section {
    min-height: 200px;
  }

  .detail__title {
    font-size: var(--font-size-lg);
  }

  .detail__header-top {
    flex-wrap: wrap;
  }
}
</style>

