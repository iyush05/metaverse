import { Container, type Texture } from "pixi.js"
import { extend, useTick } from "@pixi/react"
import { DEFAULT_POS_X, DEFAULT_POS_Y, MOVE_SPEED } from "../../constants/game-world"
import { useCallback, useEffect, useRef } from "react"
import { useHeroControls } from "./useHeroControls"
import type { IPosition, Direction } from "../../types/common"
import { calculateNewTarget, checkCanMove, handleMovement } from "../../helpers/common"

extend({ Container })

interface IHeroProps {
    texture: Texture
    onMove: (gridX: number, gridY: number) => void
}
const Hero = ({
    texture,
    onMove
}: IHeroProps) => {
    const position = useRef({x: DEFAULT_POS_X, y: DEFAULT_POS_Y})
    const targetPosition = useRef<IPosition | null>(null);
    const currentDirection = useRef<Direction | null>(null);
    const { getControlsDirection } = useHeroControls();
    const direction = getControlsDirection();


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

            if (completed) {
                targetPosition.current = null;
            }
            
        }
    })

  return (
    <pixiContainer>
        <pixiSprite 
            texture={texture}
            x={position.current.x}
            y={position.current.y}
            scale={0.5}
            anchor={{ x: 1, y: 0.5 }}
        />
    </pixiContainer>
  )
}

export default Hero