import { makeAutoObservable, runInAction } from 'mobx';
import { GameState, Entity, Item, Position, MenuState, Pokeball, FloatingMessage, VFX, CatchNotification } from '../types';
import { INITIAL_PLAYER } from '../data/player';
import { ALL_MAPS } from '../data/maps';
import { prepareMapData } from '../lib/mapLogic';

import { PlayerStore } from './PlayerStore';
import { MapStore } from './MapStore';
import { BattleStore } from './BattleStore';
import { PokedexStore } from './PokedexStore';

export function createInitialGameState(): GameState {
  const initialMap = ALL_MAPS[0];

  let caughtPokemonIds: string[] = [];
  let viewedPokemonIds: string[] = [];
  let inventory: Record<string, number> = {};
  let collectedItemIds: string[] = [];
  let activePartnerId: string | null = null;

  try {
    const savedPokedex = localStorage.getItem('pokedex_progress');
    if (savedPokedex) {
      caughtPokemonIds = JSON.parse(savedPokedex);
    }

    const savedViewed = localStorage.getItem('viewed_pokemon_progress');
    if (savedViewed) {
      viewedPokemonIds = JSON.parse(savedViewed);
    }
    
    const savedInventory = localStorage.getItem('inventory_progress');
    if (savedInventory) {
      inventory = JSON.parse(savedInventory);
    }

    const savedCollectedItems = localStorage.getItem('collected_items_progress');
    if (savedCollectedItems) {
      collectedItemIds = JSON.parse(savedCollectedItems);
    }

    const savedPartner = localStorage.getItem('active_partner_id');
    if (savedPartner) {
      activePartnerId = savedPartner;
    }
  } catch (e) {
    console.warn('Failed to load progress', e);
  }

  const { npcs, items, playerPos } = prepareMapData(initialMap.id, collectedItemIds, INITIAL_PLAYER);

  return {
    player: { ...INITIAL_PLAYER, pos: playerPos },
    npcs,
    items,
    isTalking: false,
    talkingNPCId: null,
    talkingItemId: null,
    activeDialogue: null,
    dialogueIndex: 0,
    currentMapId: initialMap.id,
    previousMapId: null,
    mapReturnPositions: {},
    collectedItemIds,
    caughtPokemonIds,
    viewedPokemonIds,
    inventory,
    menuState: 'CLOSED',
    activePartnerId,
    battleOpponent: null,
    isTransitioning: false,
    transitionType: 'fade',
    pokeballs: [],
    floatingMessages: [],
    vfx: [],
    hasInteractedWithNPC: false,
    hasInteractedWithItem: false,
    catchNotifications: []
  };
}

export class GameStore {
  playerStore: PlayerStore;
  mapStore: MapStore;
  battleStore: BattleStore;
  pokedexStore: PokedexStore;

