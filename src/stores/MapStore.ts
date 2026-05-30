import { makeAutoObservable } from 'mobx';
import { Entity, Item, Position, MenuState } from '../types';
import { GameStore } from './GameStore';

export class MapStore {
  rootStore: GameStore;
  npcs: Entity[];
  items: Item[];
  currentMapId: number;
  previousMapId: number | null;
  mapReturnPositions: Record<number, Position>;
  isTransitioning: boolean;
  transitionType: 'fade' | 'flash' | 'circle';
  isTalking: boolean;
  talkingNPCId: string | null;
  talkingItemId: string | null;
  activeDialogue: string[] | null;
  dialogueIndex: number;
  hasInteractedWithNPC: boolean;
  hasInteractedWithItem: boolean;
  menuState: MenuState;

  constructor(rootStore: GameStore, initial: any) {
    this.rootStore = rootStore;
    this.npcs = initial.npcs;
    this.items = initial.items;
    this.currentMapId = initial.currentMapId;
    this.previousMapId = initial.previousMapId;
    this.mapReturnPositions = initial.mapReturnPositions;
    this.isTransitioning = initial.isTransitioning;
    this.transitionType = initial.transitionType;
    this.isTalking = initial.isTalking;
    this.talkingNPCId = initial.talkingNPCId;
    this.talkingItemId = initial.talkingItemId;
    this.activeDialogue = initial.activeDialogue;
    this.dialogueIndex = initial.dialogueIndex;
    this.hasInteractedWithNPC = initial.hasInteractedWithNPC;
    this.hasInteractedWithItem = initial.hasInteractedWithItem;
    this.menuState = initial.menuState;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setNpcs(npcs: Entity[]) {
    this.npcs = npcs;
  }

  setItems(items: Item[]) {
    this.items = items;
  }

  setCurrentMapId(id: number) {
    this.currentMapId = id;
  }

  setPreviousMapId(id: number | null) {
    this.previousMapId = id;
  }

  setMapReturnPositions(positions: Record<number, Position>) {
    this.mapReturnPositions = positions;
  }

  setIsTransitioning(val: boolean) {
    this.isTransitioning = val;
  }

  setTransitionType(type: 'fade' | 'flash' | 'circle') {
    this.transitionType = type;
  }

  setIsTalking(val: boolean) {
    this.isTalking = val;
  }

  setTalkingNPCId(id: string | null) {
    this.talkingNPCId = id;
  }

  setTalkingItemId(id: string | null) {
    this.talkingItemId = id;
  }

  setActiveDialogue(dialogue: string[] | null) {
    this.activeDialogue = dialogue;
  }

  setDialogueIndex(index: number) {
    this.dialogueIndex = index;
  }

  setHasInteractedWithNPC(val: boolean) {
    this.hasInteractedWithNPC = val;
  }

  setHasInteractedWithItem(val: boolean) {
    this.hasInteractedWithItem = val;
  }

  setMenuState(state: MenuState) {
    this.menuState = state;
  }
}
