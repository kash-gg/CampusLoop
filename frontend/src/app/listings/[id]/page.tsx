"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/listings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setListing(data);
        } else {
          console.error("Failed to fetch listing");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!listing) return <div className="text-center py-12">Listing not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={() => router.back()} className="text-blue-600 mb-6 hover:underline">
        &larr; Back to search
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {listing.image_urls && listing.image_urls.length > 0 ? (
            <img 
              src={listing.image_urls[0]} 
              alt={listing.title} 
              className="w-full h-96 object-cover rounded-lg shadow-md"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
              No image provided
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
          <div className="text-2xl font-bold text-blue-600 mb-4">${listing.price}</div>
          
          <div className="mb-6 space-y-2">
            <p><span className="font-semibold">Condition:</span> {listing.condition}</p>
            <p><span className="font-semibold">Category:</span> {listing.category || 'N/A'}</p>
            <p><span className="font-semibold">Posted:</span> {new Date(listing.created_at).toLocaleDateString()}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
            <h3 className="font-semibold mb-2">Seller Information</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                U
              </div>
              <div>
                <p className="font-medium text-sm text-gray-600">User ID: {listing.seller_id.substring(0,8)}...</p>
                {/* Trust Badge Placeholder - to be implemented in phase 3 */}
                <div className="text-xs bg-gray-200 px-2 py-1 rounded inline-block mt-1">Trust: New</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {listing.description || 'No description provided.'}
            </p>
          </div>

          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition">
            I&apos;m Interested
          </button>
        </div>
      </div>
    </div>
  );
}
