import { usePlayerStore } from '@/src/store/playerStore';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function StartScreen() {
  const router = useRouter();
  const profile = usePlayerStore((state) => state.profile);

  const scaleValue = useRef(new Animated.Value(1)).current;

  const player = useAudioPlayer(require('@/assets/audio/wild_runners_main_title.mp3'));

  useEffect(() => {
    player.loop = true;
    player.play();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.06,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        })
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [player]);

  const handleStartPress = () => {
    player.pause();

    if (!profile) {
      router.push({ pathname: '/LoadingScreen', params: { next: '/RegistrationScreen' } });
    } else {
      router.push({ pathname: '/LoadingScreen', params: { next: '/CarSelectionScreen' } });
    }
  };

    return (
        <ImageBackground
            source={require("@/assets/images/components/background/start_screen.png")}
            resizeMode="cover"
            style={styles.background}
        >

            <View style={styles.overlay}>

                <Image
                    source={require("@/assets/images/gameLogoV3.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <TouchableOpacity style={styles.button} onPress={handleStartPress}>
                    <Text style={styles.buttonText}>
                        PRESSIONE PARA COMEÇAR
                    </Text>

                    <View style={styles.bottomGlow}/>
                </TouchableOpacity>

            </View>

        </ImageBackground>
    );
}

const styles = StyleSheet.create({

    background:{
        flex:1,
        width:"100%",
        height:"100%",
    },

    overlay:{
        flex:1,
        justifyContent:"space-evenly",
        alignItems:"center",

        backgroundColor:"rgba(0,0,0,0.15)"
    },

    logo:{
        width:450,
        height:170
    },

    button:{
        width:'50%',
        height:50,
        backgroundColor:"#111",
        borderWidth:1.5,
        borderColor:"#D4A734",
        justifyContent:"center",
        alignItems:"center",
        borderRadius:6,
        position:"relative",
    },

    buttonText:{
        color:"#F2C55A",
        fontWeight:"700",
        letterSpacing:2,
        fontSize:22,
        textAlign: 'center',
    },

    bottomGlow:{
        position:"absolute",
        bottom:-2,

        width:90,
        height:3,

        borderRadius:10,

        backgroundColor:"#FFD24D",

        shadowColor:"#FFD24D",
        shadowOpacity:1,
        shadowRadius:10,

        elevation:8,
    }

});