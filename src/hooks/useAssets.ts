import { useState, useEffect, useRef } from 'react';
import { PLAYER_SPRITE_CONFIG } from '../data/player';
import { NPC_SPRITE_CONFIGS } from '../data/npcs';
import { ITEM_SPRITE_CONFIGS } from '../data/items';
import mapsData from '../data/maps.json';
import { MapConfig } from '../types';

const MAPS = mapsData as MapConfig[];

export function useAssets() {
  const [isLoaded, setIsLoaded] = useState(false);
  const playerImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const npcImagesRef = useRef<Record<string, Record<string, HTMLImageElement>>>({});
  const itemImagesRef = useRef<Record<string, Record<string, HTMLImageElement>>>({});
  const mapsImagesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    let imagesToLoad = 0;
    let imagesLoaded = 0;

    const checkAllLoaded = () => {
      imagesLoaded++;
      if (imagesLoaded >= imagesToLoad) {
        setIsLoaded(true);
      }
    };

    const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '.';

    // Maps
    MAPS.forEach(map => {
      imagesToLoad++;
      const mapImg = new Image();
      mapImg.src = `${base}/${map.mapImage}`;
      mapImg.onload = () => {
        mapsImagesRef.current[map.id] = mapImg;
        checkAllLoaded();
      };
      mapImg.onerror = () => {
        console.warn(`Map image failed to load for ${map.id}`);
        checkAllLoaded();
      };
    });

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

    // Item Sprites
    Object.entries(ITEM_SPRITE_CONFIGS).forEach(([spriteName, config]) => {
      itemImagesRef.current[spriteName] = {};
      config.frames.forEach(frame => {
        imagesToLoad++;
        const iImg = new Image();
        iImg.src = `${base}${config.basePath}/${frame}.png`;
        iImg.onload = () => {
          itemImagesRef.current[spriteName][frame] = iImg;
          checkAllLoaded();
        };
        iImg.onerror = checkAllLoaded;
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
    itemImages: itemImagesRef.current,
    mapImages: mapsImagesRef.current
  };
}
