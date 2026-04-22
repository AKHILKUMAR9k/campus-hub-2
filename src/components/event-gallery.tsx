'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
}

interface EventGalleryProps {
  images: GalleryImage[];
}

export function EventGallery({ images }: EventGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-xl font-bold">Event Gallery</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img) => (
          <Dialog key={img.id}>
            <DialogTrigger asChild>
              <div className="cursor-pointer overflow-hidden rounded-md hover:opacity-90 transition-opacity">
                <AspectRatio ratio={4 / 3}>
                  <Image
                    src={img.image_url}
                    alt={img.caption || "Event photo"}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                </AspectRatio>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
              <div className="relative h-[80vh] w-full">
                <Image
                  src={img.image_url}
                  alt={img.caption || "Event photo in detail"}
                  fill
                  className="object-contain"
                />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 text-center">
                    {img.caption}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
