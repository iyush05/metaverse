import { useRef, type PropsWithChildren, type MutableRefObject } from "react"
import type { IPosition } from "../../types/common"
import type { Graphics } from "pixi.js"
import { TILE_SIZE, ZOOM } from "../../constants/game-world"
import { useTick } from "@pixi/react"
import { lerp } from "../../helpers/common"

interface ICameraProps {
    heroPixelPosition: MutableRefObject<IPosition>
    canvasSize: { width: number, height: number }
}

export const Camera = ({ canvasSize, heroPixelPosition, children }: PropsWithChildren<ICameraProps>) => {
    const containerRef = useRef<Graphics>(null);

    const cameraPosition = useRef<IPosition>({ x: canvasSize.width / 2, y: canvasSize.height / 2 })

    useTick(() => {
        if(containerRef.current) {
            const targetX = canvasSize.width / 2 - heroPixelPosition.current.x * ZOOM - TILE_SIZE;
            const targetY = canvasSize.height / 2 - heroPixelPosition.current.y * ZOOM - TILE_SIZE;

            cameraPosition.current.x = lerp(cameraPosition.current.x, targetX);
            cameraPosition.current.y = lerp(cameraPosition.current.y, targetY);

            containerRef.current.x = cameraPosition.current.x;
            containerRef.current.y = cameraPosition.current.y;
        }
    })
    return (
        <pixiContainer ref={containerRef} scale={ZOOM}>
            {children}
        </pixiContainer>
    )
}