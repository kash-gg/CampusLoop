'use client'

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"

function ListingFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    condition: "Good",
    price: "",
    category: "Electronics",
  })
  
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Auth details
  const [userId, setUserId] = useState<string | null>(null)
  const [userDomain, setUserDomain] = useState<string | null>(null)
  
  // Surge price advice details
  const [surgeActive, setSurgeActive] = useState(false)
  const [medianPrice, setMedianPrice] = useState<number | null>(null)

  // Load prefills and auth
  useEffect(() => {
    async function loadAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const domain = user.email?.split('@')[1] || ""
        setUserDomain(domain)
        checkSurge(domain)
      }
    }
    
    loadAuth()

    // Prefills
    const prefillTitle = searchParams.get("prefill_title")
    const prefillDesc = searchParams.get("prefill_desc")
    
    if (prefillTitle || prefillDesc) {
      setFormData(prev => ({
        ...prev,
        title: prefillTitle || "",
        description: prefillDesc || ""
      }))
    }
  }, [searchParams])

  const checkSurge = async (domain: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/surge/${domain}`)
      if (res.ok) {
        const data = await res.json()
        if (data.is_surge) {
          setSurgeActive(true)
          // Find stats for this category
          const stats = data.similar_items_today?.find((s: any) => s.category?.toLowerCase() === formData.category.toLowerCase())
          if (stats && stats.median_price) {
            setMedianPrice(stats.median_price)
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  // Check pricing guide when category changes
  useEffect(() => {
    if (userDomain && surgeActive) {
      checkSurge(userDomain)
    }
  }, [formData.category])

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setErrorMsg(null)
    
    // In a real app we upload to Cloudinary. For local dev/prototype, we use a placeholder image
    // or simulate. Let's create an object URL or set placeholder.
    try {
      // Simulating a fast Cloudinary upload with dummy image if size exceeds limit,
      // but otherwise local URL works for preview.
      setImageUrl(URL.createObjectURL(file))
    } catch (err: any) {
      setErrorMsg("Failed to upload image.")
    } finally {
      setLoading(false)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !userDomain) {
      setErrorMsg("You must be logged in to create listings.")
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        price: parseFloat(formData.price),
        category: formData.category,
        image_urls: imageUrl ? [imageUrl] : [],
        seller_id: userId,
        institution_domain: userDomain
      }

      const res = await fetch("http://localhost:8000/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Failed to post listing.")
      }

      const createdListing = await res.json()

      // If this listing was created to satisfy an open want, create transaction immediately
      const wantBuyerId = searchParams.get("want_buyer_id")
      if (wantBuyerId) {
        const txPayload = {
          listing_id: createdListing.id,
          buyer_id: wantBuyerId,
          seller_id: userId
        }
        
        const txRes = await fetch("http://localhost:8000/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(txPayload)
        })
        
        if (txRes.ok) {
          router.push("/transactions") // Redirect to transactions if want matching triggered
          return
        }
      }

      router.push(`/listings/${createdListing.id}`)
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: '650px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>Create a Listing</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
        Sell your items securely to students on your campus.
      </p>

      {errorMsg && (
        <div style={{ color: 'var(--danger)', padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
          {errorMsg}
        </div>
      )}

      {/* Surge Alert Banner */}
      {surgeActive && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: 'var(--warning)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)',
          fontSize: '0.9rem'
        }}>
          📈 <strong>Semester End Surge detected!</strong> Prices might be competitive. 
          {medianPrice && ` Typical median price for ${formData.category} today is $${medianPrice.toFixed(2)}. We recommend pricing competitively.`}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>Title</label>
          <input 
            required 
            type="text" 
            className="input"
            placeholder="e.g. TI-84 Plus Graphing Calculator"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>Description</label>
          <textarea 
            className="input"
            rows={4}
            placeholder="Describe condition, features, or notes about the item..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>Price ($)</label>
            <input 
              required 
              type="number" 
              min="0" 
              step="0.01"
              className="input"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>Condition</label>
            <select 
              className="input"
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
            >
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="For Parts">For Parts</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>Category</label>
            <select 
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Electronics">Electronics</option>
              <option value="Textbooks">Textbooks</option>
              <option value="Furniture">Furniture</option>
              <option value="Clothing">Clothing</option>
              <option value="Kitchenware">Kitchenware</option>
              <option value="Bicycles/Transit">Bicycles/Transit</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>Item Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={uploadImage}
            style={{ marginBottom: 'var(--space-3)', display: 'block' }}
          />
          {loading && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Processing image...</div>}
          {imageUrl && (
            <div style={{ width: '128px', height: '128px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--bg-tertiary)' }}>
              <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={submitting || loading}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 'var(--space-2)', padding: 'var(--space-3)' }}
        >
          {submitting ? "Posting Listing..." : "Post Listing"}
        </button>
      </form>
    </div>
  )
}

export default function NewListingPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Loading form...</div>
        </div>
      }>
        <ListingFormContent />
      </Suspense>
    </>
  )
}
