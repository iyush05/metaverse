import { Container, type Texture } from "pixi.js"
import { extend } from "@pixi/react"
import { DEFAULT_POS_X, DEFAULT_POS_Y, GAME_WORLD_WIDTH } from "../../constants/game-world"
import { useEffect, useRef } from "react"
import { useHeroControls } from "./useHeroControls"

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

    const { getControlsDirection } = useHeroControls();


    useEffect(() => {
        onMove(position.current.x, position.current.y)
    }, [onMove])

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