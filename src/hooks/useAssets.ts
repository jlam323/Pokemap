import { useState, useEffect, useRef } from 'react';
import { PLAYER_SPRITE_CONFIG } from '../data/player';
import { NPC_SPRITE_CONFIGS } from '../data/npcs';

export function useAssets() {
  const [isLoaded, setIsLoaded] = useState(false);
  const playerImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const npcImagesRef = useRef<Record<string, Record<string, HTMLImageElement>>>({});
  const mapImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let imagesToLoad = 0;
    let imagesLoaded = 0;

    const checkAllLoaded = () => {
      imagesLoaded++;
      if (imagesLoaded === imagesToLoad) {
        setIsLoaded(true);
      }
    };

    const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '.';

    // Map
    imagesToLoad++;
    const mapImg = new Image();
    mapImg.src = `${base}/cerulean-city-map.png`;
    mapImg.onload = () => {
      mapImageRef.current = mapImg;
      checkAllLoaded();
    };
    mapImg.onerror = () => {
      console.warn('Map image failed to load');
      checkAllLoaded(); // Still continue to show fallback if possible
    };

    // Player Sprites
    PLAYER_SPRITE_CONFIG.frames.forEach(frame => {
      imagesToLoad++;
      const pImg = new Image();
      pImg.src = `${base}${PLAYER_SPRITE_CONFIG.basePath}/${frame}.png`;
      pImg.onload = () => {
        playerImagesRef.current[frame] = pImg;
        checkAllLoaded();
      };
      pImg.onerror = checkAllLoaded;
    });

    // NPC Sprites
    Object.values(NPC_SPRITE_CONFIGS).forEach(config => {
      npcImagesRef.current[config.name] = {};
      config.frames.forEach(frame => {
        imagesToLoad++;
        const nImg = new Image();
        nImg.src = `${base}${config.basePath}/${frame}.png`;
        nImg.onload = () => {
          npcImagesRef.current[config.name][frame] = nImg;
          checkAllLoaded();
        };
        nImg.onerror = checkAllLoaded;
      });
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  return {
    isLoaded,
    playerImages: playerImagesRef.current,
    npcImages: npcImagesRef.current,
    mapImage: mapImageRef.current
  };
}
