import content from './content.json';

// Automatically format the JSON data for the React components
export const REAL_WORDS = content.realWords.map(w => ({ ...w, isReal: true }));
export const FAKE_WORDS = content.fakeWords.map(w => ({ ...w, isReal: false }));
export const PASSAGES = content.passages;