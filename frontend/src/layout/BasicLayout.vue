<template>
  <div
    class="layout"
  >
  <!--     v-loading.fullscreen.lock="global.loading"
    :element-loading-text="global.loadingText"  loading图-->
    <TopBar />
    <div class="page-wrap">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import TopBar from './TopBar.vue'
import { useGlobalStore } from '@/stores/global'

const global = useGlobalStore()
</script>

<style lang="scss" scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f6fa;
}
.page-wrap {
  flex: 1;
  padding: 16px 24px 30px;
  overflow-x: auto;
  min-width: 1280px;
}
</style>
