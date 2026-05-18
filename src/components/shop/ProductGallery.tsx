'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

type Props = {
  images: string[];
  name: string;
  isOutOfStock: boolean;
};

export default function ProductGallery({ images, name, isOutOfStock }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({ loop: false });
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  const scrollPrev = useCallback(() => {
    if (emblaMainApi) emblaMainApi.scrollPrev();
  }, [emblaMainApi]);

  const scrollNext = useCallback(() => {
    if (emblaMainApi) emblaMainApi.scrollNext();
  }, [emblaMainApi]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on('select', onSelect);
    emblaMainApi.on('reInit', onSelect);
    return () => {
      emblaMainApi.off('select', onSelect);
      emblaMainApi.off('reInit', onSelect);
    };
  }, [emblaMainApi, onSelect]);

  const hasMany = images.length > 1;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Image Slider */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 aspect-square group">
        <div className="overflow-hidden w-full h-full" ref={emblaMainRef}>
          <div className="flex h-full touch-pan-y">
            {images.length > 0 ? (
              images.map((img, index) => (
                <div className="relative flex-[0_0_100%] min-w-0 h-full" key={index}>
                  <Image
                    src={img}
                    alt={`${name} — vue ${index + 1}`}
                    fill
                    priority={index === 0}
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Out of stock overlay */}
        <AnimatePresence>
          {isOutOfStock && (
            <motion.div 
              key="out-of-stock-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm"
            >
              <motion.span 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="font-semibold uppercase tracking-widest text-[13px] text-black px-6 py-3 border-2 border-black rounded-md"
              >
                Rupture de stock
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        {hasMany && (
          <>
            <button
              onClick={scrollPrev}
              aria-label="Image précédente"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-md hover:scale-110"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Image suivante"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-md hover:scale-110"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Slider */}
      {hasMany && (
        <div className="overflow-hidden" ref={emblaThumbsRef}>
          <div className="flex gap-3 py-1">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => onThumbClick(index)}
                aria-label={`Voir image ${index + 1}`}
                className={`relative flex-[0_0_80px] h-[80px] min-w-0 rounded-xl overflow-hidden bg-gray-50 transition-all duration-300 ${
                  selectedIndex === index ? 'ring-2 ring-black ring-offset-2' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`${name} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
