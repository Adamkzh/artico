import { NativeModules } from 'react-native';

export const getDevHost = () => {
  const scriptURL = NativeModules.SourceCode.scriptURL;
  const match = scriptURL?.match(/^https?:\/\/(.*?):\d+\//);
  return match?.[1];
};