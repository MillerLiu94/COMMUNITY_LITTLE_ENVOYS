<template>
  <div class="modal-overlay" v-if="visible" @click.self="handleClose">
    <div class="modal-create">
      <button
        class="modal-create__close"
        @click="handleClose"
        aria-label="關閉"
      >
        &times;
      </button>

      <div class="modal-create__header">
        <h2 class="modal-create__title">新增通報</h2>
      </div>

      <div class="modal-create__body">
        <div class="modal-create__section">
          <label class="modal-create__label">事件類別</label>
          <div class="modal-create__categories">
            <button
              v-for="cat in categories"
              :key="cat"
              class="modal-create__category"
              :class="{
                'modal-create__category--active': selectedCategory === cat,
              }"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div class="modal-create__section">
          <label class="modal-create__label">描述</label>
          <textarea
            v-model="description"
            class="modal-create__textarea"
            placeholder="請描述事件詳情"
            rows="3"
          ></textarea>
        </div>

        <div class="modal-create__section">
          <label class="modal-create__label">
            照片（可上傳最多 10 張）
            <span class="modal-create__count">{{ images.length }}/10</span>
          </label>
          <div class="modal-create__upload-area">
            <label class="modal-create__upload-btn" v-if="images.length < 10">
              <input
                type="file"
                multiple
                accept="image/*"
                @change="handleFileUpload"
                class="modal-create__file-input"
              />
              <span>+ 新增照片</span>
            </label>
            <div class="modal-create__previews">
              <div
                v-for="(img, idx) in images"
                :key="idx"
                class="modal-create__preview"
              >
                <img :src="img.url" class="modal-create__preview-img" />
                <button
                  class="modal-create__preview-remove"
                  @click="removeImage(idx)"
                  aria-label="移除照片"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
          <p v-if="uploadError" class="modal-create__error">
            {{ uploadError }}
          </p>
        </div>

        <div class="modal-create__section">
          <div class="modal-create__location-header">
            <label class="modal-create__label modal-create__label--inline"
              >位置</label
            >
            <p class="modal-create__address">
              {{ addressText || (mapsLoaded ? '無法定位' : '載入地圖中...') }}
            </p>
          </div>
          <div v-if="mapError" class="modal-create__map-error">
            <p>{{ mapError }}</p>
            <p class="modal-create__hint">
              請確認：<br />
               1. API Key 已填入 <code>src/config/index.js</code><br />
               2. 已啟用 Maps JavaScript API + Geocoding API<br />
               3. Google Cloud 帳戶已啟用<br/> 4. 檢查瀏覽器主控台 (F12)
               看詳細錯誤
            </p>
          </div>
          <div v-else class="modal-create__map-wrapper">
            <div v-if="!mapsLoaded" class="modal-create__map-loading">
              <LoadingSpinner />
            </div>
            <div ref="mapContainer" class="modal-create__map"></div>
          </div>
        </div>
      </div>

      <div class="modal-create__footer">
        <BaseButton variant="secondary" size="md" @click="handleClose"
          >取消</BaseButton
        >
        <BaseButton
          variant="primary"
          size="md"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          送出申報
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import config from '@/config'
import { loadGoogleMaps } from '@/utils/loadGoogleMaps'
import { readGPSFromFile } from '@/utils/exifReader'

const CATEGORIES = ['路燈故障', '道路破損', '垃圾堆積', '違規停車', '環境髒亂']

const DEFAULT_CENTER = { lat: 25.033976, lng: 121.564539 }
let cachedCoords = null
let geoPromise = null

function getGeoPosition() {
  if (!geoPromise) {
    geoPromise = new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 15000,
        enableHighAccuracy: false,
        maximumAge: 30000
      })
    })
  }
  return geoPromise
}