  constructor() {
    const initial = createInitialGameState();
    this.playerStore = new PlayerStore(this, initial);
    this.mapStore = new MapStore(this, initial);
    this.battleStore = new BattleStore(this, initial);
    this.pokedexStore = new PokedexStore(this, initial);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Forwarding getters to sub-stores to maintain perfect GameState shape compatibility
  get player(): Entity { return this.playerStore.player; }
  get npcs(): Entity[] { return this.mapStore.npcs; }
  get items(): Item[] { return this.mapStore.items; }
  get isTalking(): boolean { return this.mapStore.isTalking; }
  get talkingNPCId(): string | null { return this.mapStore.talkingNPCId; }
  get talkingItemId(): string | null { return this.mapStore.talkingItemId; }
  get activeDialogue(): string[] | null { return this.mapStore.activeDialogue; }
  get dialogueIndex(): number { return this.mapStore.dialogueIndex; }
  get currentMapId(): number { return this.mapStore.currentMapId; }
  get previousMapId(): number | null { return this.mapStore.previousMapId; }
  get mapReturnPositions(): Record<number, Position> { return this.mapStore.mapReturnPositions; }
  get collectedItemIds(): string[] { return this.playerStore.collectedItemIds; }
  get caughtPokemonIds(): string[] { return this.pokedexStore.caughtPokemonIds; }
  get viewedPokemonIds(): string[] { return this.pokedexStore.viewedPokemonIds; }
  get inventory(): Record<string, number> { return this.playerStore.inventory; }
  get menuState(): MenuState { return this.mapStore.menuState; }
  get activePartnerId(): string | null { return this.pokedexStore.activePartnerId; }
  get battleOpponent(): Entity | null { return this.battleStore.battleOpponent; }
  get isTransitioning(): boolean { return this.mapStore.isTransitioning; }
  get transitionType(): 'fade' | 'flash' | 'circle' { return this.mapStore.transitionType; }
  get pokeballs(): Pokeball[] { return this.battleStore.pokeballs; }
  get floatingMessages(): FloatingMessage[] { return this.battleStore.floatingMessages; }
  get vfx(): VFX[] { return this.battleStore.vfx; }
  get hasInteractedWithNPC(): boolean { return this.mapStore.hasInteractedWithNPC; }
  get hasInteractedWithItem(): boolean { return this.mapStore.hasInteractedWithItem; }
  get catchNotifications(): CatchNotification[] { return this.pokedexStore.catchNotifications; }

  setGameState(updater: (prev: GameState) => GameState | Partial<GameState> | void) {
    runInAction(() => {
      // Create a snapshot by referencing current observables
      const currentSnapshot: GameState = {
        player: this.player,
        npcs: this.npcs,
        items: this.items,
        isTalking: this.isTalking,
        talkingNPCId: this.talkingNPCId,
        talkingItemId: this.talkingItemId,
        activeDialogue: this.activeDialogue,
        dialogueIndex: this.dialogueIndex,
        currentMapId: this.currentMapId,
        previousMapId: this.previousMapId,
        mapReturnPositions: this.mapReturnPositions,
        collectedItemIds: this.collectedItemIds,
        caughtPokemonIds: this.caughtPokemonIds,
        viewedPokemonIds: this.viewedPokemonIds,
        inventory: this.inventory,
        menuState: this.menuState,
        activePartnerId: this.activePartnerId,
        battleOpponent: this.battleOpponent,
        isTransitioning: this.isTransitioning,
        transitionType: this.transitionType,
        pokeballs: this.pokeballs,
        floatingMessages: this.floatingMessages,
        vfx: this.vfx,
        hasInteractedWithNPC: this.hasInteractedWithNPC,
        hasInteractedWithItem: this.hasInteractedWithItem,
        catchNotifications: this.catchNotifications
      };

      const result = updater(currentSnapshot);
      const updates = result || currentSnapshot;

      if (updates) {
        // Apply updates to relevant stores if they are different or redefined
        if (updates.player !== undefined) this.playerStore.setPlayer(updates.player);
        if (updates.inventory !== undefined) this.playerStore.setInventory(updates.inventory);
        if (updates.collectedItemIds !== undefined) this.playerStore.setCollectedItemIds(updates.collectedItemIds);

        if (updates.npcs !== undefined) this.mapStore.setNpcs(updates.npcs);
        if (updates.items !== undefined) this.mapStore.setItems(updates.items);
        if (updates.currentMapId !== undefined) this.mapStore.setCurrentMapId(updates.currentMapId);
        if (updates.previousMapId !== undefined) this.mapStore.setPreviousMapId(updates.previousMapId);
        if (updates.mapReturnPositions !== undefined) this.mapStore.setMapReturnPositions(updates.mapReturnPositions);
        if (updates.isTransitioning !== undefined) this.mapStore.setIsTransitioning(updates.isTransitioning);
        if (updates.transitionType !== undefined) this.mapStore.setTransitionType(updates.transitionType);
        if (updates.isTalking !== undefined) this.mapStore.setIsTalking(updates.isTalking);
        if (updates.talkingNPCId !== undefined) this.mapStore.setTalkingNPCId(updates.talkingNPCId);
        if (updates.talkingItemId !== undefined) this.mapStore.setTalkingItemId(updates.talkingItemId);
        if (updates.activeDialogue !== undefined) this.mapStore.setActiveDialogue(updates.activeDialogue);
        if (updates.dialogueIndex !== undefined) this.mapStore.setDialogueIndex(updates.dialogueIndex);
        if (updates.hasInteractedWithNPC !== undefined) this.mapStore.setHasInteractedWithNPC(updates.hasInteractedWithNPC);
        if (updates.hasInteractedWithItem !== undefined) this.mapStore.setHasInteractedWithItem(updates.hasInteractedWithItem);
        if (updates.menuState !== undefined) this.mapStore.setMenuState(updates.menuState);

        if (updates.caughtPokemonIds !== undefined) this.pokedexStore.setCaughtPokemonIds(updates.caughtPokemonIds);
        if (updates.viewedPokemonIds !== undefined) this.pokedexStore.setViewedPokemonIds(updates.viewedPokemonIds);
        if (updates.activePartnerId !== undefined) this.pokedexStore.setActivePartnerId(updates.activePartnerId);
        if (updates.catchNotifications !== undefined) this.pokedexStore.setCatchNotifications(updates.catchNotifications);

        if (updates.battleOpponent !== undefined) this.battleStore.setBattleOpponent(updates.battleOpponent);
        if (updates.pokeballs !== undefined) this.battleStore.setPokeballs(updates.pokeballs);
        if (updates.floatingMessages !== undefined) this.battleStore.setFloatingMessages(updates.floatingMessages);
        if (updates.vfx !== undefined) this.battleStore.setVFX(updates.vfx);
      }
      this.persistProgress();
    });
  }

  persistProgress() {
    try {
      localStorage.setItem('pokedex_progress', JSON.stringify(this.caughtPokemonIds));
      localStorage.setItem('viewed_pokemon_progress', JSON.stringify(this.viewedPokemonIds));
      localStorage.setItem('inventory_progress', JSON.stringify(this.inventory));
      localStorage.setItem('collected_items_progress', JSON.stringify(this.collectedItemIds));
      if (this.activePartnerId) {
        localStorage.setItem('active_partner_id', this.activePartnerId);
      } else {
        localStorage.removeItem('active_partner_id');
      }
    } catch (e) {
      console.warn('Failed to save progress', e);
    }
  }
}

export const gameStore = new GameStore();
