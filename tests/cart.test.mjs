import test from 'node:test'
import assert from 'node:assert/strict'
import { addCartItem, cartItemKey, removeCartItem, setCartItemQuantity } from '../lib/cart.ts'

const pink = { productId: 'belt', variantId: 'pink', variant: 'Pink', name: 'Belt — Pink', priceId: 'price_pink', price: 68 }
const stripe = { ...pink, variantId: 'stripe', variant: 'Stripe', name: 'Belt — Stripe', priceId: 'price_stripe' }

test('different colors retain their own Stripe prices and quantities', () => {
  const cart = addCartItem(addCartItem(addCartItem([], pink), stripe), pink)
  assert.deepEqual(cart.map(({ variant, priceId, quantity }) => ({ variant, priceId, quantity })), [
    { variant: 'Pink', priceId: 'price_pink', quantity: 2 },
    { variant: 'Stripe', priceId: 'price_stripe', quantity: 1 },
  ])
})

test('variants sharing a Stripe price remain independently editable cart lines', () => {
  const second = { ...stripe, priceId: pink.priceId }
  let cart = addCartItem(addCartItem([], pink), second)
  assert.equal(cart.length, 2)
  cart = setCartItemQuantity(cart, cartItemKey(second), 3)
  assert.deepEqual(cart.map(item => item.quantity), [1, 3])
  assert.deepEqual(removeCartItem(cart, cartItemKey(pink)), [{ ...second, quantity: 3 }])
  assert.deepEqual(setCartItemQuantity(cart, cartItemKey(second), 0), [{ ...pink, quantity: 1 }])
})

test('re-adding a variant updates its saved price without adding another line', () => {
  const updated = { ...pink, priceId: 'price_new', price: 70 }
  assert.deepEqual(addCartItem([{ ...pink, quantity: 2 }], updated), [{ ...updated, quantity: 3 }])
})

test('legacy saved carts are upgraded without merging another color', () => {
  const { productId, variantId, ...legacy } = pink
  const cart = addCartItem([{ ...legacy, quantity: 2 }], { ...stripe, priceId: pink.priceId })
  assert.equal(cart.length, 2)
  const upgraded = addCartItem(cart, pink)
  assert.deepEqual(upgraded[0], { ...pink, quantity: 3 })
  assert.equal(upgraded[1].variant, 'Stripe')
  assert.deepEqual(JSON.parse(JSON.stringify(upgraded)), upgraded)
})

test('different products with the same price and option label stay separate', () => {
  const other = { ...pink, productId: 'other-belt' }
  assert.equal(addCartItem(addCartItem([], pink), other).length, 2)
})
