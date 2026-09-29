import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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

interface SortableListProps {
  ids: readonly string[]
  onReorder: (ids: string[]) => void
  className?: string
  children: React.ReactNode
}

/** Liste verticale réordonnable à la souris comme au clavier (Espace, flèches, Espace). */
function SortableList({ ids, onReorder, className, children }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: DRAG_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    onReorder(arrayMove([...ids], from, ids.indexOf(String(over.id))))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={[...ids]} strategy={verticalListSortingStrategy}>
        <ul data-slot="sortable-list" className={className}>{children}</ul>
      </SortableContext>
    </DndContext>
  )
}

type SortableHandleBinding = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef"
>

const SortableHandleContext = React.createContext<SortableHandleBinding | null>(null)

function SortableItem({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: React.ReactNode
}) {
  const sortable = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  }

  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      data-slot="sortable-item"
      data-dragging={sortable.isDragging || undefined}
      className={cn("data-[dragging]:z-10 data-[dragging]:opacity-80", className)}
    >
      <SortableHandleContext.Provider value={sortable}>{children}</SortableHandleContext.Provider>
    </li>
  )
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
