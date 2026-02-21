import { View, StyleSheet, Button } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

const audioSource = require('../assets/audio.mp3');

export default function AutoAudio() {
    const player = useAudioPlayer(audioSource);

    useEffect(() => {
        if (!player) return;

        const playAudio = async () => {
            try {
                player.volume = 0.2;
                player.seekTo(0);
                await player.play();
            } catch (e) {
                console.log('Autoplay bloqueado pelo sistema');
            }
        };

        playAudio();
    }, [player]);

    return null
}