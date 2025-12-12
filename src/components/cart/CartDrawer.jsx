import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { ShoppingBag, Plus, Minus, Trash2, X, ArrowRight, Check } from 'lucide-react';
import { useCart } from './CartContext';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const queryClient = useQueryClient();
  const [step, setStep] = useState('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: '',
    payment_method: 'pay_in_person'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      try {
        return await base44.entities.Address.list('-is_default');
      } catch {
        return [];
      }
    },
    enabled: !!user
  });

  // Pre-fill form when user data loads
  React.useEffect(() => {
    if (user && step === 'details') {
      setFormData(prev => ({
        ...prev,
        customer_name: user.full_name || '',
        customer_email: user.email || '',
        customer_phone: user.phone || ''
      }));
      
      // Auto-select default address if exists
      const defaultAddr = savedAddresses.find(a => a.is_default);
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id);
        setFormData(prev => ({
          ...prev,
          delivery_address: defaultAddr.full_address
        }));
      }
    }
  }, [user, step, savedAddresses]);

  const handleCheckout = async () => {
    if (step === 'cart') {
      setStep('details');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = await base44.auth.me();
      
      // Save new address if creating one
      if (isNewAddress && formData.delivery_address) {
        try {
          await base44.entities.Address.create({
            user_email: currentUser.email,
            label: formData.address_label || 'Home',
            full_address: formData.delivery_address,
            is_default: savedAddresses.length === 0,
            delivery_instructions: formData.notes || ''
          });
          queryClient.invalidateQueries({ queryKey: ['addresses'] });
        } catch (addrError) {
          console.error('Address save error:', addrError);
        }
      }
      
      const order = await base44.entities.Order.create({
        items: cartItems.map(item => ({
          product_id: item.id,
          name: item.name,
          variant: item.selectedVariant?.name || null,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url
        })),
        subtotal: cartTotal,
        total: cartTotal,
        customer_name: currentUser.full_name,
        customer_email: currentUser.email,
        customer_phone: currentUser.phone || formData.customer_phone,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        status: 'pending'
      });

      // Award loyalty points (1 point per dollar)
      try {
        const pointsEarned = Math.floor(cartTotal);
        const currentPoints = currentUser.loyalty_points || 0;
        const totalEarned = (currentUser.total_points_earned || 0) + pointsEarned;
        const newBalance = currentPoints + pointsEarned;

        // Determine tier based on total earned
        let newTier = 'bronze';
        if (totalEarned >= 5000) newTier = 'platinum';
        else if (totalEarned >= 1500) newTier = 'gold';
        else if (totalEarned >= 500) newTier = 'silver';

        await base44.auth.updateMe({
          loyalty_points: newBalance,
          total_points_earned: totalEarned,
          loyalty_tier: newTier
        });

        // Create points transaction record
        await base44.entities.PointsTransaction.create({
          user_email: currentUser.email,
          points: pointsEarned,
          transaction_type: 'earned',
          description: `Purchase - Order #${order.id.slice(0, 8)}`,
          order_id: order.id,
          balance_after: newBalance
        });

        // Process referral bonus if this is first purchase
        if (!currentUser.referral_bonus_claimed && currentUser.referred_by) {
          try {
            await base44.functions.invoke('processReferral', {});
          } catch (refError) {
            console.error('Referral error:', refError);
          }
        }
      } catch (pointsError) {
        console.error('Points error:', pointsError);
      }

      // Send order confirmation email
      try {
        await base44.functions.invoke('sendOrderEmail', {
          orderId: order.id,
          status: 'pending',
          customerEmail: currentUser.email,
          customerName: currentUser.full_name
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      // Notify admins of new order
      try {
        await base44.functions.invoke('notifyAdminsNewOrder', {
          order_id: order.id,
          order_number: order.id.slice(0, 8).toUpperCase(),
          customer_name: currentUser.full_name,
          customer_email: currentUser.email,
          customer_phone: currentUser.phone || formData.customer_phone,
          delivery_address: formData.delivery_address,
          total: cartTotal,
          items_count: cartItems.length,
          items: cartItems.map(item => ({
            name: item.name,
            variant: item.selectedVariant?.name || null,
            price: item.price,
            quantity: item.quantity
          }))
        });
      } catch (notifyError) {
        console.error('Admin notification error:', notifyError);
      }

      setOrderComplete(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setTimeout(() => {
        setIsCartOpen(false);
        setOrderComplete(false);
        setStep('cart');
        setSelectedAddressId(null);
        setIsNewAddress(false);
        setFormData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          delivery_address: '',
          notes: '',
          payment_method: 'pay_in_person'
        });
      }, 3000);
    } catch (error) {
      console.error(error);
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setIsCartOpen(false);
    if (!orderComplete) {
      setTimeout(() => setStep('cart'), 300);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg bg-white/80 backdrop-blur-xl border-l border-white/20">
        <SheetHeader className="border-b border-emerald-100/50 pb-4">
          <SheetTitle className="flex items-center gap-3 text-emerald-900">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {step === 'cart' ? 'Your Bag' : 'Delivery Details'}
          </SheetTitle>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {orderComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-900">Order Placed!</h3>
              <p className="text-emerald-600 text-center">Your order is being prepared for delivery.</p>
            </motion.div>
          ) : step === 'cart' ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-[calc(100vh-140px)]"
            >
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-emerald-600">
                  <ShoppingBag className="w-16 h-16 opacity-30" />
                  <p>Your bag is empty</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[calc(100vh-320px)]">
                    {cartItems.map(item => (
                      <div key={item.cartItemKey} className="flex gap-3 p-3 rounded-2xl bg-white/60 backdrop-blur border border-white/40">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=100'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-emerald-900 text-sm">{item.name}</h4>
                          {item.selectedVariant && (
                            <p className="text-xs text-emerald-600">{item.selectedVariant.name}</p>
                          )}
                          <p className="text-emerald-600 font-bold">${item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.cartItemKey, item.quantity - 1)}
                              className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-emerald-700" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.cartItemKey, item.quantity + 1)}
                              className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-emerald-700" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartItemKey)}
                          className="p-2 h-fit rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-emerald-100/50 pt-4 space-y-4">
                    <div className="flex justify-between text-lg font-bold text-emerald-900">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button
                      onClick={handleCheckout}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30"
                    >
                      Continue to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-[calc(100vh-140px)]"
            >
              <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[calc(100vh-320px)]">
                <div className="space-y-2">
                  <Label className="text-emerald-800">Full Name *</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                    className="h-12 rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                    placeholder="John Doe"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-800">Email *</Label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    className="h-12 rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                    placeholder="john@example.com"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-800">Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(p => ({ ...p, customer_phone: e.target.value }))}
                    className="h-12 rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-emerald-800">Delivery Address *</Label>

                  {savedAddresses.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <div className="flex flex-wrap gap-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setIsNewAddress(false);
                              setFormData(p => ({
                                ...p,
                                delivery_address: addr.full_address,
                                notes: addr.delivery_instructions || ''
                              }));
                            }}
                            className={`flex-1 min-w-[120px] p-3 rounded-xl border-2 text-left transition-all ${
                              selectedAddressId === addr.id
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-200 bg-white/60 hover:border-emerald-300'
                            }`}
                          >
                            <div className="font-semibold text-sm text-emerald-900">{addr.label}</div>
                            <div className="text-xs text-emerald-600 line-clamp-2">{addr.full_address}</div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(null);
                            setIsNewAddress(true);
                            setFormData(p => ({ ...p, delivery_address: '', notes: '' }));
                          }}
                          className={`flex-1 min-w-[120px] p-3 rounded-xl border-2 text-center transition-all ${
                            isNewAddress
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 bg-white/60 hover:border-emerald-300'
                          }`}
                        >
                          <div className="font-semibold text-sm text-emerald-900">+ New Address</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {(isNewAddress || savedAddresses.length === 0) && (
                    <>
                      {savedAddresses.length === 0 && (
                        <div className="text-xs text-emerald-600 mb-2">No saved addresses. Enter a new one:</div>
                      )}
                      {isNewAddress && (
                        <div className="mb-2">
                          <Input
                            value={formData.address_label || ''}
                            onChange={(e) => setFormData(p => ({ ...p, address_label: e.target.value }))}
                            className="h-10 rounded-xl bg-white/60 border-emerald-200"
                            placeholder="Label (e.g., Home, Work)"
                          />
                        </div>
                      )}
                      <AddressAutocomplete
                        value={formData.delivery_address}
                        onChange={(val) => setFormData(p => ({ ...p, delivery_address: val }))}
                        className="h-12 rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                        placeholder="123 Main St, Apt 4B, City, State 12345"
                      />
                    </>
                  )}

                  {selectedAddressId && !isNewAddress && (
                    <Input
                      value={formData.delivery_address}
                      readOnly
                      className="h-12 rounded-xl bg-white/60 border-emerald-200"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-800">Delivery Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                    placeholder="Gate code, special instructions..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-800">Payment Method *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormData(p => ({ ...p, payment_method: 'pay_in_person' }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.payment_method === 'pay_in_person'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white/60'
                      }`}
                    >
                      <div className="font-semibold text-sm text-emerald-900">Pay in Person</div>
                      <div className="text-xs text-emerald-600 mt-1">Cash or card on delivery</div>
                    </button>
                    <button
                      onClick={() => setFormData(p => ({ ...p, payment_method: 'online' }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.payment_method === 'online'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white/60'
                      }`}
                    >
                      <div className="font-semibold text-sm text-emerald-900">Pay Online</div>
                      <div className="text-xs text-emerald-600 mt-1">Coming soon</div>
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-emerald-100/50 pt-4 space-y-3">
                <div className="flex justify-between text-lg font-bold text-emerald-900">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('cart')}
                    className="flex-1 h-14 rounded-2xl border-emerald-200"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={isSubmitting || !formData.delivery_address}
                    className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/30"
                  >
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}