import React, { useState } from 'react';
import { MediaItem } from '@/types';

interface GalleryManagerProps {
  gallery: MediaItem[];
  onChange: (gallery: MediaItem[]) => void;
  isDarkTheme?: boolean;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ 
  gallery = [], 
  onChange, 
  isDarkTheme = false 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Count images by label
  const posterCount = gallery.filter(item => item.label === 'poster').length;
  const bannerCount = gallery.filter(item => item.label === 'banner').length;
  const videoCount = gallery.filter(item => item.type.startsWith('video/')).length;

  // Check if we can add more of each type
  const canAddPoster = posterCount < 3;
  const canAddBanner = bannerCount < 3;
  const canAddVideo = videoCount < 3;
  const canAddGallery = true; // Unlimited gallery images

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const files = event.target.files;
    if (!files) return;

    const newMediaItems: MediaItem[] = [];
    
    Array.from(files).forEach((file, index) => {
      const mediaItem: MediaItem = {
        id: `temp-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        label: label as 'poster' | 'banner' | 'gallery' | 'thumbnail',
        sort_order: gallery.length + index,
      };
      newMediaItems.push(mediaItem);
    });

    onChange([...gallery, ...newMediaItems]);
  };

  const handleDelete = (id: string) => {
    const itemToDelete = gallery.find(item => item.id === id);
    if (!itemToDelete) return;

    // Clean up blob URL if it's a temporary file
    if (itemToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(itemToDelete.url);
    }

    onChange(gallery.filter(item => item.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newGallery = [...gallery];
    const draggedItem = newGallery[draggedIndex];
    
    // Remove from old position
    newGallery.splice(draggedIndex, 1);
    
    // Insert at new position
    newGallery.splice(dropIndex, 0, draggedItem);
    
    // Update sort orders
    newGallery.forEach((item, index) => {
      item.sort_order = index;
    });

    onChange(newGallery);
    setDraggedIndex(null);
  };

  const updateMediaLabel = (id: string, newLabel: string) => {
    onChange(gallery.map(item => 
      item.id === id ? { ...item, label: newLabel as any } : item
    ));
  };

  return (
    <div className="space-y-6">
      {/* Upload Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Posters */}
        <div className={`p-4 rounded-xl border-2 border-dashed ${
          isDarkTheme ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Posters ({posterCount}/3)
          </h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, 'poster')}
            disabled={!canAddPoster}
            className="hidden"
            id="poster-upload"
          />
          <label
            htmlFor="poster-upload"
            className={`block w-full text-center py-2 px-4 rounded-lg cursor-pointer transition-colors ${
              canAddPoster
                ? isDarkTheme
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                : isDarkTheme
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAddPoster ? 'Add Posters' : 'Max Reached'}
          </label>
        </div>

        {/* Banners */}
        <div className={`p-4 rounded-xl border-2 border-dashed ${
          isDarkTheme ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Banners ({bannerCount}/3)
          </h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, 'banner')}
            disabled={!canAddBanner}
            className="hidden"
            id="banner-upload"
          />
          <label
            htmlFor="banner-upload"
            className={`block w-full text-center py-2 px-4 rounded-lg cursor-pointer transition-colors ${
              canAddBanner
                ? isDarkTheme
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-500 text-white hover:bg-green-600'
                : isDarkTheme
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAddBanner ? 'Add Banners' : 'Max Reached'}
          </label>
        </div>

        {/* Videos */}
        <div className={`p-4 rounded-xl border-2 border-dashed ${
          isDarkTheme ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Videos ({videoCount}/3)
          </h3>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => handleFileUpload(e, 'gallery')}
            disabled={!canAddVideo}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className={`block w-full text-center py-2 px-4 rounded-lg cursor-pointer transition-colors ${
              canAddVideo
                ? isDarkTheme
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
                : isDarkTheme
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAddVideo ? 'Add Videos' : 'Max Reached'}
          </label>
        </div>

        {/* Gallery Images */}
        <div className={`p-4 rounded-xl border-2 border-dashed ${
          isDarkTheme ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Gallery Images
          </h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, 'gallery')}
            className="hidden"
            id="gallery-upload"
          />
          <label
            htmlFor="gallery-upload"
            className={`block w-full text-center py-2 px-4 rounded-lg cursor-pointer transition-colors ${
              isDarkTheme
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
          >
            Add Gallery
          </label>
        </div>
      </div>

      {/* Media Grid */}
      {gallery.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative group cursor-move rounded-lg overflow-hidden border-2 ${
                isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {/* Media Preview */}
              {item.type.startsWith('video/') ? (
                <video
                  src={item.url}
                  className="w-full h-32 object-cover"
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                  muted
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                  onClick={() => setSelectedImage(item.url)}
                />
              )}

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 text-white p-2 rounded-full mx-1 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Media Info */}
              <div className="p-2">
                <p className={`text-xs font-medium truncate ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {item.name}
                </p>
                <select
                  value={item.label}
                  onChange={(e) => updateMediaLabel(item.id, e.target.value)}
                  className={`text-xs mt-1 w-full p-1 rounded ${
                    isDarkTheme ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <option value="poster">Poster</option>
                  <option value="banner">Banner</option>
                  <option value="gallery">Gallery</option>
                  <option value="thumbnail">Thumbnail</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
