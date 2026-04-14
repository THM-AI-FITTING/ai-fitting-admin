<template>
  <div class="fine-tune-sidebar glass-panel">
    <div class="sidebar-header">
      <h3>카테고리</h3>
    </div>
    <div class="category-list">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        :class="['category-item', { active: activeCategory === cat.id }]"
        @click="$emit('select-category', cat.id)"
      >
        <span class="icon">{{ cat.icon }}</span>
        <span class="name">{{ cat.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  activeCategory: { type: String, required: true }
});

const categories = [
  { id: 'face', name: '얼굴 골격', icon: '👤' },
  { id: 'eyes', name: '눈매 및 시선', icon: '👁️' },
  { id: 'nose-lips', name: '코와 입술', icon: '👃' },
  { id: 'hair', name: '헤어 스타일', icon: '💇' },
  { id: 'skin', name: '피부 및 특성', icon: '✨' }
];

defineEmits(['select-category']);
</script>

<style scoped>
.fine-tune-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem 1rem;
}

.sidebar-header h3 {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  padding-left: 0.5rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-main);
  border: 1px solid transparent;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
  cursor: pointer;
}

.category-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.category-item.active {
  background: rgba(var(--color-primary-rgb), 0.1);
  border-color: rgba(var(--color-primary-rgb), 0.3);
  color: var(--color-primary);
}

.category-item .icon {
  font-size: 1.25rem;
}

.category-item .name {
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
