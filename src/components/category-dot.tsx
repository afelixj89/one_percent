import { useColorScheme, View } from 'react-native';

import { getCategoryColor } from '@/constants/category-colors';

type CategoryDotProps = {
  category: string;
  size?: number;
};

export function CategoryDot({ category, size = 10 }: CategoryDotProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const color = getCategoryColor(category, scheme);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}
