<script setup lang="ts">
import { computed, ref } from 'vue';
const props = defineProps<{ modelValue: string[]; options: string[]; allowCreate?: boolean; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const query = ref('');
const normalized = computed(() => query.value.trim().replace(/\s+/g, ' ').toLowerCase());
const matches = computed(() => props.options.filter(tag => !props.modelValue.includes(tag) && tag.includes(normalized.value)).slice(0, query.value ? 20 : 12));
const canCreate = computed(() => props.allowCreate && normalized.value.length > 0 && normalized.value.length <= 40 && !props.options.includes(normalized.value) && !props.modelValue.includes(normalized.value));
function add(tag: string) { if (!props.modelValue.includes(tag) && props.modelValue.length < 12) emit('update:modelValue', [...props.modelValue, tag]); query.value = ''; }
function enter() { if (canCreate.value) add(normalized.value); else if (matches.value[0]) add(matches.value[0]); }
</script>
<template>
  <div class="tag-picker"><label class="tag-search-label">{{ label }}<input v-model="query" type="search" maxlength="40" placeholder="Search tags…" @keydown.enter.prevent="enter"></label>
    <div v-if="modelValue.length" class="chosen-tags"><button v-for="tag in modelValue" :key="tag" type="button" class="tag selected-tag" :aria-label="'Remove tag ' + tag" @click="emit('update:modelValue', modelValue.filter(t => t !== tag))">{{ tag }} <span>×</span></button></div>
    <div class="tag-options"><button v-for="tag in matches" :key="tag" type="button" class="tag" :disabled="modelValue.length >= 12" @click="add(tag)">＋ {{ tag }}</button><button v-if="canCreate" type="button" class="create-tag" :disabled="modelValue.length >= 12" @click="add(normalized)">Create “{{ normalized }}”</button></div>
    <p v-if="!matches.length && !canCreate" class="tag-help">{{ modelValue.length >= 12 ? 'Up to 12 tags can be selected.' : 'No matching tags. Try another search.' }}</p><p v-else class="tag-help">{{ allowCreate ? 'Choose up to 12 tags, or search to create your own.' : 'Items must match all selected tags.' }}</p>
  </div>
</template>
