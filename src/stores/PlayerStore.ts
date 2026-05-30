import { makeAutoObservable } from 'mobx';
import { Entity } from '../types';
import { GameStore } from './GameStore';

export class PlayerStore {
  rootStore: GameStore;
  player: Entity;
  inventory: Record<string, number>;
  collectedItemIds: string[];

  constructor(rootStore: GameStore, initial: any) {
    this.rootStore = rootStore;
    this.player = initial.player;
    this.inventory = initial.inventory;
    this.collectedItemIds = initial.collectedItemIds;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setPlayer(player: Entity) {
    this.player = player;
  }

  setInventory(inventory: Record<string, number>) {
    this.inventory = inventory;
  }

  setCollectedItemIds(ids: string[]) {
    this.collectedItemIds = ids;
  }
}
