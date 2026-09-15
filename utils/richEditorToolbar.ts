export type ToolbarFeature = 'decoration' | 'blocks' | 'layout' | 'markup' | 'image'

export type ControlId =
  | 'bold' | 'italic' | 'link'
  | 'underline' | 'strike'
  | 'h1' | 'h2' | 'h3' | 'bulletList' | 'orderedList' | 'blockquote' | 'horizontalRule'
  | 'alignLeft' | 'alignCenter' | 'alignRight'
  | 'code' | 'codeBlock'
  | 'image'

export type ExtensionKey =
  | 'bold' | 'italic' | 'link'
  | 'underline' | 'strike'
  | 'heading' | 'bulletList' | 'orderedList' | 'listItem' | 'blockquote' | 'horizontalRule'
  | 'textAlign'
  | 'code' | 'codeBlock'
  | 'image'

export interface ControlDef {
  id: ControlId
  layer: 'base' | ToolbarFeature
  order: number
  extensions: ExtensionKey[]
}

// Order drives left-to-right toolbar order. Base marks bracket the layers so
// bold/italic sit first and link sits after inline decorations.
export const TOOLBAR_CONTROLS: ControlDef[] = [
  { id: 'bold',          layer: 'base',       order: 10, extensions: ['bold'] },
  { id: 'italic',        layer: 'base',       order: 11, extensions: ['italic'] },
  { id: 'underline',     layer: 'decoration', order: 20, extensions: ['underline'] },
  { id: 'strike',        layer: 'decoration', order: 21, extensions: ['strike'] },
  { id: 'link',          layer: 'base',       order: 30, extensions: ['link'] },
  { id: 'h1',            layer: 'blocks',     order: 40, extensions: ['heading'] },
  { id: 'h2',            layer: 'blocks',     order: 41, extensions: ['heading'] },
  { id: 'h3',            layer: 'blocks',     order: 42, extensions: ['heading'] },
  { id: 'bulletList',    layer: 'blocks',     order: 43, extensions: ['bulletList', 'listItem'] },
  { id: 'orderedList',   layer: 'blocks',     order: 44, extensions: ['orderedList', 'listItem'] },
  { id: 'blockquote',    layer: 'blocks',     order: 45, extensions: ['blockquote'] },
  { id: 'horizontalRule',layer: 'blocks',     order: 46, extensions: ['horizontalRule'] },
  { id: 'alignLeft',     layer: 'layout',     order: 50, extensions: ['textAlign'] },
  { id: 'alignCenter',   layer: 'layout',     order: 51, extensions: ['textAlign'] },
  { id: 'alignRight',    layer: 'layout',     order: 52, extensions: ['textAlign'] },
  { id: 'code',          layer: 'markup',     order: 60, extensions: ['code'] },
  { id: 'codeBlock',     layer: 'markup',     order: 61, extensions: ['codeBlock'] },
  { id: 'image',         layer: 'image',      order: 70, extensions: ['image'] },
]

export const FULL_FEATURES: ToolbarFeature[] = ['decoration', 'blocks', 'markup', 'image']

export interface ResolveInput {
  features?: ToolbarFeature[] | 'full'
  remove?: ControlId[]
}

export interface ResolveResult {
  controls: ControlId[]
  extensions: Set<ExtensionKey>
}

export function resolveToolbar(input: ResolveInput = {}): ResolveResult {
  const features = input.features === 'full' ? FULL_FEATURES : (input.features ?? [])
  const remove = new Set(input.remove ?? [])
  const activeLayers = new Set<'base' | ToolbarFeature>(['base', ...features])

  const surviving = TOOLBAR_CONTROLS
    .filter(c => activeLayers.has(c.layer) && !remove.has(c.id))
    .sort((a, b) => a.order - b.order)

  const extensions = new Set<ExtensionKey>()
  for (const c of surviving) for (const e of c.extensions) extensions.add(e)

  return { controls: surviving.map(c => c.id), extensions }
}

// StarterKit v3 members we may need to disable. `link` is always disabled here
// because Link is registered separately (configured openOnClick:false). Only
// disabled members are returned (each `false`); enabled members are omitted so
// StarterKit keeps its defaults.
const STARTERKIT_MEMBERS: Partial<Record<ExtensionKey, string>> = {
  bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strike',
  heading: 'heading', bulletList: 'bulletList', orderedList: 'orderedList',
  listItem: 'listItem', blockquote: 'blockquote', horizontalRule: 'horizontalRule',
  code: 'code', codeBlock: 'codeBlock',
}

export function starterKitDisabledConfig(ext: Set<ExtensionKey>): Record<string, false> {
  const cfg: Record<string, false> = { link: false }
  for (const [key, skName] of Object.entries(STARTERKIT_MEMBERS)) {
    if (!ext.has(key as ExtensionKey)) cfg[skName] = false
  }
  return cfg
}
