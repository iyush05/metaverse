import { Container, type Texture } from "pixi.js"
import { extend, useTick } from "@pixi/react"
import { ANIMATION_SPEED, DEFAULT_POS_X, DEFAULT_POS_Y, MOVE_SPEED } from "../../constants/game-world"
import { useCallback, useEffect, useRef, type MutableRefObject } from "react"
import { useHeroControls } from "./useHeroControls"
import type { IPosition, Direction } from "../../types/common"
import { calculateNewTarget, checkCanMove, handleMovement } from "../../helpers/common"
import { useHeroAnimation } from "./useHeroAnimation"
import type { PlayerState } from "../../types/multiplayer"
import { socket } from "../../services/socket"

extend({ Container })

interface IHeroProps {
    texture: Texture
    onMove: (gridX: number, gridY: number) => void
    pixelPosition?: MutableRefObject<IPosition>
}
const Hero = ({
    texture,
    onMove,
    pixelPosition
}: IHeroProps) => {
    const position = useRef({x: DEFAULT_POS_X, y: DEFAULT_POS_Y})
    const targetPosition = useRef<IPosition | null>(null);
    const currentDirection = useRef<Direction | null>(null);
    const { getControlsDirection } = useHeroControls();
    const direction = getControlsDirection();
    const isMoving = useRef(false);

    const { sprite, updateSprite } = useHeroAnimation({
        texture,
        frameHeight: 64,
        frameWidth: 64,
        totalFrames: 9,
        animationSpeed: ANIMATION_SPEED
    })


    useEffect(() => {
        onMove(position.current.x, position.current.y)
    }, [onMove])

    const setNextTarget = useCallback((direction: Direction) => {
        if (targetPosition.current) return;
        const {x, y} = position.current;
        currentDirection.current = direction;
        const newTarget = calculateNewTarget(x, y, direction);

        if (checkCanMove(newTarget)) {
            targetPosition.current = newTarget;

            const state: PlayerState = {
                x: newTarget.x,
                y: newTarget.y,
                direction,
                isMoving: true,
            };
            socket.emit("player-moved", state);
        }

    }, [])

    useTick((ticker) => {
        const delta = ticker.deltaTime;
        if (direction) {
            //next target
            setNextTarget(direction)
        }
        //movement
        if (targetPosition.current) {
            const {completed, position: newPosition} = handleMovement(position.current, targetPosition.current, MOVE_SPEED, delta)

            position.current = newPosition;
            if (pixelPosition) pixelPosition.current = newPosition;
            isMoving.current = true;

            if (completed) {
                const {x, y} = position.current;
                onMove(x, y);
                targetPosition.current = null;
                isMoving.current = false;

                const state: PlayerState = {
                    x,
                    y,
                    direction: currentDirection.current ?? "DOWN",
                    isMoving: false,
                };
                socket.emit("player-moved", state);
            }
            
        }
        updateSprite(currentDirection.current, isMoving.current);
    })

  return (
    <pixiContainer>
        {sprite && ( <pixiSprite
            texture={sprite.texture}
            x={position.current.x}
            y={position.current.y}
            anchor={{ x: 0.5, y: 0.5 }}
            />)
        }
    </pixiContainer>
  )
}

export default Hero