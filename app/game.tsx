import AutoAudio from '@/components/play-sound';
import { usePayment } from '@/contexts/PaymentProvider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StatusBar, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BOARD_WIDTH = width * 0.82;
const BOARD_HEIGHT = BOARD_WIDTH + 80;
const PIECE_SIZE = 50;
const NODE_SIZE = 24;

const THEME = {
    background: '#09090b',
    surface: '#18181b',
    lineIdle: '#27272a',
    lineActive: '#52525b',
    p1Color: '#FFD700',
    p1Glow: 'rgba(255, 215, 0, 0.6)',
    p2Color: '#32CD32',
    p2Glow: 'rgba(50, 205, 50, 0.6)',
    validNode: '#22c55e',
    text: '#e4e4e7',
    textDim: '#71717a'
};

const POSITIONS = [
    { id: 0, x: 0, y: 0 }, { id: 1, x: 0.5, y: 0 }, { id: 2, x: 1, y: 0 },
    { id: 3, x: 0, y: 0.5 }, { id: 4, x: 0.5, y: 0.5 }, { id: 5, x: 1, y: 0.5 },
    { id: 6, x: 0, y: 1 }, { id: 7, x: 0.5, y: 1 }, { id: 8, x: 1, y: 1 },
].map(p => ({ ...p, x: p.x * BOARD_WIDTH, y: p.y * BOARD_HEIGHT }));

const CONNECTIONS = {
    0: [1, 3, 4],
    1: [0, 2, 4],
    2: [1, 5, 4],
    3: [0, 6, 4],
    4: [0, 1, 2, 3, 5, 6, 7, 8],
    5: [2, 8, 4],
    6: [3, 7, 4],
    7: [6, 8, 4],
    8: [5, 7, 4],
};

const INITIAL_PIECES = [
    { id: 'p1-1', player: 'p1', position: 6 },
    { id: 'p1-2', player: 'p1', position: 7 },
    { id: 'p1-3', player: 'p1', position: 8 },
    { id: 'p2-1', player: 'p2', position: 0 },
    { id: 'p2-2', player: 'p2', position: 1 },
    { id: 'p2-3', player: 'p2', position: 2 },
];

const ConnectionLine = ({ start, end }) => {
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

    return (
        <View
            style={{
                position: 'absolute',
                backgroundColor: THEME.lineIdle,
                height: 4,
                borderRadius: 2,
                width: length,
                left: (start.x + end.x) / 2 - length / 2,
                top: (start.y + end.y) / 2 - 2,
                transform: [{ rotate: `${angle}deg` }],
                zIndex: 0
            }}
        />
    );
};

const NodePoint = ({ position, isValidTarget, onPress }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        if (isValidTarget) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.4, { duration: 600 }),
                    withTiming(1, { duration: 600 })
                ),
                -1,
                true
            );
            opacity.value = withTiming(1);
        } else {
            scale.value = withTiming(1);
            opacity.value = withTiming(0.3);
        }
    }, [isValidTarget]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
        backgroundColor: isValidTarget ? THEME.validNode : THEME.lineActive,
    }));

    return (
        <View style={[styles.nodeContainer, { left: position.x - 20, top: position.y - 20 }]}>
            <Animated.View style={[styles.nodeVisual, animatedStyle]} />
            {isValidTarget && (
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={onPress}
                />
            )}
        </View>
    );
};

const GamePiece = ({ piece, onDragStart, onDragEnd, onTap, enabled, targetPos, avatar, isSelected }) => {
    const isDragging = useSharedValue(false);
    const scale = useSharedValue(1);
    const [forceReset, setForceReset] = useState(0);

    const posX = useSharedValue(targetPos.x - PIECE_SIZE / 2);
    const posY = useSharedValue(targetPos.y - PIECE_SIZE / 2);

    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    const didMove = useSharedValue(false);

    useEffect(() => {
        posX.value = targetPos.x - PIECE_SIZE / 2;
        posY.value = targetPos.y - PIECE_SIZE / 2;
    }, [piece.position, forceReset]);

    useEffect(() => {
        if (isSelected) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 350 }),
                    withTiming(1.0, { duration: 350 })
                ),
                -1,
                true
            );
        } else {
            scale.value = withTiming(1);
        }
    }, [isSelected]);

    const handleDragEndWithReset = useCallback((id, x, y, wasDrag) => {
        onDragEnd(id, x, y, wasDrag);
        setTimeout(() => {
            setForceReset(prev => prev + 1);
        }, 50);
    }, [onDragEnd]);

    const pan = Gesture.Pan()
        .enabled(enabled)
        .onStart(() => {
            isDragging.value = true;
            didMove.value = false;
            scale.value = withSpring(1.25, { damping: 15 });
            startX.value = posX.value;
            startY.value = posY.value;
            runOnJS(onDragStart)(piece.id);
        })
        .onUpdate((event) => {
            if (Math.abs(event.translationX) > 8 || Math.abs(event.translationY) > 8) {
                didMove.value = true;
            }
            posX.value = startX.value + event.translationX;
            posY.value = startY.value + event.translationY;
        })
        .onEnd((event) => {
            const absoluteX = targetPos.x + event.translationX;
            const absoluteY = targetPos.y + event.translationY;
            runOnJS(handleDragEndWithReset)(piece.id, absoluteX, absoluteY, didMove.value);
        })
        .onFinalize(() => {
            isDragging.value = false;
        });

    const animatedStyle = useAnimatedStyle(() => ({
        left: posX.value,
        top: posY.value,
        transform: [{ scale: scale.value }],
        zIndex: isDragging.value ? 999 : 10,
        elevation: isDragging.value ? 20 : 5,
    }));

    const isP1 = piece.player === 'p1';

    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                style={[styles.pieceWrapper, animatedStyle]}
                onTouchStart={() => {
                    if (enabled) onTap(piece.id);
                }}
            >
                <View style={[
                    styles.pieceInner,
                    {
                        backgroundColor: isP1 ? THEME.p1Color : THEME.p2Color,
                        borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)',
                        borderWidth: isSelected ? 4 : 3,
                    }
                ]}>
                    <Text style={styles.pieceEmoji}>{avatar}</Text>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};

