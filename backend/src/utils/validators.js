export function isValidWord(word, usedWords) {
  if (!word) return false;
  if (word.trim().length === 0) return false;
  if (usedWords.includes(word.toLowerCase())) return false;
  if (word.length > 20) return false;
  return true;
}
