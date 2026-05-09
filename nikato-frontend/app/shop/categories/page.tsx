'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
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
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shopData!.id)
        .order('sort_order');
      return (data ?? []) as Category[];
    },
    enabled: !!shopData?.id,
  });

  async function addCategory() {
    if (!newName.trim() || !shopData) return;
    setAdding(true);
    const { error } = await supabase.from('categories').insert({
      shop_id: shopData.id,
      name: newName.trim(),
      sort_order: categories.length + 1,
    });
    if (error) toast.error('Failed to add category');
    else {
      qc.invalidateQueries({ queryKey: ['shop-categories', shopData.id] });
      setNewName('');
      toast.success('Category added');
    }
    setAdding(false);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    const { error } = await supabase.from('categories').update({ name: editName.trim() }).eq('id', id);
    if (error) toast.error('Failed to rename category');
    else {
      qc.invalidateQueries({ queryKey: ['shop-categories', shopData?.id] });
      setEditingId(null);
    }
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) toast.error('Delete failed — category may have products');
    else {
      qc.invalidateQueries({ queryKey: ['shop-categories', shopData?.id] });
      toast.success('Category deleted');
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Categories</h1>

      {/* Add new */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          className="flex-1"
        />
        <Button isLoading={adding} onClick={addCategory} leftIcon={<Plus size={16} />}>
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" description="Add categories to organise your products" />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3">
              {editingId === cat.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)}
                    className="flex-1 text-sm font-medium text-gray-900 outline-none border-b-2 border-[#FF6B35] bg-transparent"
                  />
                  <button onClick={() => saveEdit(cat.id)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm font-semibold text-gray-900">{cat.name}</p>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
