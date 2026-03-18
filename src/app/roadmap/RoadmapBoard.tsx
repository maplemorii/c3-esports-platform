"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, X, Pencil, Check, ChevronRight, ChevronLeft,
  Zap, Bug, TrendingUp, Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ItemType   = "FEATURE" | "BUG" | "IMPROVEMENT"
type ItemStatus = "PLANNED" | "IN_DEVELOPMENT" | "COMPLETED"

interface BoardItem {
  id: string
  title: string
  description: string | null
  type: ItemType
  status: ItemStatus
  priority: number
  createdAt: Date | string
  updatedAt: Date | string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLUMNS: { status: ItemStatus; label: string; accent: string; dim: string }[] = [
  { status: "PLANNED",        label: "Planned",        accent: "rgba(59,130,246,0.7)",  dim: "rgba(59,130,246,0.12)" },
  { status: "IN_DEVELOPMENT", label: "In Development", accent: "rgba(251,146,60,0.8)",  dim: "rgba(251,146,60,0.12)" },
  { status: "COMPLETED",      label: "Completed",      accent: "rgba(52,211,153,0.75)", dim: "rgba(52,211,153,0.10)" },
]

const TYPE_META: Record<ItemType, { label: string; color: string; bg: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  FEATURE:     { label: "Feature",     color: "rgba(139,92,246,0.9)",  bg: "rgba(139,92,246,0.12)", Icon: Lightbulb },
  BUG:         { label: "Bug",         color: "rgba(239,68,68,0.9)",   bg: "rgba(239,68,68,0.12)",  Icon: Bug },
  IMPROVEMENT: { label: "Improvement", color: "rgba(251,191,36,0.9)",  bg: "rgba(251,191,36,0.12)", Icon: TrendingUp },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function apiPatch(id: string, data: Partial<BoardItem>) {
  const res = await fetch(`/api/board/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update")
  return res.json() as Promise<BoardItem>
}

async function apiCreate(data: { title: string; description?: string; type: ItemType; status: ItemStatus }) {
  const res = await fetch("/api/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create")
  return res.json() as Promise<BoardItem>
}

async function apiDelete(id: string) {
  await fetch(`/api/board/${id}`, { method: "DELETE" })
}

// ---------------------------------------------------------------------------
// TypeBadge
// ---------------------------------------------------------------------------
function TypeBadge({ type }: { type: ItemType }) {
  const { label, color, bg, Icon } = TYPE_META[type]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color, background: bg, border: `1px solid ${color.replace("0.9", "0.25")}` }}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
function BoardCard({
  item,
  canEdit,
  onMove,
  onDelete,
  onUpdate,
  colIndex,
}: {
  item: BoardItem
  canEdit: boolean
  onMove: (id: string, direction: "left" | "right") => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: { title: string; description: string; type: ItemType }) => void
  colIndex: number
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [desc, setDesc] = useState(item.description ?? "")
  const [type, setType] = useState<ItemType>(item.type)

  function saveEdit() {
    onUpdate(item.id, { title: title.trim() || item.title, description: desc, type })
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl border p-4 transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"
        ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"
        ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"
      }}
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25"
            placeholder="Title"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/70 placeholder:text-white/30 outline-none focus:border-white/25 resize-none"
            placeholder="Description (optional)"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ItemType)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/25"
          >
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
          </select>
          <div className="flex gap-2 mt-1">
            <button
              onClick={saveEdit}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors"
            >
              <Check className="h-3 w-3" /> Save
            </button>
            <button
              onClick={() => {
                setTitle(item.title)
                setDesc(item.description ?? "")
                setType(item.type)
                setEditing(false)
              }}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            <TypeBadge type={item.type} />
            {canEdit && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md p-1 text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="rounded-md p-1 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <p className="text-sm font-semibold text-white/85 leading-snug mb-1">{item.title}</p>
          {item.description && (
            <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
          )}

          {canEdit && (
            <div className="flex items-center gap-1.5 mt-3">
              {colIndex > 0 && (
                <button
                  onClick={() => onMove(item.id, "left")}
                  className="flex items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-medium text-white/35 hover:text-white/65 hover:bg-white/6 transition-colors border border-white/8"
                  title="Move left"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {COLUMNS[colIndex - 1].label}
                </button>
              )}
              {colIndex < COLUMNS.length - 1 && (
                <button
                  onClick={() => onMove(item.id, "right")}
                  className="flex items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-medium text-white/35 hover:text-white/65 hover:bg-white/6 transition-colors border border-white/8"
                  title="Move right"
                >
                  {COLUMNS[colIndex + 1].label}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Add Card Form
// ---------------------------------------------------------------------------
function AddCardForm({
  status,
  onAdd,
  onCancel,
}: {
  status: ItemStatus
  onAdd: (item: BoardItem) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [type, setType] = useState<ItemType>("FEATURE")
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!title.trim()) return
    startTransition(async () => {
      const created = await apiCreate({ title: title.trim(), description: desc || undefined, type, status })
      onAdd(created)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border p-4"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel() }}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 mb-2"
        placeholder="Card title..."
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={2}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/70 placeholder:text-white/30 outline-none focus:border-white/25 resize-none mb-2"
        placeholder="Description (optional)"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ItemType)}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/25 mb-3"
      >
        <option value="FEATURE">Feature</option>
        <option value="BUG">Bug</option>
        <option value="IMPROVEMENT">Improvement</option>
      </select>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!title.trim() || isPending}
          className="flex items-center gap-1.5 rounded-lg bg-brand/20 border border-brand/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/30 transition-colors disabled:opacity-40"
        >
          <Plus className="h-3 w-3" /> Add Card
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------
function BoardColumn({
  col,
  colIndex,
  items,
  canEdit,
  onMove,
  onDelete,
  onUpdate,
  onAdd,
}: {
  col: (typeof COLUMNS)[number]
  colIndex: number
  items: BoardItem[]
  canEdit: boolean
  onMove: (id: string, direction: "left" | "right") => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: { title: string; description: string; type: ItemType }) => void
  onAdd: (item: BoardItem) => void
}) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col min-h-0 flex-1 min-w-[280px] max-w-[380px]">
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full" style={{ background: col.accent, boxShadow: `0 0 8px ${col.accent}` }} />
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-white/70">
            {col.label}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
            style={{ background: col.dim, color: col.accent }}
          >
            {items.length}
          </span>
        </div>
        {canEdit && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg p-1.5 text-white/30 hover:text-white/65 hover:bg-white/6 transition-colors"
            title={`Add to ${col.label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Cards */}
      <div
        className="flex-1 rounded-2xl p-3 flex flex-col gap-2.5"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          minHeight: "240px",
        }}
      >
        <AnimatePresence mode="popLayout">
          {adding && (
            <AddCardForm
              key="add-form"
              status={col.status}
              onAdd={(item) => { onAdd(item); setAdding(false) }}
              onCancel={() => setAdding(false)}
            />
          )}
          {items.map((item) => (
            <BoardCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              colIndex={colIndex}
              onMove={onMove}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
          {items.length === 0 && !adding && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 items-center justify-center py-12"
            >
              <p className="text-xs text-white/20 text-center">
                {canEdit ? `Nothing here yet\nClick + to add a card` : "Nothing here yet"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------
export function RoadmapBoard({
  initialItems,
  canEdit,
}: {
  initialItems: BoardItem[]
  canEdit: boolean
}) {
  const [items, setItems] = useState<BoardItem[]>(initialItems)

  const statusOrder: ItemStatus[] = ["PLANNED", "IN_DEVELOPMENT", "COMPLETED"]

  function handleMove(id: string, direction: "left" | "right") {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const idx = statusOrder.indexOf(item.status)
        const nextStatus = statusOrder[direction === "right" ? idx + 1 : idx - 1]
        if (!nextStatus) return item
        apiPatch(id, { status: nextStatus }).catch(console.error)
        return { ...item, status: nextStatus }
      })
    )
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    apiDelete(id).catch(console.error)
  }

  function handleUpdate(id: string, data: { title: string; description: string; type: ItemType }) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...data, description: data.description || null } : item
      )
    )
    apiPatch(id, { ...data, description: data.description || undefined }).catch(console.error)
  }

