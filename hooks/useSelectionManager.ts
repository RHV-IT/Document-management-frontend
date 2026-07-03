'use client'

import { useState, useCallback, useRef } from 'react'

export type ItemType = 'file' | 'folder'

export interface ClipboardData {
  ids: string[]
  type: ItemType
  action: 'copy' | 'cut'
}

interface RegisteredItem {
  id: string
  type: ItemType
  index: number
}

interface SelectionManagerReturn {
  selectedItems: Set<string>
  selectedItemType: ItemType | null
  clipboard: ClipboardData | null
  hasSelection: boolean
  selectionCount: number
  registerItem: (id: string, type: ItemType, index: number) => void
  unregisterItem: (id: string, type: ItemType) => void
  selectItem: (id: string, type: ItemType, index: number, opts?: { shiftKey?: boolean; ctrlKey?: boolean }) => void
  isSelected: (id: string, type: ItemType) => boolean
  clearSelection: () => void
  selectAll: (items: { id: string; type: ItemType; index: number }[]) => void
  setClipboardCopy: (type: ItemType) => void
  setClipboardCut: (type: ItemType) => void
  clearClipboard: () => void
  getSelectedIds: (type?: ItemType) => string[]
}

/**
 * Lightweight Explorer-style selection + clipboard manager.
 * Item registration is index-based so shift-click range select works
 * regardless of DOM order or virtualization.
 */
export function useSelectionManager(): SelectionManagerReturn {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null)
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null)
  const lastIndexRef = useRef<number | null>(null)
  const itemsRef = useRef<Map<string, RegisteredItem>>(new Map())

  const key = (id: string, type: ItemType) => `${type}-${id}`

  const registerItem = useCallback((id: string, type: ItemType, index: number) => {
    itemsRef.current.set(key(id, type), { id, type, index })
  }, [])

  const unregisterItem = useCallback((id: string, type: ItemType) => {
    itemsRef.current.delete(key(id, type))
  }, [])

  const selectItem = useCallback(
    (id: string, type: ItemType, index: number, opts: { shiftKey?: boolean; ctrlKey?: boolean } = {}) => {
      const { shiftKey = false, ctrlKey = false } = opts
      const k = key(id, type)

      setSelectedItems((prev) => {
        const next = new Set(prev)

        if (shiftKey && lastIndexRef.current !== null && selectedItemType === type) {
          const start = Math.min(lastIndexRef.current, index)
          const end = Math.max(lastIndexRef.current, index)
          itemsRef.current.forEach((item) => {
            if (item.type === type && item.index >= start && item.index <= end) {
              next.add(key(item.id, item.type))
            }
          })
        } else if (ctrlKey) {
          if (next.has(k)) next.delete(k)
          else next.add(k)
        } else {
          next.clear()
          next.add(k)
        }

        return next
      })

      setSelectedItemType(type)
      lastIndexRef.current = index
    },
    [selectedItemType]
  )

  const isSelected = useCallback((id: string, type: ItemType) => selectedItems.has(key(id, type)), [selectedItems])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
    setSelectedItemType(null)
    lastIndexRef.current = null
  }, [])

  const selectAll = useCallback((items: { id: string; type: ItemType; index: number }[]) => {
    setSelectedItems(new Set(items.map((i) => key(i.id, i.type))))
    if (items.length > 0) {
      setSelectedItemType(items[0].type)
      lastIndexRef.current = items[items.length - 1].index
    }
  }, [])

  const getSelectedIds = useCallback(
    (type?: ItemType) => {
      return Array.from(selectedItems)
        .filter((k: string) => !type || k.startsWith(`${type}-`))
        .map((k: string) => k.replace(/^(file|folder)-/, ''))
    },
    [selectedItems]
  )

  const setClipboardCopy = useCallback(
    (type: ItemType) => {
      const ids = getSelectedIds(type)
      if (ids.length === 0) return
      setClipboard({ ids, type, action: 'copy' })
    },
    [getSelectedIds]
  )

  const setClipboardCut = useCallback(
    (type: ItemType) => {
      const ids = getSelectedIds(type)
      if (ids.length === 0) return
      setClipboard({ ids, type, action: 'cut' })
    },
    [getSelectedIds]
  )

  const clearClipboard = useCallback(() => setClipboard(null), [])

  return {
    selectedItems,
    selectedItemType,
    clipboard,
    hasSelection: selectedItems.size > 0,
    selectionCount: selectedItems.size,
    registerItem,
    unregisterItem,
    selectItem,
    isSelected,
    clearSelection,
    selectAll,
    setClipboardCopy,
    setClipboardCut,
    clearClipboard,
    getSelectedIds,
  }
}