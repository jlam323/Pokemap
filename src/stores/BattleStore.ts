import { makeAutoObservable } from 'mobx';
import { Entity, Pokeball, FloatingMessage, VFX } from '../types';
import { GameStore } from './GameStore';

export class BattleStore {
  rootStore: GameStore;
  battleOpponent: Entity | null;
  pokeballs: Pokeball[];
  floatingMessages: FloatingMessage[];
  vfx: VFX[];

  constructor(rootStore: GameStore, initial: any) {
    this.rootStore = rootStore;
    this.battleOpponent = initial.battleOpponent;
    this.pokeballs = initial.pokeballs;
    this.floatingMessages = initial.floatingMessages;
    this.vfx = initial.vfx;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setBattleOpponent(opponent: Entity | null) {
    this.battleOpponent = opponent;
  }

  setPokeballs(pokeballs: Pokeball[]) {
    this.pokeballs = pokeballs;
  }

  setFloatingMessages(messages: FloatingMessage[]) {
    this.floatingMessages = messages;
  }

  setVFX(vfx: VFX[]) {
    this.vfx = vfx;
  }
}
