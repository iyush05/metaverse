import { Assets, Container, type Texture } from "pixi.js"
import { extend } from "@pixi/react"
import { useCallback, useEffect, useState, type PropsWithChildren } from "react"
import Level from "./Levels/Level"
import Hero from "./Hero/Hero"
import heroAsset from "../assets/hero.png"
import { TILE_SIZE } from "../constants/game-world"

extend({ Container })

interface IMainContainerProps {
    canvasSize: { width: number, height: number }
}

export const MainContainer = ({
    canvasSize,
    children
}: PropsWithChildren<IMainContainerProps>) => {
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
            <Level />
            {heroTexture && <Hero texture={heroTexture} onMove={updateHeroPosition}/>}
        </pixiContainer>
    )
}

export default MainContainer