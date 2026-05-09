"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchListings = async (searchQuery = "") => {
    setLoading(true);
    try {
      const institution = "example.edu"; // Placeholder for auth context
      let url = `http://localhost:8000/api/listings?institution_domain=${institution}`;
      
      if (searchQuery) {
        url = `http://localhost:8000/api/search?q=${encodeURIComponent(searchQuery)}&institution=${institution}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query !== "") {
          fetchListings(query);
      } else {
          // fetchListings() handles the empty string effectively
          fetchListings();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campus Listings</h1>
        <Link href="/listings/new" className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
          + New Listing
        </Link>
      </div>

      <div className="mb-8">
        <input 
          type="text" 
          placeholder="Search for textbooks, electronics, furniture..." 
          className="w-full border-2 border-gray-300 rounded-lg p-4 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No listings found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map(listing => (
            <Link href={`/listings/${listing.id}`} key={listing.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="h-48 bg-gray-200">
                {listing.image_urls?.[0] && (
                  <img src={listing.image_urls[0]} alt={listing.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg line-clamp-1">{listing.title}</h3>
                  <span className="font-bold text-blue-600">${listing.price}</span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{listing.condition} • {listing.category || "General"}</div>
                {listing.similarity && (
                  <div className="text-xs text-green-600 font-semibold mt-2">
                    {Math.round(listing.similarity * 100)}% Match
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
