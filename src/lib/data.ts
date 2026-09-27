import characterData from '../../content/characters.json';
import entityData from '../../content/entities.json';
export const characters = characterData;
export const entities = entityData;
export const collected = characters.filter(c => c.downloadable);
export const entityName = (id: string) => entities.find(e => e.id === id)?.name ?? id;
