import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

const ResultScreen = () => {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [displayedText, setDisplayedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fullText = "这幅画描绘的是《圣经·新约》中著名的场景——以马忤斯的晚餐。故事发生在耶稣复活后的第三天。两位门徒在前往以马忤斯小镇的路上遇见了耶稣，但当时他们并未认出他。直到晚餐时，当耶稣拿起面包，掰开并分给他们时，门徒才突然意识到，这位同行者正是已经复活的耶稣。画面上，耶稣坐在桌子中央，正掰开面包，象征着圣餐与救赎。左侧和右侧的门徒表情激动，身体微微前倾，传达出那一刻认出耶稣的惊讶与感动。画面背后的两位仆人则显得更加平静，他们并未意识到眼前发生了奇迹，形成了有趣的对比。这幅作品采用了强烈的明暗对比法（Chiaroscuro），光源从画面一侧射入，照亮了耶稣及门徒的面容和手势，而背景则沉浸在深邃的暗色之中。这种手法不仅增加了戏剧性，也集中观众的注意力，引导我们感受人物内心的震撼与虔诚。从画风和处理细节来看，这幅画高度接近意大利巴洛克时期大师卡拉瓦乔的风格。卡拉瓦乔以真实、直接的表现著称，他强调普通人的形象，赋予宗教故事以前所未有的人性力量。在这幅画中，人物衣着质朴，餐桌上的食物和器皿简单而具体，仿佛故事就发生在我们身边。值得注意的是，卡拉瓦乔本人创作过两版《以马忤斯的晚餐》。一版绘于1601年，另一版绘于1606年。根据画面气氛和人物表情的克制程度来看，这幅作品更接近他晚年的风格：更深沉，更内敛，更注重心灵的震颤而非外在的戏剧张力。整幅画不仅是宗教信仰的再现，也是人性与奇迹交汇瞬间的深刻凝视。请大家慢慢欣赏画中细节，用心感受那一瞬间，信仰在平凡生活中绽放的光芒。";

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, []);

  const toggleSpeech = async () => {
    if (isSpeaking) {
      await Speech.stop();
    } else {
      await Speech.speak(fullText, {
        language: 'zh',
        onDone: () => setIsSpeaking(false),
      });
    }
    setIsSpeaking(!isSpeaking);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
      />

      <ScrollView style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>{displayedText}</Text>
        </View>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.speechButton}
          onPress={toggleSpeech}
        >
          <Ionicons
            name={isSpeaking ? 'pause' : 'play'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: width,
    height: width,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  textContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  speechButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResultScreen; 