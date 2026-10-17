export interface CartItem {
  productId?: string
  variantId?: string
  priceId: string
  name: string
  price: number
  image?: string
  variant?: string
  quantity: number
}

export function cartItemKey(item: Omit<CartItem, 'quantity'>): string {
  return JSON.stringify(item.productId
    ? ['product', item.productId, item.variantId ?? item.variant ?? '']
    : ['legacy', item.priceId, item.variant ?? ''])
}

export function addCartItem(items: CartItem[], item: Omit<CartItem, 'quantity'>): CartItem[] {
  const existing = items.find(entry => {
    if (entry.productId) return cartItemKey(entry) === cartItemKey(item)
    // Upgrade a saved cart line without combining different options.
    return entry.priceId === item.priceId && entry.variant === item.variant
  })
  if (!existing) return [...items, { ...item, quantity: 1 }]
  return items.map(entry => entry === existing
    ? { ...entry, ...item, quantity: entry.quantity + 1 }
    : entry)
}

export function removeCartItem(items: CartItem[], key: string): CartItem[] {
  return items.filter(item => cartItemKey(item) !== key)
}

export function setCartItemQuantity(items: CartItem[], key: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeCartItem(items, key)
  return items.map(item => cartItemKey(item) === key ? { ...item, quantity } : item)
}