  function handleAdd(item: BoardItem) {
    setItems((prev) => [item, ...prev])
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0.02 265)" }}>
      {/* Grid overlay */}
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-40" aria-hidden />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span
              className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              C3 Esports Platform
            </span>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1
                className="font-display font-bold text-white leading-none tracking-tight"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
              >
                ROADMAP
              </h1>
              <p className="font-sans text-sm mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                What we&apos;re building, fixing, and planning for the platform.
              </p>
            </div>

            {canEdit && (
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border flex-shrink-0"
                style={{
                  color: "rgba(196,28,53,0.85)",
                  background: "rgba(196,28,53,0.10)",
                  borderColor: "rgba(196,28,53,0.25)",
                }}
              >
                Edit Mode
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-5">
            {Object.entries(TYPE_META).map(([key, { label, color, bg, Icon }]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-8"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.4), rgba(59,130,246,0.3), transparent)" }}
          aria-hidden
        />

        {/* Board columns */}
        <div className="flex gap-5 overflow-x-auto pb-4">
          {COLUMNS.map((col, colIndex) => (
            <BoardColumn
              key={col.status}
              col={col}
              colIndex={colIndex}
              items={items.filter((i) => i.status === col.status)}
              canEdit={canEdit}
              onMove={handleMove}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onAdd={handleAdd}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
