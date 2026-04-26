import { ArrowLeft, Plus, Heart, Share2, Download, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { professionalPhotos, guestPhotos } from './mockGallery';
import { markGalleryViewed } from './chatStore';
import { useEventPeriod } from './eventPeriodContext';

export function GalleryScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState<'photographer' | 'guests'>('guests');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; author?: string; likes: number } | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const { period: eventPeriod } = useEventPeriod();
  const [showTooltip, setShowTooltip] = useState(false);

  // Mark gallery as viewed so the "+N new" badge on Home disappears.
  useEffect(() => {
    markGalleryViewed();
  }, []);

  const actualGuestPhotos = eventPeriod === 'before' ? [] : guestPhotos;
  const actualProfessionalPhotos = eventPeriod === 'before' ? [] : professionalPhotos;
  const photos = activeTab === 'photographer' ? actualProfessionalPhotos : actualGuestPhotos;

  const toggleLike = (photoUrl: string) => {
    const newLiked = new Set(likedPhotos);
    if (newLiked.has(photoUrl)) {
      newLiked.delete(photoUrl);
    } else {
      newLiked.add(photoUrl);
    }
    setLikedPhotos(newLiked);
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
            onClick={() => setActiveTab('guests')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'guests' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            By Guests ({actualGuestPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('photographer')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'photographer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Photographer ({actualProfessionalPhotos.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => (
            <div
              key={i}
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
            >
              <img
                src={photo.url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
                  {activeTab === 'guests' && 'author' in photo && (
                    <span className="text-white text-xs font-medium">{photo.author}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(photo.url);
                    }}
                    className="ml-auto flex items-center gap-1 text-white"
                  >
                    <Heart
                      className={`w-4 h-4 ${likedPhotos.has(photo.url) ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    <span className="text-xs">{photo.likes + (likedPhotos.has(photo.url) ? 1 : 0)}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeTab === 'guests' && (
        <div className="fixed bottom-20 right-4 z-10">
          {eventPeriod === 'before' && showTooltip && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
              Photo upload opens once the event starts
              <div className="absolute top-full right-4 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
          <button
            disabled={eventPeriod === 'before'}
            onMouseEnter={() => eventPeriod === 'before' && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
              eventPeriod === 'before'
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSelectedPhoto(null)} className="text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="flex gap-3">
              <button className="text-white">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="text-white">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <img
              src={selectedPhoto.url}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="p-4 bg-black/50">
            <div className="flex items-center justify-between text-white">
              {selectedPhoto.author && (
                <span className="text-sm font-medium">By {selectedPhoto.author}</span>
              )}
              <button
                onClick={() => toggleLike(selectedPhoto.url)}
                className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full"
              >
                <Heart
                  className={`w-5 h-5 ${likedPhotos.has(selectedPhoto.url) ? 'fill-red-500 text-red-500' : ''}`}
                />
                <span>{selectedPhoto.likes + (likedPhotos.has(selectedPhoto.url) ? 1 : 0)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}