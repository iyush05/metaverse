import { Assets, Container, type Texture } from "pixi.js"
import { extend } from "@pixi/react"
import { useCallback, useEffect, useState, useRef, type PropsWithChildren } from "react"
import Level from "./Levels/Level"
import Hero from "./Hero/Hero"
import heroAsset from "../assets/hero.png"
import { TILE_SIZE, DEFAULT_POS_X, DEFAULT_POS_Y } from "../constants/game-world"
import { Camera } from "./Camera/Camera"
import type { OtherPlayers } from "../types/multiplayer"
import { OtherPlayer } from "./Hero/OtherPlayer.js"

extend({ Container })

interface IMainContainerProps {
    canvasSize: { width: number, height: number };
    otherPlayers: OtherPlayers;
}

export const MainContainer = ({
    canvasSize,
    children,
    otherPlayers
}: PropsWithChildren<IMainContainerProps>) => {
    const heroPixelPosition = useRef({ x: DEFAULT_POS_X, y: DEFAULT_POS_Y });
    const [heroPosition, setHeroPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [heroTexture, setHeroTexture] = useState<Texture | null>(null);

    useEffect(() => {
        Assets.load(heroAsset).then((loadedTexture) => {
            setHeroTexture(loadedTexture);
        });
    }, []);

    const updateHeroPosition = useCallback((x: number, y: number) => {
        setHeroPosition({
            x: Math.floor(x / TILE_SIZE), 
            y: Math.floor(y / TILE_SIZE)
        });
    }, []);

    return (
        <pixiContainer>
            {children}
            <Camera canvasSize={canvasSize} heroPixelPosition={heroPixelPosition}>
                <Level />
                {heroTexture && <Hero texture={heroTexture} onMove={updateHeroPosition} pixelPosition={heroPixelPosition} />}
                {Object.entries(otherPlayers).map(([id, state]) => (
                    heroTexture && <OtherPlayer key={id} texture={heroTexture} { ...state } />
                ))}
            </Camera>
        </pixiContainer>
    )
}

export default MainContainer