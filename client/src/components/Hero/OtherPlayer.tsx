import { useEffect, useRef } from "react";
import type { PlayerState } from "../../types/multiplayer";
import type { Texture } from "pixi.js";
import { useTick } from "@pixi/react";
import { useHeroAnimation } from "./useHeroAnimation";
import { ANIMATION_SPEED, MOVE_SPEED } from "../../constants/game-world";
import { handleMovement } from "../../helpers/common";

interface LerpPosition {
    x: number;
    y: number;
}

interface OtherPlayerProps extends PlayerState {
    texture: Texture;
}

export const OtherPlayer = ({ x, y, direction, texture }: OtherPlayerProps) => {
    const lerpPos = useRef<LerpPosition>({x, y});
    const targetPos = useRef<LerpPosition>({ x, y });

    const { sprite, updateSprite } = useHeroAnimation({
        texture,
        frameHeight: 64,
        frameWidth: 64,
        totalFrames: 9,
        animationSpeed: ANIMATION_SPEED
    });

    useEffect(() => {
        targetPos.current = { x, y };
    }, [x, y]);

    useTick((ticker) => {
        const delta = ticker.deltaTime;
        const { completed, position } = handleMovement(lerpPos.current, targetPos.current, MOVE_SPEED, delta);
        
        lerpPos.current = position;

        updateSprite(direction, !completed);
    });

    return (
        <pixiContainer>
            {sprite && ( <pixiSprite
                texture={sprite.texture}
                x={lerpPos.current.x}
                y={lerpPos.current.y}
                anchor={{ x: 0.5, y: 0.5 }}
                tint={0x88aaff}
                />)
            }
        </pixiContainer>
    );
}