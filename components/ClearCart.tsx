'use client'

import { useEffect } from 'react'
import { useCart } from './CartProvider'

export default function ClearCart() {
  const { clearCart } = useCart()
  useEffect(() => { clearCart() }, [])
  return null
}
