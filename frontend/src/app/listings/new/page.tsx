"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewListingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    condition: "Good",
    price: "",
    category: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      setImageUrl(URL.createObjectURL(file));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const seller_id = "00000000-0000-0000-0000-000000000000"; // Placeholder UUID
      const institution_domain = "example.edu";
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        image_urls: imageUrl ? [imageUrl] : [],
        seller_id,
        institution_domain
      };

      const res = await fetch("http://localhost:8000/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/listings/${data.id}`);
      } else {
        console.error("Failed to create listing");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create a Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input 
            required 
            type="text" 
            className="w-full border rounded p-2"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea 
            className="w-full border rounded p-2"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Price</label>
            <input 
              required 
              type="number" 
              min="0" step="0.01"
              className="w-full border rounded p-2"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Condition</label>
            <select 
              className="w-full border rounded p-2"
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
            >
              <option>Like New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>For Parts</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Category</label>
          <input 
            type="text" 
            className="w-full border rounded p-2"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Photo</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={uploadImage}
            className="mb-2 block"
          />
          {imageUrl && <img src={imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded" />}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded disabled:opacity-50"
        >
          {loading ? "Creating..." : "Post Listing"}
        </button>
      </form>
    </div>
  );
}
