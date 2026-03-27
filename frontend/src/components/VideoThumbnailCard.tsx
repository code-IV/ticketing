"use client";
import React from "react";
import { Video, ImageIcon, Trash2, X } from "lucide-react";

const getTinyPreview = (file: File): Promise<string> =>
  new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 300;
        canvas.height = (img.height / img.width) * 300;
        ctx?.drawImage(img, 0, 0, 300, canvas.height);
        res(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

interface VideoThumbnailCardProps {
  media: any; // Media item object
  index: number; // Index in the media array
  isDarkTheme: boolean;
  muted: string; // Muted text class
  onThumbnailUpload: (index: number, file: File, preview: string) => void;
  onThumbnailDelete: (index: number) => void;
  onRemoveMedia: (index: number) => void;
  className?: string; // Additional CSS classes
}

const VideoThumbnailCard: React.FC<VideoThumbnailCardProps> = ({
  media,
  index,
  isDarkTheme,
  muted,
  onThumbnailUpload,
  onThumbnailDelete,
  onRemoveMedia,
  className = "",
}) => {
  const handleThumbnailClick = () => {
    if (media.thumbnail) {
      // Delete existing thumbnail
      onThumbnailDelete(index);
    } else {
      // Upload new thumbnail
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          const file = target.files[0];
          const preview = await getTinyPreview(file);
          onThumbnailUpload(index, file, preview);
        }
      };
      input.click();
    }
  };

  return (
    <div
      className={`relative aspect-square rounded-xl overflow-hidden group shadow-sm ${className}`}
    >
      {/* Video background */}
      <div
        className={`w-full h-full flex items-center justify-center relative ${
          isDarkTheme ? "bg-[#1c1c1f]" : "bg-slate-100"
        }`}
      >
        <Video size={20} className={muted} />
        
        {/* Thumbnail upload/delete button */}
        <button
          type="button"
          className={`absolute bottom-1.5 right-1.5 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all z-10 ${
            media.thumbnail
              ? 'bg-red-500 hover:bg-red-400 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white'
          }`}
          onClick={handleThumbnailClick}
        >
          {media.thumbnail ? (
            <Trash2 size={14} className="text-white" />
          ) : (
            <ImageIcon size={14} className="text-white" />
          )}
        </button>

        {/* Thumbnail preview */}
        {media.thumbnailPreview && (
          <div className="absolute top-1.5 left-1.5 w-10 h-10 rounded-md ring-2 ring-emerald-400 overflow-hidden">
            <img
              src={media.thumbnailPreview}
              className="w-full h-full object-cover"
              alt="Thumbnail"
            />
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />

      {/* Remove media button */}
      <button
        onClick={() => onRemoveMedia(index)}
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-400 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
      >
        <X size={11} />
      </button>

      {/* Label badge */}
      <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-all">
        <span className="bg-black/70 backdrop-blur-sm text-white/80 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
          {media.label ?? media.type.toLowerCase()}
        </span>
      </div>
    </div>
  );
};

export default VideoThumbnailCard;
