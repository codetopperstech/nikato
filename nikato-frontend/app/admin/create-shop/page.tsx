'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function CreateShopPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    owner_phone: '', owner_name: '', shop_name: '', shop_phone: '',
    address: '', city: '', pincode: '', latitude: '', longitude: '',
    delivery_radius: '5', min_order: '100', commission: '0.1'
  })

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/admin/create-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create shop'); return }
      setSuccess('Shop created successfully!')
      setTimeout(() => router.push('/admin/shops'), 1500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'owner_phone', label: 'OWNER PHONE (+91...)', placeholder: '+917945154515' },
    { key: 'owner_name', label: 'OWNER NAME', placeholder: 'Name' },
    { key: 'shop_name', label: 'SHOP NAME', placeholder: 'Shop name' },
    { key: 'shop_phone', label: 'SHOP PHONE', placeholder: '+917945154515' },
    { key: 'address', label: 'ADDRESS', placeholder: 'MG Road' },
    { key: 'city', label: 'CITY', placeholder: 'Mumbai' },
    { key: 'pincode', label: 'PINCODE', placeholder: '400001' },
    { key: 'latitude', label: 'LATITUDE', placeholder: '19.0760' },
    { key: 'longitude', label: 'LONGITUDE', placeholder: '72.8777' },
    { key: 'delivery_radius', label: 'DELIVERY RADIUS (KM)', placeholder: '5' },
    { key: 'min_order', label: 'MIN ORDER (₹)', placeholder: '100' },
    { key: 'commission', label: 'COMMISSION (0-1)', placeholder: '0.1' },
  ]

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Create Shop</h1>
      <p className="text-gray-500 mb-4">Creates shop owner account + shop in one step</p>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg border border-green-200">{success}</div>}
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs text-gray-500 uppercase font-medium">{f.label}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder={f.placeholder}
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creating...' : 'Create Shop & Owner Account'}
      </button>
    </div>
  )
}
