import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';

type AssetNotesProps = {
  assetId: string;
};

type Note = {
  id: string;
  note_text: string;
  note_category: string;
  created_at: string;
  updated_at: string;
};

const noteCategories = [
  { value: 'general', label: 'General', color: 'default' },
  { value: 'maintenance', label: 'Maintenance', color: 'warning' },
  { value: 'repairs', label: 'Repairs', color: 'destructive' },
  { value: 'modifications', label: 'Modifications', color: 'secondary' },
  { value: 'insurance', label: 'Insurance', color: 'success' },
];

export default function AssetNotes({ assetId }: AssetNotesProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    note_text: '',
    note_category: 'general',
  });

  useEffect(() => {
    fetchNotes();
  }, [assetId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('asset_notes')
        .select('*')
        .eq('asset_id', assetId)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteData = {
        asset_id: assetId,
        owner_id: user?.id,
        note_text: formData.note_text,
        note_category: formData.note_category,
      };

      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from('asset_notes')
          .update(noteData)
          .eq('id', editingNote.id);

        if (error) throw error;
      } else {
        // Create new note
        const { error } = await supabase
          .from('asset_notes')
          .insert([noteData]);

        if (error) throw error;
      }

      // Reset form
      setFormData({
        note_text: '',
        note_category: 'general',
      });
      setShowAddForm(false);
      setEditingNote(null);
      
      await fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      note_text: note.note_text,
      note_category: note.note_category,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('asset_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingNote(null);
    setFormData({
      note_text: '',
      note_category: 'general',
    });
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.note_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || note.note_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const categoryConfig = noteCategories.find(cat => cat.value === category);
    return categoryConfig?.color || 'default';
  };

  if (loading && notes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-slate-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-slate-900">Asset Notes</h3>
          <span className="ml-2 text-sm text-slate-500">({notes.length})</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {noteCategories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <h4 className="text-sm font-medium text-slate-900 mb-3">
            {editingNote ? 'Edit Note' : 'Add New Note'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="note_category" className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="note_category"
                name="note_category"
                value={formData.note_category}
                onChange={handleInputChange}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {noteCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="note_text" className="block text-sm font-medium text-slate-700 mb-1">
                Note
              </label>
              <textarea
                id="note_text"
                name="note_text"
                rows={3}
                required
                value={formData.note_text}
                onChange={handleInputChange}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your note here..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Saving...' : editingNote ? 'Update Note' : 'Add Note'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div key={note.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Badge variant={getCategoryColor(note.note_category) as any} className="mr-2">
                      {noteCategories.find(cat => cat.value === note.note_category)?.label || note.note_category}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && (
                        <span className="ml-1">(edited)</span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{note.note_text}</p>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(note)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">
              {searchQuery || selectedCategory ? 'No notes match your search' : 'No notes yet'}
            </p>
            <p className="text-sm text-slate-400">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first note to track important information about this asset'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}