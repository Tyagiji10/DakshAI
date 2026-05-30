import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableSection from './DraggableSection';
import { usePortfolio } from '../../context/PortfolioContext';

const SectionList = ({ onEditSection }) => {
    const { state, updateSections } = usePortfolio();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = state.sections.findIndex((s) => s.id === active.id);
            const newIndex = state.sections.findIndex((s) => s.id === over.id);

            const newSections = arrayMove(state.sections, oldIndex, newIndex);
            updateSections(newSections);
        }
    };

    return (
        <div className="section-list">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={state.sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-3">
                        {state.sections.map((section) => (
                            <DraggableSection
                                key={section.id}
                                section={section}
                                onEdit={onEditSection}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default SectionList;
