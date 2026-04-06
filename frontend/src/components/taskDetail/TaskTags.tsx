import { useState } from "react";
import { Plus, Tag, X } from "lucide-react";

interface TaskTag {
  name: string;
  color?: string;
}

interface TaskTagsProps {
  tags: TaskTag[];
  isEditing: boolean;
  onTagsChange: (tags: TaskTag[]) => void;
}

const PRESET_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#14b8a6', '#84cc16', '#f97316', '#6b7280'];

export const TaskTags = ({ tags, isEditing, onTagsChange }: TaskTagsProps) => {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      setIsAddingTag(false);
      return;
    }
    if (tags.some((t) => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      setIsAddingTag(false);
      setNewTagName('');
      return;
    }
    const newTags = [...tags, { name: newTagName.trim(), color: newTagColor }];
    onTagsChange(newTags);
    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagName: string) => {
    const newTags = tags.filter((t) => t.name !== tagName);
    onTagsChange(newTags);
  };

  return (
    <div className="space-y-3.5 pt-2">
      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5" /> Phân loại (Tags)
      </h4>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div 
            key={tag.name} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-sm text-foreground text-[13px] font-bold"
          >
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: tag.color || '#ec4899' }} 
            />
            {tag.name}
            {isEditing && (
              <button 
                onClick={() => handleRemoveTag(tag.name)} 
                className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        
        {isEditing && !isAddingTag && (
          <button 
            onClick={() => setIsAddingTag(true)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground text-[13px] font-bold hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm Tag
          </button>
        )}

        {isEditing && isAddingTag && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-card shadow-sm w-full max-w-[200px]">
            <input 
              type="text" 
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape') setIsAddingTag(false);
              }}
              placeholder="Nhập tên tag..."
              className="flex-1 bg-transparent text-[13px] font-bold text-foreground outline-none px-2 w-full min-w-0 placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="relative w-6 h-6 shrink-0 border border-border rounded-lg overflow-hidden cursor-pointer" title="Chọn màu cho tag">
              <input 
                type="color" 
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="absolute inset-[-10px] w-20 h-20 cursor-pointer opacity-0 z-10"
              />
              <div className="w-full h-full" style={{ backgroundColor: newTagColor }} />
            </div>
            <button 
              onClick={handleAddTag} 
              className="w-6 h-6 shrink-0 flex items-center justify-center bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
