/**
 * Categorical palette assigned in fixed order (validated for CVD-separation
 * and contrast against this app's actual surfaces via the dataviz skill's
 * validator — see conversation history, not re-derivable from eyeballing).
 * Never reassign a category to a different slot or reorder this list.
 */
export const CATEGORY_COLORS: Record<string, { light: string; dark: string }> = {
  Chest: { light: '#2a78d6', dark: '#3987e5' }, // blue
  Back: { light: '#eb6834', dark: '#d95926' }, // orange
  Legs: { light: '#1baf7a', dark: '#199e70' }, // aqua
  Shoulders: { light: '#eda100', dark: '#c98500' }, // yellow
  Arms: { light: '#e87ba4', dark: '#d55181' }, // magenta
  Core: { light: '#008300', dark: '#008300' }, // green
  Cardio: { light: '#4a3aa7', dark: '#9085e9' }, // violet
  'My Exercises': { light: '#e34948', dark: '#e66767' }, // red
};

export function getCategoryColor(category: string, scheme: 'light' | 'dark'): string {
  return CATEGORY_COLORS[category]?.[scheme] ?? (scheme === 'light' ? '#898781' : '#898781');
}
