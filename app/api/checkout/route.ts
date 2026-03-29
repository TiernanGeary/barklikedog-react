import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  })
}

const SHIPPING_US = 'shr_1TGBaRGimJhzx282226Uap6y'
const SHIPPING_INTL = 'shr_1TGBasGimJhzx282flq9Yryb'

export async function POST(req: NextRequest) {
  try {
    const { items, region } = await req.json()

    if (!items?.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000'
    const stripe = getStripe()

    const line_items = items.map((item: { priceId: string; quantity: number }) => ({
      price: item.priceId,
      quantity: item.quantity,
    }))

    const shippingRate = region === 'us' ? SHIPPING_US : SHIPPING_INTL

    const allowedCountries: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
      region === 'us'
        ? ['US']
        : [
            'CA', 'MX', 'GB', 'IE', 'DE', 'FR', 'IT', 'ES', 'NL',
            'BE', 'AT', 'CH', 'SE', 'DK', 'NO', 'FI', 'PT', 'PL', 'CZ',
            'AU', 'NZ', 'JP', 'KR', 'SG', 'HK', 'TW', 'BR', 'AR', 'CL',
            'CO', 'IL', 'AE', 'SA', 'TH', 'MY', 'PH', 'IN', 'ZA',
          ]

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: { allowed_countries: allowedCountries },
      shipping_options: [{ shipping_rate: shippingRate }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
