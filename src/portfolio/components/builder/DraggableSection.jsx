import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Edit3 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

const DraggableSection = ({ section, onEdit }) => {
    const { toggleSectionVisibility } = usePortfolio();
    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : section.visible ? 1 : 0.45,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="section-item">
            <div className="section-drag-handle" {...attributes} {...listeners}>
                <GripVertical size={15} />
            </div>
            <div className="section-info">
                <span className="section-title">{section.title}</span>
                <span className="section-type">{section.type}</span>
            </div>
            <div className="section-actions">
                <button className="action-btn" onClick={() => onEdit(section)} title="Edit section">
                    <Edit3 size={13} />
                </button>
                <button
                    className="action-btn"
                    onClick={() => toggleSectionVisibility(section.id)}
                    title={section.visible ? 'Hide section' : 'Show section'}
                    style={{ color: section.visible ? 'var(--pb-icon)' : 'var(--pb-accent)' }}
                >
                    {section.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
            </div>
        </div>
    );
};

export default DraggableSection;
