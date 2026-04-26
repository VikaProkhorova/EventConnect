import { ArrowLeft, Heart, Share2, Download, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useState } from 'react';
import { useAsync } from '@/api/provider';
import type { EventId, Photo } from '@/domain/types';

export function GalleryScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;

  const [activeTab, setActiveTab] = useState<'photographer' | 'guest'>('photographer');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());

  const photos = useAsync(
    (api) => api.gallery.list(eventId, activeTab),
    [eventId, activeTab],
  );

  const toggleLike = (photoId: string) => {
    setLikedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-bold text-xl">Gallery</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('photographer')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'photographer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Photographer
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'guest' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            By Guests
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {photos.loading && (
          <div className="text-center text-gray-400 text-sm py-12">Loading…</div>
        )}
        {!photos.loading && (photos.data?.length ?? 0) === 0 && (
          <div className="text-center text-gray-400 text-sm py-12">No photos yet.</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {photos.data?.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-xl overflow-hidden group"
            >
              <img
                src={photo.url}
                alt={photo.caption ?? `Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
                  {photo.uploadedById && (
                    <span className="text-white text-xs font-medium truncate">{photo.caption ?? ''}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(photo.id);
                    }}
                    className="ml-auto flex items-center gap-1 text-white"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedPhotos.has(photo.id) ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt="" className="w-full h-auto rounded-xl" />
            {selectedPhoto.caption && (
              <p className="text-white text-sm mt-3 text-center">{selectedPhoto.caption}</p>
            )}
            <div className="flex gap-3 mt-4 justify-center">
              <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm">
                <Download className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
