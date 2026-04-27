import { ChevronRight, Code, Home, Send } from 'lucide-react-native';
import { type OpaqueColorValue, type StyleProp, type ViewStyle, View } from 'react-native';

const ICON_MAP = {
  'house.fill': Home,
  'paperplane.fill': Send,
  'chevron.left.forwardslash.chevron.right': Code,
  'chevron.right': ChevronRight,
} as const;

type IconSymbolName = keyof typeof ICON_MAP;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
}) {
  const Icon = ICON_MAP[name];

  return (
    <View style={style}>
      <Icon color={String(color)} size={size} />
    </View>
  );
}
