import { getRadioQueue } from '@/lib/sanity'
import RadioPlayer from '@/components/RadioPlayer'

export const metadata = {
  title: 'Radio',
}

export const revalidate = 30

export default async function RadioPage() {
  const queue = await getRadioQueue()

  return <RadioPlayer tracks={queue?.tracks ?? []} />
}
