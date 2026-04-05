import { useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { calculateCanvasSize } from '../helpers/common'
import { Application, extend } from '@pixi/react'
import { Container } from 'pixi.js'
import MainContainer from '../components/MainContainer'

extend({ Container })

export const Playground = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const [canvasSize, setCanvasSize] = useState(calculateCanvasSize());

  const updateCanvasSize = useCallback(() => {
    setCanvasSize(calculateCanvasSize());
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [updateCanvasSize]);

  return (
    <>
      <Application width={canvasSize.width} height={canvasSize.height}>
        <MainContainer canvasSize={canvasSize} />
      </Application>
    </>
  )
}

export default Playground