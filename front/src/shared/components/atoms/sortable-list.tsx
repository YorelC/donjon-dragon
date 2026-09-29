import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/shared/utils/utils"

// Un clic reste un clic : le glisser ne démarre qu'après quelques pixels.
const DRAG_ACTIVATION = { distance: 6 }

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "Pour déplacer cet élément, appuyez sur Espace, déplacez-le avec les flèches, " +
    "puis appuyez de nouveau sur Espace pour le poser, ou sur Échap pour annuler.",
}

interface SortableListProps {
  ids: readonly string[]
  onReorder: (ids: string[]) => void
  /** Le nom lu au lecteur d'écran pour chaque élément : jamais son identifiant. */
  nameOf: (id: string) => string
  className?: string
  children: React.ReactNode
}

/** Liste verticale réordonnable à la souris comme au clavier (Espace, flèches, Espace). */
function SortableList({ ids, onReorder, nameOf, className, children }: SortableListProps) {
  const sensors = useListSensors()
  const handleDragEnd = (event: DragEndEvent) => {
    const reordered = reorderedIds(ids, event)
    if (reordered) onReorder(reordered)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={frenchAccessibility(nameOf)}
    >
      <SortableContext items={[...ids]} strategy={verticalListSortingStrategy}>
        <ul data-slot="sortable-list" className={className}>{children}</ul>
      </SortableContext>
    </DndContext>
  )
}

function useListSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: DRAG_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
}

/** Le nouvel ordre après un glisser, ou `null` si la ligne est reposée à sa place. */
function reorderedIds(ids: readonly string[], { active, over }: DragEndEvent): string[] | null {
  if (!over || active.id === over.id) return null
  return arrayMove([...ids], ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
}

/** Les annonces de dnd-kit sont en anglais et lisent les identifiants : on les refait. */
function frenchAccessibility(nameOf: (id: string) => string) {
  return {
    announcements: frenchAnnouncements(nameOf),
    screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
  }
}

function frenchAnnouncements(nameOf: (id: string) => string): Announcements {
  const name = (id: UniqueIdentifier) => nameOf(String(id))
  return {
    onDragStart: ({ active }) => `${name(active.id)} saisi.`,
    onDragOver: ({ active, over }) =>
      over ? `${name(active.id)} à la place de ${name(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${name(active.id)} posé à la place de ${name(over.id)}.` : `${name(active.id)} posé.`,
    onDragCancel: ({ active }) => `Déplacement de ${name(active.id)} annulé.`,
  }
}

type SortableHandleBinding = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef"
>

const SortableHandleContext = React.createContext<SortableHandleBinding | null>(null)

interface SortableItemProps {
  id: string
  className?: string
  children: React.ReactNode
}

function SortableItem({ id, className, children }: SortableItemProps) {
  const sortable = useSortable({ id })

  return (
    <li
      ref={sortable.setNodeRef}
      style={sortableStyle(sortable)}
      data-slot="sortable-item"
      data-dragging={sortable.isDragging || undefined}
      className={cn("data-[dragging]:z-10 data-[dragging]:opacity-80", className)}
    >
      <SortableHandleContext.Provider value={sortable}>{children}</SortableHandleContext.Provider>
    </li>
  )
}

function sortableStyle({ transform, transition }: ReturnType<typeof useSortable>) {
  return { transform: CSS.Transform.toString(transform), transition }
}

/** La poignée seule déclenche le glisser : le reste de la ligne reste cliquable. */
function SortableHandle({ className, ...props }: React.ComponentProps<"button">) {
  const binding = React.useContext(SortableHandleContext)

  return (
    <button
      type="button"
      ref={binding?.setActivatorNodeRef}
      data-slot="sortable-handle"
      className={cn("cursor-grab touch-none active:cursor-grabbing", className)}
      {...binding?.attributes}
      {...binding?.listeners}
      {...props}
    />
  )
}

export { SortableHandle, SortableItem, SortableList }
