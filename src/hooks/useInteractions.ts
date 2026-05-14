import { useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { GameState, Entity, Item, Direction, NPCType, ActionTrigger } from '../types';
import { findNearbyNPC, findNearbyItem } from '../lib/gameUtils';
import { ITEM_SPRITE_CONFIGS } from '../data/items';

interface InteractionProps {
  setGameState: Dispatch<SetStateAction<GameState>>;
  stateRef: MutableRefObject<GameState>;
  playerRef: MutableRefObject<Entity>;
  npcsRef: MutableRefObject<Entity[]>;
  itemsRef: MutableRefObject<Item[]>;
  initCollisionMap: (player: Entity, npcs: Entity[], items: Item[]) => void;
}

/**
 * Hook to manage complex interactions between the player and map entities (NPCs/Items).
 * 
 * It handles:
 * - Dialogue advancement and item collection
 * - Proximity-based interaction discovery
 * - Shopkeeper/NPC "action" frame sequencing (e.g. bowing, turning)
 * - Animating item interactions (e.g. poke balls opening)
 * 
 * @param props - Core state and ref system for updating components.
 * @returns {Object} Interaction triggers and advancement functions.
 */
export function useInteractions({
  setGameState,
  stateRef,
  playerRef,
  npcsRef,
  itemsRef,
  initCollisionMap
}: InteractionProps) {

  /**
   * Triggers a temporary visual action for an NPC (e.g. bowing or Turning).
   * 
   * @param npcId - ID of the NPC to animate
   */
  const triggerNPCAction = useCallback((npcId: string) => {
    setGameState(prev => {
      const npcIndex = prev.npcs.findIndex(n => n.id === npcId);
      if (npcIndex === -1) return prev;

      const newNpcs = [...prev.npcs];
      newNpcs[npcIndex] = { ...newNpcs[npcIndex], isActionActive: true };
      
      if (npcsRef.current[npcIndex]) {
        npcsRef.current[npcIndex].isActionActive = true;
      }

      setTimeout(() => {
        setGameState(s => {
          const updatedNpcs = [...s.npcs];
          const idx = updatedNpcs.findIndex(n => n.id === npcId);
          if (idx !== -1) {
            updatedNpcs[idx] = { ...updatedNpcs[idx], isActionActive: false };
            const refIdx = npcsRef.current.findIndex(n => n.id === npcId);
            if (refIdx !== -1) {
              npcsRef.current[refIdx].isActionActive = false;
            }
          }
          return { ...s, npcs: updatedNpcs };
        });
      }, 800);

      return { ...prev, npcs: newNpcs };
    });
  }, [setGameState, npcsRef]);

  const triggerItemAction = useCallback((itemId: string) => {
    const currentState = stateRef.current;
    const itemIdx = currentState.items.findIndex(i => i.id === itemId);
    if (itemIdx === -1) return;
    
    const item = currentState.items[itemIdx];
    const config = ITEM_SPRITE_CONFIGS[item.spriteName];
    if (!config || !config.actionSequence) return;

    const sequence = config.actionSequence;
    let currentIdx = 0;

    const playNextFrame = () => {
      if (currentIdx >= sequence.length) return;
      
      setGameState(prev => {
        const idx = prev.items.findIndex(i => i.id === itemId);
        if (idx === -1) return prev;
        
        const newItems = [...prev.items];
        newItems[idx] = { 
          ...newItems[idx], 
          isActionActive: true, 
          actionFrame: currentIdx + 1 
        };
        
        const refIdx = itemsRef.current.findIndex(i => i.id === itemId);
        if (refIdx !== -1) {
          itemsRef.current[refIdx].isActionActive = true;
          itemsRef.current[refIdx].actionFrame = currentIdx + 1;
        }

        return { ...prev, items: newItems };
      });

      if (currentIdx < sequence.length - 1) {
        currentIdx++;
        setTimeout(playNextFrame, 250);
      }
    };

    playNextFrame();
  }, [setGameState, stateRef, itemsRef]);

  const nextDialogue = useCallback(() => {
    setGameState(prev => {
      if (!prev.activeDialogue) return prev;
      if (prev.dialogueIndex < prev.activeDialogue.length - 1) {
        return { ...prev, dialogueIndex: prev.dialogueIndex + 1 };
      } else {
        if (prev.talkingItemId) {
          const itemId = prev.talkingItemId;
          const targetItem = prev.items.find(i => i.id === itemId);
          const updatedItems = prev.items.filter(item => item.id !== itemId);
          const newCollectedIds = [...prev.collectedItemIds, itemId];
          
          const newInventory = { ...prev.inventory };
          if (targetItem) {
            const itemKey = targetItem.name;
            newInventory[itemKey] = (newInventory[itemKey] || 0) + 1;
          }

          itemsRef.current = itemsRef.current.filter(item => item.id !== itemId);
          initCollisionMap(playerRef.current, npcsRef.current, itemsRef.current);

          return { 
            ...prev, 
            isTalking: false, 
            talkingItemId: null, 
            activeDialogue: null, 
            dialogueIndex: 0,
            items: updatedItems,
            collectedItemIds: newCollectedIds,
            inventory: newInventory,
            hasInteractedWithItem: true
          };
        }

        const talkingNPCId = prev.talkingNPCId;
        const talkingNPCIndex = prev.npcs.findIndex(n => n.id === talkingNPCId);
        if (talkingNPCId && talkingNPCIndex !== -1) {
          const npc = prev.npcs[talkingNPCIndex];
          if (npc.npcType === NPCType.SHOPKEEPER && npc.actionTrigger === ActionTrigger.END) {
            triggerNPCAction(talkingNPCId);
          }
        }

        return { ...prev, isTalking: false, talkingNPCId: null, activeDialogue: null, dialogueIndex: 0, hasInteractedWithNPC: true };
      }
    });
  }, [initCollisionMap, triggerNPCAction, playerRef, npcsRef, itemsRef, setGameState]);

  const handleInteraction = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.menuState !== 'CLOSED') return;
    
    if (currentState.isTalking) {
      nextDialogue();
      return;
    }

    if (currentState.isTransitioning) return;

    const player = playerRef.current;
    const nearbyNPCResult = findNearbyNPC(npcsRef.current, player.pos, player.dir);
    const nearbyNPCIndex = nearbyNPCResult ? nearbyNPCResult.index : -1;

    if (nearbyNPCIndex !== -1) {
      const nearbyNPC = npcsRef.current[nearbyNPCIndex];
      let newDir: Direction = nearbyNPC.dir;
      if (nearbyNPC.npcType !== NPCType.SHOPKEEPER) {
        const dx = player.pos.x - nearbyNPC.pos.x;
        const dy = player.pos.y - nearbyNPC.pos.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          newDir = dx > 0 ? 'right' : 'left';
        } else {
          newDir = dy > 0 ? 'down' : 'up';
        }
        npcsRef.current[nearbyNPCIndex].dir = newDir;
      }

      const dialogueGroups = nearbyNPC.dialogue || [];
      const groupIndex = nearbyNPC.dialogueGroupIndex || 0;
      const currentDialogueGroup = dialogueGroups[groupIndex % dialogueGroups.length] || [];

      if (nearbyNPC.npcType === NPCType.SHOPKEEPER && nearbyNPC.actionTrigger === ActionTrigger.START) {
        triggerNPCAction(nearbyNPC.id);
      }

      setGameState(prev => {
        const newNpcs = [...prev.npcs];
        newNpcs[nearbyNPCIndex] = { 
          ...newNpcs[nearbyNPCIndex], 
          dir: newDir,
          dialogueGroupIndex: (groupIndex + 1) % dialogueGroups.length
        };
        npcsRef.current[nearbyNPCIndex].dialogueGroupIndex = newNpcs[nearbyNPCIndex].dialogueGroupIndex;

        return {
          ...prev,
          npcs: newNpcs,
          isTalking: true,
          talkingNPCId: nearbyNPC.id,
          activeDialogue: currentDialogueGroup,
          dialogueIndex: 0,
          hasInteractedWithNPC: true
        };
      });
    } else {
      const nearbyItemResult = findNearbyItem(itemsRef.current, player.pos, player.dir);
      const nearbyItemIndex = nearbyItemResult ? nearbyItemResult.index : -1;

      if (nearbyItemIndex !== -1) {
        const item = itemsRef.current[nearbyItemIndex];
        triggerItemAction(item.id);

        setGameState(prev => ({
          ...prev,
          isTalking: true,
          talkingItemId: item.id,
          activeDialogue: item.dialogue,
          dialogueIndex: 0,
          hasInteractedWithItem: true
        }));
      }
    }
  }, [nextDialogue, triggerItemAction, triggerNPCAction, playerRef, npcsRef, itemsRef, setGameState, stateRef]);

  return {
    handleInteraction,
    triggerNPCAction,
    triggerItemAction,
    nextDialogue
  };
}
