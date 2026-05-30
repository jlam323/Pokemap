import { makeAutoObservable } from 'mobx';
import { CatchNotification } from '../types';
import { GameStore } from './GameStore';

export class PokedexStore {
  rootStore: GameStore;
  caughtPokemonIds: string[];
  viewedPokemonIds: string[];
  activePartnerId: string | null;
  catchNotifications: CatchNotification[];

  constructor(rootStore: GameStore, initial: any) {
    this.rootStore = rootStore;
    this.caughtPokemonIds = initial.caughtPokemonIds;
    this.viewedPokemonIds = initial.viewedPokemonIds;
    this.activePartnerId = initial.activePartnerId;
    this.catchNotifications = initial.catchNotifications;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setCaughtPokemonIds(ids: string[]) {
    this.caughtPokemonIds = ids;
  }

  setViewedPokemonIds(ids: string[]) {
    this.viewedPokemonIds = ids;
  }

  setActivePartnerId(id: string | null) {
    this.activePartnerId = id;
  }

  setCatchNotifications(notifications: CatchNotification[]) {
    this.catchNotifications = notifications;
  }
}