export default function JogoDaTrilha() {
    const [pieces, setPieces] = useState(INITIAL_PIECES);
    const [turn, setTurn] = useState('p1');
    const [winner, setWinner] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [activePiece, setActivePiece] = useState(null);
    const piecesRef = useRef(pieces);
    const { payment, packages, hasPlan, currentPlan } = usePayment();


    const player1Avatar = '🐴';
    const player2Avatar = '🌽';

    useEffect(() => {
        piecesRef.current = pieces;
    }, [pieces]);

    const checkWin = (currentPieces, player) => {
        const playerPositions = currentPieces
            .filter(p => p.player === player)
            .map(p => p.position);

        const VALID_LINES = [
            [3, 4, 5],
            [1, 4, 7],
            [0, 4, 8],
            [2, 4, 6]
        ];

        return VALID_LINES.some(line =>
            line.every(pos => playerPositions.includes(pos))
        );
    };

    const handleMove = useCallback((pieceId, toPosition) => {
        setPieces(currentPieces => {
            const piece = currentPieces.find(p => p.id === pieceId);
            if (!piece) return currentPieces;

            if (piece.player !== turn || winner) return currentPieces;

            const currentPos = piece.position;
            const validNeighbors = CONNECTIONS[currentPos];
            if (!validNeighbors.includes(toPosition)) {
                ToastAndroid.show("Movimento inválido!", ToastAndroid.SHORT);
                return currentPieces;
            }

            const isOccupied = currentPieces.some(p => p.position === toPosition);
            if (isOccupied) {
                ToastAndroid.show("Ponto ocupado!", ToastAndroid.SHORT);
                return currentPieces;
            }

            const newPieces = currentPieces.map(p =>
                p.id === pieceId ? { ...p, position: toPosition } : p
            );

            if (checkWin(newPieces, piece.player)) {
                setWinner(piece.player);
            } else {
                setTurn(piece.player === 'p1' ? 'p2' : 'p1');
            }

            return newPieces;
        });
    }, [turn, winner]);

    const handleDragStart = useCallback((id) => {
        const currentPieces = piecesRef.current;
        const piece = currentPieces.find(p => p.id === id);
        if (!piece || piece.player !== turn || winner) return;

        if (activePiece === id) {
            setActivePiece(null);
            setValidMoves([]);
            return;
        }

        setActivePiece(id);
        const neighbors = CONNECTIONS[piece.position];
        const occupied = currentPieces.map(p => p.position);
        const available = neighbors.filter(pos => !occupied.includes(pos));
        setValidMoves(available);
    }, [turn, winner, activePiece]);

    const handleDragEnd = useCallback((id, x, y, wasDrag) => {
        const currentPieces = piecesRef.current;
        const piece = currentPieces.find(p => p.id === id);

        let nearestId = -1;
        let minDist = Infinity;
        POSITIONS.forEach(p => {
            const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
            if (dist < minDist) {
                minDist = dist;
                nearestId = p.id;
            }
        });

        const droppedOnOwnPosition = piece && nearestId === piece.position;

        if (!wasDrag || droppedOnOwnPosition) {
            return;
        }

        setActivePiece(null);
        setValidMoves([]);

        if (minDist < BOARD_WIDTH / 4 && nearestId !== -1) {
            handleMove(id, nearestId);
        }
    }, [handleMove]);

    const handleNodePress = useCallback((targetPosition) => {
        if (activePiece) {
            handleMove(activePiece, targetPosition);
            setActivePiece(null);
            setValidMoves([]);
        }
    }, [activePiece, handleMove]);

    const resetGame = () => {
        setPieces(INITIAL_PIECES);
        setTurn('p1');
        setWinner(null);
        setValidMoves([]);
        setActivePiece(null);


    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <AutoAudio />
            <View style={styles.hud}>
                <Text style={styles.gameTitle}>JOGO DA TRILHA</Text>

                <View style={styles.scoreStrip}>
                    <View style={[
                        styles.playerBadge,
                        turn === 'p1' && !winner && styles.activeBadge,
                        { borderColor: THEME.p1Color }
                    ]}>
                        <Text style={styles.badgeEmoji}>{player1Avatar}</Text>
                        <Text style={[styles.badgeText, { color: THEME.p1Color }]}>CAVALOS</Text>
                    </View>

                    <Text style={styles.vs}>VS</Text>

                    <View style={[
                        styles.playerBadge,
                        turn === 'p2' && !winner && styles.activeBadge,
                        { borderColor: THEME.p2Color }
                    ]}>
                        <Text style={styles.badgeEmoji}>{player2Avatar}</Text>
                        <Text style={[styles.badgeText, { color: THEME.p2Color }]}>MILHOS</Text>
                    </View>
                </View>

                {winner && (
                    <View style={styles.banner}>
                        <Text style={styles.bannerEmoji}>{winner === 'p1' ? player1Avatar : player2Avatar}</Text>
                        <Text style={styles.bannerText}>
                            {winner === 'p1' ? 'CAVALINHOS VENCEM!' : 'MILHOS VENCEM!'}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.boardArea}>
                <View style={styles.boardLines}>
                    <ConnectionLine start={POSITIONS[0]} end={POSITIONS[2]} />
                    <ConnectionLine start={POSITIONS[2]} end={POSITIONS[8]} />
                    <ConnectionLine start={POSITIONS[8]} end={POSITIONS[6]} />
                    <ConnectionLine start={POSITIONS[6]} end={POSITIONS[0]} />
                    <ConnectionLine start={POSITIONS[0]} end={POSITIONS[8]} />
                    <ConnectionLine start={POSITIONS[2]} end={POSITIONS[6]} />
                    <ConnectionLine start={POSITIONS[1]} end={POSITIONS[7]} />
                    <ConnectionLine start={POSITIONS[3]} end={POSITIONS[5]} />
                </View>

                {POSITIONS.map(pos => (
                    <NodePoint
                        key={pos.id}
                        position={pos}
                        isValidTarget={validMoves.includes(pos.id)}
                        onPress={() => handleNodePress(pos.id)}
                    />
                ))}

                {pieces.map(piece => (
                    <GamePiece
                        key={piece.id}
                        piece={piece}
                        targetPos={POSITIONS[piece.position]}
                        enabled={!winner && piece.player === turn}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onTap={handleDragStart}
                        avatar={piece.player === 'p1' ? player1Avatar : player2Avatar}
                        isSelected={activePiece === piece.id}
                    />
                ))}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={resetGame} style={styles.resetBtn}>
                    <Text style={styles.resetBtnText}>🔄 REINICIAR JOGO</Text>
                </TouchableOpacity>
                <Text style={styles.rules}>Toque na peça e clique no ponto verde para mover</Text>
                <Text style={styles.rulesSmall}>Ou arraste diretamente • Conecte 3 pelo centro</Text>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    hud: {
        position: 'absolute',
        top: 70,
        width: '100%',
        alignItems: 'center',
        zIndex: 50,
        paddingHorizontal: 20,
    },
    gameTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: THEME.text,
        letterSpacing: 4,
        marginBottom: 25,
        textShadowColor: THEME.p1Color,
        textShadowRadius: 12,
    },
    scoreStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    playerBadge: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        opacity: 0.5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activeBadge: {
        opacity: 1,
        backgroundColor: THEME.surface,
        transform: [{ scale: 1.05 }],
    },
    badgeEmoji: {
        fontSize: 20,
    },
    badgeText: {
        fontWeight: '800',
        letterSpacing: 0.5,
        fontSize: 12,
    },
    vs: {
        color: THEME.textDim,
        fontWeight: 'bold',
        fontSize: 14,
    },
    banner: {
        position: 'absolute',
        top: 110,
        backgroundColor: THEME.surface,
        paddingHorizontal: 30,
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: THEME.text,
        shadowColor: '#fff',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bannerEmoji: {
        fontSize: 32,
    },
    bannerText: {
        color: THEME.text,
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
    },
    boardArea: {
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        position: 'relative',
        marginTop: 50,
        marginBottom: 20,
    },
    boardLines: {
        ...StyleSheet.absoluteFillObject,
    },
    nodeContainer: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nodeVisual: {
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: NODE_SIZE / 2,
    },
    pieceWrapper: {
        position: 'absolute',
        width: PIECE_SIZE,
        height: PIECE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pieceInner: {
        width: PIECE_SIZE,
        height: PIECE_SIZE,
        borderRadius: PIECE_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    pieceEmoji: {
        fontSize: 28,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    resetBtn: {
        backgroundColor: THEME.surface,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: THEME.lineActive,
        marginBottom: 15,
        shadowColor: THEME.p1Color,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    resetBtnText: {
        color: THEME.text,
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 14,
    },
    rules: {
        color: THEME.textDim,
        fontSize: 13,
        marginBottom: 5,
    },
    rulesSmall: {
        color: THEME.textDim,
        fontSize: 11,
        opacity: 0.7,
    }
});