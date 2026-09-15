<template>
  <div class="border border-slate-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
      <button type="button" :class="tb()" title="Undo" @click="editor?.chain().focus().undo().run()">↩</button>
      <button type="button" :class="tb()" title="Redo" @click="editor?.chain().focus().redo().run()">↪</button>
      <span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
      <button
        v-for="id in resolved.controls" :key="id"
        type="button" :class="tb(editor ? CONTROL_VIEWS[id].isActive(editor) : false)"
        :title="CONTROL_VIEWS[id].title"
        @click="editor && CONTROL_VIEWS[id].run(editor)"
        v-html="CONTROL_VIEWS[id].label"
      />
      <span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
      <button type="button" :class="tb()" title="Clear formatting" @click="editor?.chain().focus().clearNodes().unsetAllMarks().run()">✕ fmt</button>
    </div>

    <!-- Image upload progress -->
    <div v-if="uploading" class="px-4 py-1.5 text-xs text-blue-700 bg-blue-50 border-b border-blue-100">
      Uploading image…
    </div>

    <!-- Hidden file input for toolbar image button -->
    <input
      ref="imageInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      class="hidden"
      @change="handleImageInputChange"
    />

    <!-- Editor -->
    <EditorContent :editor="editor" />

  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import {
  resolveToolbar, starterKitDisabledConfig, FULL_FEATURES,
  type ToolbarFeature, type ControlId,
} from '../../utils/richEditorToolbar'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  features?: ToolbarFeature[] | 'full'
  remove?: ControlId[]
}>()

if (import.meta.dev && props.features === 'full') {
  console.warn(
    '[ClaudePress] <CpRichEditor features="full"> is deprecated. Replace with an ' +
    'explicit layer array right-sized to this field. See ' +
    'docs/superpowers/specs/2026-09-15-richeditor-toolbar-layers-design.md',
  )
}

const resolved = resolveToolbar({ features: props.features, remove: props.remove })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { pb } = useAuth()
const pbPublicUrl = usePbPublicUrl()
const imageInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

// Upload a file to the media collection and return the public URL.
const uploadImage = async (file: File): Promise<string> => {
  const data = new FormData()
  data.append('file', file)
  const record = await pb.collection('media').create(data)
  const filename = Array.isArray(record.file) ? record.file[0] : record.file
  return `${pbPublicUrl}/api/files/${record.collectionId}/${record.id}/${filename}`
}

// Insert an image node at the current selection.
const insertImage = (url: string, alt = '') => {
  editor.value?.chain().focus().setImage({ src: url, alt }).run()
}

// Upload one or more image files and insert them.
const uploadAndInsert = async (files: File[]) => {
  if (!files.length) return
  uploading.value = true
  try {
    for (const file of files) {
      const url = await uploadImage(file)
      insertImage(url, file.name.replace(/\.[^.]+$/, ''))
    }
  } catch (e) {
    console.error('[ClaudePress] image upload failed', e)
  } finally {
    uploading.value = false
  }
}

// Track the last value we emitted to prevent the watch from triggering
// setContent in response to our own emissions (causes cursor resets + lag).
let lastEmitted = props.modelValue ?? ''

const editor = useEditor({
  content: props.modelValue ?? '',

  // Required in Tiptap v3 — re-rendering is opt-in so toolbar active states update.
  shouldRerenderOnTransaction: true,

  extensions: [
    StarterKit.configure(starterKitDisabledConfig(resolved.extensions)),
    Link.configure({ openOnClick: false }), // base, always present
    ...(resolved.extensions.has('image')
      ? [Image.configure({ HTMLAttributes: { class: 'rounded-md max-w-full h-auto' } })]
      : []),
    ...(resolved.extensions.has('textAlign')
      ? [TextAlign.configure({
          types: resolved.extensions.has('heading') ? ['heading', 'paragraph'] : ['paragraph'],
        })]
      : []),
    Placeholder.configure({ placeholder: props.placeholder ?? 'Start writing…' }),
  ],

  editorProps: {
    attributes: {
      class: 'prose prose-slate max-w-none px-4 py-3 min-h-48 focus:outline-none',
    },

    // Intercept file drops before the browser can navigate to the image.
    handleDrop(view, event, _slice, moved) {
      if (!resolved.extensions.has('image')) return false // image control not enabled; drop the image
      if (moved) return false // already-in-editor node being moved, let Tiptap handle it
      const files = Array.from(event.dataTransfer?.files ?? []).filter(f =>
        f.type.startsWith('image/'),
      )
      if (!files.length) return false
      event.preventDefault()
      uploadAndInsert(files)
      return true
    },

    // Intercept image pastes (e.g. screenshot from clipboard).
    handlePaste(_view, event) {
      if (!resolved.extensions.has('image')) return false // image control not enabled; drop the image
      const files = Array.from(event.clipboardData?.files ?? []).filter(f =>
        f.type.startsWith('image/'),
      )
      if (!files.length) return false
      event.preventDefault()
      uploadAndInsert(files)
      return true
    },
  },

  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    lastEmitted = html
    emit('update:modelValue', html)
  },
})

