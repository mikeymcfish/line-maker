import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Check, Circle } from "lucide-react";
import type { Image } from "@shared/schema";

interface ImageSidebarProps {
  images: Image[];
  selectedImageIndex: number;
  onImagesUploaded: (images: Image[]) => void;
  onSelectImage: (index: number) => void;
}

export default function ImageSidebar({
  images,
  selectedImageIndex,
  onImagesUploaded,
  onSelectImage,
}: ImageSidebarProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      console.log('Uploading files:', files.length);
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        console.log(`File ${index}:`, file.name, file.type, file.size);
        formData.append('images', file);
      });
      
      const response = await apiRequest('POST', '/api/images/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      onImagesUploaded(data.images);
      toast({
        title: "Images uploaded successfully",
        description: `${data.images.length} images loaded`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      toast({
        title: "No valid images",
        description: "Please select image files only",
        variant: "destructive",
      });
      return;
    }
    
    const fileList = new DataTransfer();
    imageFiles.forEach(file => fileList.items.add(file));
    uploadMutation.mutate(fileList.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900 mb-4">Image Annotation Tool</h1>
        
        {/* Folder Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Load Image Folder
          </label>
          <div className="space-y-2">
            {/* Folder Selection */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                webkitdirectory=""
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ WebkitAppearance: 'none' }}
              />
              <div
                className={`flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <FolderOpen className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">
                    {uploadMutation.isPending ? 'Uploading...' : 'Click to select folder'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Individual Files Selection */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center w-full h-16 border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Or select individual images</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Images ({images.length})
          </h3>
          
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={image.id}
                onClick={() => onSelectImage(index)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  index === selectedImageIndex
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <img
                  src={`/api/images/${image.filename}`}
                  alt={image.filename}
                  className="w-12 h-12 object-cover rounded-lg mr-3"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {index === selectedImageIndex && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                  {index === selectedImageIndex ? (
                    <Check className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
            
            {images.length === 0 && !uploadMutation.isPending && (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No images loaded</p>
                <p className="text-xs">Upload images to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Export Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          <span>Auto-save to 'net' folder</span>
        </div>
      </div>
    </div>
  );
}