export default {
  name: 'DeclareModal',
  components: { BaseButton, LoadingSpinner },
  props: {
    visible: { type: Boolean, default: false }
  },
  data() {
    return {
      categories: CATEGORIES,
      selectedCategory: '',
      description: '',
      images: [],
      uploadError: '',
      location: null,
      addressText: '',
      mapsLoaded: false,
      mapInstance: null,
      markerInstance: null,
      geocoderInstance: null,
      mapError: '',
      sessionId: 0,
      initTimer: null
    }
  },
  computed: {
    ...mapGetters('auth', ['currentRole', 'userName']),
    canSubmit() {
      return this.selectedCategory && this.description.trim()
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.sessionId++
        this.resetForm()
        this.initTimer = setTimeout(() => this.initMap(), 300)
      } else {
        if (this.initTimer) {
          clearTimeout(this.initTimer)
          this.initTimer = null
        }
      }
    }
  },
  methods: {
    ...mapMutations('cases', ['ADD_CASE']),
    ...mapActions('cases', ['addCase']),
    resetForm() {
      this.selectedCategory = ''
      this.description = ''
      this.images = []
      this.uploadError = ''
      this.location = null
      this.addressText = ''
      this.mapError = ''
      this.destroyMap()
    },
    destroyMap() {
      if (this.markerInstance) {
        this.markerInstance.setMap(null)
        this.markerInstance = null
      }
      if (this.mapInstance) {
        this.mapInstance = null
      }
      this.geocoderInstance = null
      this.mapsLoaded = false
    },
    async initMap() {
      const sessionId = this.sessionId
      try {
        const maps = await loadGoogleMaps(config.googleMapsApiKey)
        if (this.sessionId !== sessionId) return
        this.mapsLoaded = true

        const container = this.$refs.mapContainer
        if (!container) {
          this.mapError = '地圖容器不存在'
          return
        }

        this.geocoderInstance = new maps.Geocoder()

        this.mapInstance = new maps.Map(container, {
          center: DEFAULT_CENTER,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        })

        this.markerInstance = new maps.Marker({
          position: DEFAULT_CENTER,
          map: this.mapInstance,
          draggable: true,
          title: '拖曳以調整位置'
        })

        this.markerInstance.addListener('dragend', () => {
          const pos = this.markerInstance.getPosition()
          this.location = { lat: pos.lat(), lng: pos.lng() }
          this.reverseGeocode(pos.lat(), pos.lng())
        })

        this.tryAutoLocate()
      } catch (err) {
        if (this.sessionId !== sessionId) return
        console.error('Google Maps 載入失敗', err)
        this.mapError = 'Google Maps 載入失敗：' + (err.message || '請檢查瀏覽器主控台')
      }
    },
    async tryAutoLocate() {
      const sessionId = this.sessionId

      if (cachedCoords) {
        this.updateMapPosition(cachedCoords.lat, cachedCoords.lng)
        return
      }

      if (navigator.geolocation) {
        try {
          const pos = await getGeoPosition()
          if (this.sessionId !== sessionId) return
          const { latitude: lat, longitude: lng } = pos.coords
          cachedCoords = { lat, lng }
          this.updateMapPosition(lat, lng)
          return
        } catch {
          if (this.sessionId !== sessionId) return
          geoPromise = null
          console.warn('瀏覽器定位失敗，嘗試 IP 定位')
        }
      }

      try {
        const res = await fetch('https://ipapi.co/json/')
        if (this.sessionId !== sessionId) return
        if (res.ok) {
          const data = await res.json()
          if (this.sessionId !== sessionId) return
          if (data.latitude && data.longitude) {
            this.updateMapPosition(data.latitude, data.longitude)
            return
          }
        }
      } catch {
        if (this.sessionId !== sessionId) return
        console.warn('IP 定位失敗，使用預設位置')
      }

      if (this.sessionId !== sessionId) return
      this.location = { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }
      this.reverseGeocode(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
    },
    updateMapPosition(lat, lng) {
      const pos = new window.google.maps.LatLng(lat, lng)
      if (this.mapInstance) this.mapInstance.setCenter(pos)
      if (this.markerInstance) this.markerInstance.setPosition(pos)
      this.location = { lat, lng }
      this.reverseGeocode(lat, lng)
    },
    reverseGeocode(lat, lng) {
      if (!this.geocoderInstance) return
      const sessionId = this.sessionId
      this.geocoderInstance.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (this.sessionId !== sessionId) return
          if (status === 'OK' && results.length > 0) {
            this.addressText = results[0].formatted_address
          } else {
            this.addressText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }
        }
      )
    },
    async handleFileUpload(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''

      if (this.images.length + files.length > 10) {
        this.uploadError = `最多上傳 10 張照片（已有 ${this.images.length} 張，新增 ${files.length} 張，超出限制）`
        return
      }
      this.uploadError = ''

      const isFirstImage = this.images.length === 0
      const sessionId = this.sessionId

      for (const file of files) {
        const url = URL.createObjectURL(file)
        this.images.push({ url, file })

        if (isFirstImage && this.images.length === 1) {
          try {
            const gps = await readGPSFromFile(file)
            if (this.sessionId !== sessionId) return
            if (gps) {
              this.updateMapPosition(gps.lat, gps.lng)
            }
          } catch (err) {
            console.warn('EXIF 讀取失敗', err)
          }
        }
      }
    },
    removeImage(idx) {
      const image = this.images[idx]
      if (image.url && image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url)
      }
      this.images.splice(idx, 1)
    },
    handleClose() {
      this.cleanupPreviews()
      this.$emit('close')
    },
    cleanupPreviews() {
      this.images.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url)
        }
      })
    },
    async handleSubmit() {
      if (!this.canSubmit) return

      const imageDataUrls = await Promise.all(
        this.images.map(img => this.fileToDataURL(img.file))
      )

      const newCase = {
        id: Date.now(),
        category: this.selectedCategory,
        description: this.description.trim(),
        images: imageDataUrls,
        status: 'pending',
        createdAt: Date.now(),
        author: { name: this.userName, role: this.currentRole },
        comments: [],
        location: this.location || null,
        addressText: this.addressText || '',
        is_deleted: false
      }

      try {
        await this.addCase(newCase)
      } catch {
        // fallback: 如�? API 失�?仍然?�到?�地
        this.ADD_CASE(newCase)
      }
      this.cleanupPreviews()
      this.$emit('close')
    },
    fileToDataURL(file) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
    }
  },
  beforeDestroy() {
    this.cleanupPreviews()
    this.destroyMap()
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

.modal-create {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-create__close {
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

.modal-create__close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.modal-create__header {
  padding: var(--spacing-4xl) var(--spacing-4xl) 0;
  flex-shrink: 0;
}

.modal-create__title {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.modal-create__body {
  padding: var(--spacing-3xl) var(--spacing-4xl);
  overflow-y: auto;
  flex: 1;
}

.modal-create__section {
  margin-bottom: var(--spacing-3xl);
}

.modal-create__location-header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.modal-create__label--inline {
  margin-bottom: 0;
  flex-shrink: 0;
}

.modal-create__label {
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.modal-create__count {
  color: var(--color-text-disabled);
  font-weight: var(--font-weight-normal);
  font-size: var(--font-size-sm);
}

.modal-create__categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.modal-create__category {
  padding: var(--spacing-sm) var(--spacing-xl);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-create__category:hover {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.modal-create__category--active {
  border-color: var(--color-secondary);
  background: var(--color-secondary);
  color: #fff;
}

.modal-create__textarea {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  resize: vertical;
  outline: none;
  line-height: 1.5;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.modal-create__textarea:focus {
  border-color: var(--color-secondary);
}

.modal-create__upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.modal-create__upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-disabled);
  transition: all 0.2s;
}

.modal-create__upload-btn:hover {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.modal-create__file-input {
  display: none;
}

.modal-create__previews {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.modal-create__preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.modal-create__preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.modal-create__preview-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-create__preview-remove:hover {
  background: rgba(0, 0, 0, 0.9);
}

.modal-create__error {
  color: var(--color-accent-admin);
  font-size: var(--font-size-sm);
  margin: var(--spacing-sm) 0 0;
}

.modal-create__map {
  width: 100%;
  height: 260px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  overflow: hidden;
}

.modal-create__map-error {
  width: 100%;
  min-height: 260px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-accent-admin);
  background: #fff5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  box-sizing: border-box;
  color: var(--color-accent-admin);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  text-align: center;
}

.modal-create__map-wrapper {
  position: relative;
}

.modal-create__map-loading {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.modal-create__map-wrapper .modal-create__map {
  border: none;
}

.modal-create__address {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.modal-create__hint {
  font-size: var(--font-size-sm);
  color: var(--color-accent-admin);
  margin: var(--spacing-sm) 0 0;
}

.modal-create__footer {
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

  .modal-create {
    max-width: 100%;
    max-height: 92vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .modal-create__header {
    padding: var(--spacing-4xl) var(--spacing-3xl) 0;
  }

  .modal-create__body {
    padding: var(--spacing-2xl) var(--spacing-3xl);
  }

  .modal-create__footer {
    padding: var(--spacing-2xl) var(--spacing-3xl);
  }

  .modal-create__map {
    height: 200px;
  }
}
</style>