// Only sync from outside when the value genuinely changed externally
// (e.g. initial data load). Skip when the change is our own emission.
watch(
  () => props.modelValue,
  (val) => {
    const incoming = val ?? ''
    if (editor.value && incoming !== lastEmitted) {
      lastEmitted = incoming
      editor.value.commands.setContent(incoming, false)
    }
  },
)

onBeforeUnmount(() => editor.value?.destroy())

// Toolbar image button → file picker
const handleImageInputChange = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) uploadAndInsert(files)
  // Reset so the same file can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

const handleLink = () => {
  if (!editor.value) return
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
  } else {
    const url = window.prompt('Enter URL')
    if (url) editor.value.chain().focus().setLink({ href: url }).run()
  }
}

// Control -> render mapping driving the toolbar `v-for`. Undo/redo and
// clear-formatting are fixed buttons outside this map (see template).
type ControlView = { title: string; label: string; isActive: (e: any) => boolean; run: (e: any) => void }
const CONTROL_VIEWS: Record<ControlId, ControlView> = {
  bold:           { title: 'Bold', label: '<strong>B</strong>', isActive: e => e.isActive('bold'), run: e => e.chain().focus().toggleBold().run() },
  italic:         { title: 'Italic', label: '<em>I</em>', isActive: e => e.isActive('italic'), run: e => e.chain().focus().toggleItalic().run() },
  underline:      { title: 'Underline', label: '<u>U</u>', isActive: e => e.isActive('underline'), run: e => e.chain().focus().toggleUnderline().run() },
  strike:         { title: 'Strikethrough', label: '<s>S</s>', isActive: e => e.isActive('strike'), run: e => e.chain().focus().toggleStrike().run() },
  link:           { title: 'Link', label: 'link', isActive: e => e.isActive('link'), run: () => handleLink() },
  h1:             { title: 'Heading 1', label: 'H1', isActive: e => e.isActive('heading', { level: 1 }), run: e => e.chain().focus().toggleHeading({ level: 1 }).run() },
  h2:             { title: 'Heading 2', label: 'H2', isActive: e => e.isActive('heading', { level: 2 }), run: e => e.chain().focus().toggleHeading({ level: 2 }).run() },
  h3:             { title: 'Heading 3', label: 'H3', isActive: e => e.isActive('heading', { level: 3 }), run: e => e.chain().focus().toggleHeading({ level: 3 }).run() },
  bulletList:     { title: 'Bullet list', label: '• list', isActive: e => e.isActive('bulletList'), run: e => e.chain().focus().toggleBulletList().run() },
  orderedList:    { title: 'Numbered list', label: '1. list', isActive: e => e.isActive('orderedList'), run: e => e.chain().focus().toggleOrderedList().run() },
  blockquote:     { title: 'Quote', label: '❝', isActive: e => e.isActive('blockquote'), run: e => e.chain().focus().toggleBlockquote().run() },
  horizontalRule: { title: 'Horizontal rule', label: '―', isActive: () => false, run: e => e.chain().focus().setHorizontalRule().run() },
  alignLeft:      { title: 'Align left', label: '⇤', isActive: e => e.isActive({ textAlign: 'left' }), run: e => e.chain().focus().setTextAlign('left').run() },
  alignCenter:    { title: 'Align center', label: '↔', isActive: e => e.isActive({ textAlign: 'center' }), run: e => e.chain().focus().setTextAlign('center').run() },
  alignRight:     { title: 'Align right', label: '⇥', isActive: e => e.isActive({ textAlign: 'right' }), run: e => e.chain().focus().setTextAlign('right').run() },
  code:           { title: 'Inline code', label: '&#96;c&#96;', isActive: e => e.isActive('code'), run: e => e.chain().focus().toggleCode().run() },
  codeBlock:      { title: 'Code block', label: '{ }', isActive: e => e.isActive('codeBlock'), run: e => e.chain().focus().toggleCodeBlock().run() },
  image:          { title: 'Insert image', label: 'img', isActive: () => false, run: () => imageInput.value?.click() },
}

const tb = (active?: boolean) =>
  `px-2 py-1 text-xs rounded transition-colors select-none ${
    active
      ? 'bg-slate-700 text-white'
      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
  }`
</script>

<style>
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}

.tiptap a {
  color: #2563eb;          /* blue-600 — links are visibly links while editing */
  text-decoration: underline;
}
</style>
