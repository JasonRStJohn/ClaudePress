<template>
  <div class="border border-slate-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
      <button type="button" :class="tb()" title="Undo" @click="editor?.chain().focus().undo().run()">↩</button>
      <button type="button" :class="tb()" title="Redo" @click="editor?.chain().focus().redo().run()">↪</button>
      <span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
      <button type="button" :class="tb(editor?.isActive('bold'))" @click="editor?.chain().focus().toggleBold().run()"><strong>B</strong></button>
      <button type="button" :class="tb(editor?.isActive('italic'))" @click="editor?.chain().focus().toggleItalic().run()"><em>I</em></button>
      <button type="button" :class="tb(editor?.isActive('underline'))" @click="editor?.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <button type="button" :class="tb(editor?.isActive('strike'))" @click="editor?.chain().focus().toggleStrike().run()"><s>S</s></button>
      <button type="button" :class="tb(editor?.isActive('code'))" title="Inline code" @click="editor?.chain().focus().toggleCode().run()">&#96;c&#96;</button>
      <span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
      <button type="button" :class="tb(editor?.isActive('heading', { level: 1 }))" @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button type="button" :class="tb(editor?.isActive('heading', { level: 2 }))" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="tb(editor?.isActive('heading', { level: 3 }))" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
      <button type="button" :class="tb(editor?.isActive('bulletList'))" title="Bullet list" @click="editor?.chain().focus().toggleBulletList().run()">• list</button>
      <button type="button" :class="tb(editor?.isActive('orderedList'))" title="Numbered list" @click="editor?.chain().focus().toggleOrderedList().run()">1. list</button>
      <span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
      <button type="button" :class="tb(editor?.isActive('blockquote'))" @click="editor?.chain().focus().toggleBlockquote().run()">❝</button>
      <button type="button" :class="tb(editor?.isActive('codeBlock'))" title="Code block" @click="editor?.chain().focus().toggleCodeBlock().run()">{ }</button>
      <button type="button" :class="tb()" title="Horizontal rule" @click="editor?.chain().focus().setHorizontalRule().run()">―</button>
      <span class="w-px h-4 bg-slate-200 mx-1 inline-block" />
      <button type="button" :class="tb(editor?.isActive('link'))" title="Link" @click="handleLink">link</button>
      <button type="button" :class="tb()" title="Insert image" @click="imageInput?.click()">img</button>
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

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

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
    StarterKit.configure({
      // StarterKit v3 includes Link; disable it so we can configure it below.
      link: false,
    }),
    Link.configure({ openOnClick: false }),
    Image.configure({
      HTMLAttributes: { class: 'rounded-md max-w-full h-auto' },
    }),
    Placeholder.configure({ placeholder: props.placeholder ?? 'Start writing…' }),
  ],

  editorProps: {
    attributes: {
      class: 'prose prose-slate max-w-none px-4 py-3 min-h-48 focus:outline-none',
    },

    // Intercept file drops before the browser can navigate to the image.
    handleDrop(view, event, _slice, moved) {
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
</style>
