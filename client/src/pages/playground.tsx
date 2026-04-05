import { useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { calculateCanvasSize } from '../helpers/common'
import { Application, extend } from '@pixi/react'
import { Container } from 'pixi.js'
import MainContainer from '../components/MainContainer'
import type { OtherPlayers, PlayerPayload } from '../types/multiplayer'
import { socket } from '../services/socket'
import { ChatBox } from '../components/Chat/ChatBox'

extend({ Container })

export const Playground = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayers>({})
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

  useEffect(() => {
    if (!roomId) return;

    socket.connect();

    socket.emit("join-room", roomId, ({ players }: { players: OtherPlayers }) => {
      const others = { ...players };
      if (socket.id) {
        delete others[socket.id];
      }
      setOtherPlayers(others);
    })

    socket.on("player-joined", ({ id, ...state }: PlayerPayload) => {
      if (id === socket.id) return;
      setOtherPlayers((prev) => ({ ...prev, [id]: state }));
    });

    socket.on("player-moved", ({ id, ...state }: PlayerPayload) => {
      if (id === socket.id) return;
      setOtherPlayers((prev) => ({ ...prev, [id]: state }));
    });

    socket.on("player-left", ({ id }: { id: string}) => {
      setOtherPlayers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    return () => {
      socket.off("player-joined");
      socket.off("player-moved");
      socket.off("player-left");
      socket.emit("leave-room", roomId);
    } 
  }, [roomId])

  return (
    <>
      <Application width={canvasSize.width} height={canvasSize.height}>
        <MainContainer canvasSize={canvasSize} otherPlayers={otherPlayers} />
      </Application>
      <ChatBox />
    </>
  )
}

export default Playground