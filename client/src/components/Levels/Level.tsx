import { extend } from "@pixi/react"
import { Assets, Sprite, Texture } from "pixi.js"
import { useState, useEffect } from "react"
import levelAsset from "../../assets/tile-map.png"
import { GAME_WORLD_HEIGHT, GAME_WORLD_WIDTH, OFFSET_X, OFFSET_Y } from "../../constants/game-world"

extend({ Sprite })

export const Level = () => {
    const [texture, setTexture] = useState<Texture | null>(null)

    useEffect(() => {
        Assets.load(levelAsset).then((loadedTexture) => {
            setTexture(loadedTexture)
        })
    }, [])

    if (!texture) return null

    return (
        <pixiSprite
            texture={texture}
            width={GAME_WORLD_WIDTH}
            height={GAME_WORLD_HEIGHT}
            x={OFFSET_X}
            y={OFFSET_Y}
        />
    )
}

export default Level