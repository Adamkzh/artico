declare module 'react-native-masonry-list' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  interface MasonryListProps {
    images: Array<{
      uri: string;
      dimensions: { width: number; height: number };
      title?: string;
      artist?: string;
      artwork?: any;
    }>;
    columns?: number;
    spacing?: number;
    refreshing?: boolean;
    onRefresh?: () => void;
    imageContainerStyle?: ViewStyle;
    renderIndividualHeader?: (data: any) => React.ReactNode;
    renderIndividualFooter?: (data: any) => React.ReactNode;
    onPressImage?: (item: any) => void;
  }

  export default class MasonryList extends Component<MasonryListProps> {}
} 