'use client';

import { useUIStore } from '@/store/ui';
import { useCartStore } from '@/store/cart';
import { Modal, Button } from '@/components/ui';
import { toast } from '@/store/ui';

export default function CrossShopModal() {
  const { isCrossShopModalOpen, pendingProduct, setCrossShopModal } = useUIStore();
  const { clearCart, addItem } = useCartStore();

  const handleClearAndAdd = async () => {
    if (!pendingProduct) return;
    clearCart();
    // Re-fetch product details from store not needed — caller re-triggers addItem after clear
    toast.info('Cart cleared. Add item again to start fresh.');
    setCrossShopModal(false);
  };

  const handleCancel = () => setCrossShopModal(false);

  return (
    <Modal
      isOpen={isCrossShopModalOpen}
      onClose={handleCancel}
      title="Start a new cart?"
    >
      <p className="text-sm text-gray-500 mb-5">
        Your cart has items from another shop. Adding this item will clear your current cart.
      </p>
      <div className="flex gap-3">
        <Button variant="ghost" size="md" onClick={handleCancel} className="flex-1">
          Keep current cart
        </Button>
        <Button variant="danger" size="md" onClick={handleClearAndAdd} className="flex-1">
          Clear & start new
        </Button>
      </div>
    </Modal>
  );
}
