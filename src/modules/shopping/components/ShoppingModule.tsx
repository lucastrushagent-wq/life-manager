import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Check, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useShoppingStore } from '../store'
import type { ShoppingFrequency } from '../types'
import type { CreateItemData } from '../service'

const FREQUENCY_LABELS: Record<ShoppingFrequency, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
}

const EMPTY_FORM: CreateItemData = {
  name: '', quantity: '', notes: '', recurring: false,
  frequency: undefined, storeCode: '', url: '',
}

export function ShoppingModule() {
  const {
    stores, items, activeStoreId,
    loadStores, loadItems, setActiveStore,
    createStore, deleteStore,
    addItem, toggleItem, deleteItem, clearChecked,
  } = useShoppingStore()

  const [form, setForm] = useState<CreateItemData>(EMPTY_FORM)
  const [showMore, setShowMore] = useState(false)
  const [showAddStore, setShowAddStore] = useState(false)
  const [newStoreName, setNewStoreName] = useState('')
  const [confirmDeleteStore, setConfirmDeleteStore] = useState<string | null>(null)

  useEffect(() => { loadStores() }, [loadStores])

  useEffect(() => {
    if (activeStoreId && !items[activeStoreId]) loadItems(activeStoreId)
  }, [activeStoreId, items, loadItems])

  const activeItems = activeStoreId ? (items[activeStoreId] ?? []) : []
  const unchecked = activeItems.filter(i => !i.checked)
  const checked = activeItems.filter(i => i.checked)

  function patch(p: Partial<CreateItemData>) { setForm(f => ({ ...f, ...p })) }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !activeStoreId) return
    await addItem(activeStoreId, {
      ...form,
      name: form.name.trim(),
      quantity: form.quantity?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      storeCode: form.storeCode?.trim() || undefined,
      url: form.url?.trim() || undefined,
      frequency: form.recurring ? form.frequency : undefined,
    })
    setForm(EMPTY_FORM)
    setShowMore(false)
  }

  async function handleAddStore(e: React.FormEvent) {
    e.preventDefault()
    if (!newStoreName.trim()) return
    await createStore(newStoreName.trim())
    setNewStoreName('')
    setShowAddStore(false)
  }

  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full'

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Shopping</h1>

      {/* Store tabs */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {stores.map(store => (
          <div key={store.id} className="relative group">
            <button
              onClick={() => { setActiveStore(store.id); setConfirmDeleteStore(null) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeStoreId === store.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {store.name}
            </button>
            {activeStoreId === store.id && stores.length > 1 && (
              confirmDeleteStore === store.id ? (
                <span className="absolute -top-1 -right-1 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs shadow-sm">
                  <button onClick={() => { deleteStore(store.id); setConfirmDeleteStore(null) }} className="text-red-500 font-medium">Yes</button>
                  <button onClick={() => setConfirmDeleteStore(null)} className="text-gray-400">No</button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDeleteStore(store.id)}
                  className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 items-center justify-center bg-gray-200 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )
            )}
          </div>
        ))}
        {showAddStore ? (
          <form onSubmit={handleAddStore} className="flex items-center gap-1.5">
            <input autoFocus className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-32" placeholder="Store name" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} />
            <button type="submit" className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add</button>
            <button type="button" onClick={() => { setShowAddStore(false); setNewStoreName('') }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </form>
        ) : (
          <button onClick={() => setShowAddStore(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-full hover:border-gray-400">
            <Plus className="w-3.5 h-3.5" /> Add store
          </button>
        )}
      </div>

      {activeStoreId && (
        <>
          {/* Add item form */}
          <form onSubmit={handleAddItem} className="mb-6 rounded-lg border border-gray-200 p-3 bg-gray-50">
            <div className="flex gap-2 mb-2">
              <input className={inputCls} placeholder="Item name" value={form.name} onChange={e => patch({ name: e.target.value })} autoFocus />
              <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-20 flex-shrink-0" placeholder="Qty" value={form.quantity ?? ''} onChange={e => patch({ quantity: e.target.value })} />
              <button type="button" onClick={() => setShowMore(v => !v)} className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                More {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showMore && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input className={inputCls} placeholder="Notes" value={form.notes ?? ''} onChange={e => patch({ notes: e.target.value })} />
                <input className={inputCls} placeholder="Store code / SKU" value={form.storeCode ?? ''} onChange={e => patch({ storeCode: e.target.value })} />
                <input className={inputCls} placeholder="Product URL" value={form.url ?? ''} onChange={e => patch({ url: e.target.value })} />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={form.recurring} onChange={e => patch({ recurring: e.target.checked, frequency: e.target.checked ? (form.frequency ?? 'monthly') : undefined })} className="rounded" />
                    Recurring
                  </label>
                  {form.recurring && (
                    <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 bg-white" value={form.frequency ?? 'monthly'} onChange={e => patch({ frequency: e.target.value as ShoppingFrequency })}>
                      {(Object.keys(FREQUENCY_LABELS) as ShoppingFrequency[]).map(f => (
                        <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={!form.name.trim()} className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </form>

          {/* Unchecked items */}
          {unchecked.length === 0 && checked.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-12">No items yet. Add one above.</p>
          )}

          {unchecked.length > 0 && (
            <div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
              {unchecked.map((item, i) => (
                <div key={item.id} className={`flex items-start gap-3 px-4 py-3 bg-white ${i < unchecked.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <button onClick={() => toggleItem(activeStoreId, item)} className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-400 flex-shrink-0 flex items-center justify-center" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      {item.quantity && <span className="text-xs text-gray-400">× {item.quantity}</span>}
                      {item.storeCode && <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item.storeCode}</span>}
                      {item.recurring && (
                        <span className="flex items-center gap-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <RefreshCw className="w-2.5 h-2.5" />
                          {item.frequency ? FREQUENCY_LABELS[item.frequency] : 'Recurring'}
                        </span>
                      )}
                    </div>
                    {(item.notes || item.url) && (
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.notes && <span className="text-xs text-gray-400 italic">{item.notes}</span>}
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-700">
                            <ExternalLink className="w-3 h-3" /> Link
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteItem(activeStoreId, item.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Checked items */}
          {checked.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">In cart ({checked.length})</span>
                <button onClick={() => clearChecked(activeStoreId)} className="text-xs text-gray-400 hover:text-red-500">Clear all</button>
              </div>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                {checked.map((item, i) => (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 bg-gray-50 ${i < checked.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <button onClick={() => toggleItem(activeStoreId, item)} className="w-5 h-5 rounded border-2 border-blue-400 bg-blue-400 flex-shrink-0 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-400 line-through">{item.name}</span>
                      {item.quantity && <span className="ml-2 text-xs text-gray-300">× {item.quantity}</span>}
                      {item.storeCode && <span className="ml-2 text-xs font-mono text-gray-300">{item.storeCode}</span>}
                    </div>
                    <button onClick={() => deleteItem(activeStoreId, item.id)} className="text-gray-300 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
