'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Button, Input, Skeleton, EmptyState } from '@/components/ui';
import type { Category } from '@/types';

export default function ShopCategoriesPage() {
  const { shopData } = useShopStore();
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['shop-categories', shopData?.id],
    queryFn: async () => {
      const res = await fetch('/api/shop/categories');
      if (!res.ok) return [];
      const d = await res.json();
      return d.categories as Category[];
    },
    enabled: !!shopData?.id,
  });

  async function addCategory() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch('/api/shop/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), sort_order: categories.length + 1, is_active: true }),
    });
    if (!res.ok) toast.error('Failed to add category');
    else { qc.invalidateQueries({ queryKey: ['shop-categories', shopData?.id] }); setNewName(''); toast.success('Category added'); }
    setAdding(false);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    const res = await fetch('/api/shop/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim() }),
    });
    if (!res.ok) toast.error('Failed to rename');
    else { qc.invalidateQueries({ queryKey: ['shop-categories', shopData?.id] }); setEditingId(null); }
  }

  async function deleteCategory(id: string) {
    const res = await fetch('/api/shop/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) toast.error('Delete failed — category may have products');
    else { qc.invalidateQueries({ queryKey: ['shop-categories', shopData?.id] }); toast.success('Deleted'); }
  }

  return (
    <div className="p-4 lg:p-6 max-w-xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Categories</h1>
      <div className="flex gap-2 mb-6">
        <Input placeholder="Category name" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()} className="flex-1" />
        <Button isLoading={adding} onClick={addCategory} leftIcon={<Plus size={16} />}>Add</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" description="Add categories to organise your products" />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3">
              {editingId === cat.id ? (
                <>
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)}
                    className="flex-1 text-sm font-medium text-gray-900 outline-none border-b-2 border-[#FF6B35] bg-transparent" />
                  <button onClick={() => saveEdit(cat.id)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm font-semibold text-gray-900">{cat.name}</p>
                  <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil size={15} /></button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
