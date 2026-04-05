import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../services/socket';
import type { ChatMessage, SystemMessage } from '../../types/multiplayer';
import './ChatBox.css';

type Message = {
    id: string;
    text: string;
    isSystem?: boolean;
    senderId?: string;
};

export const ChatBox = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleChat = ({ id, text }: ChatMessage) => {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), text, senderId: id }]);
        };

        const handleSystem = ({ text, type }: SystemMessage) => {
            if (type === 'merge') {
                setMessages([{ id: crypto.randomUUID(), text, isSystem: true }]);
            } else {
                setMessages(prev => [...prev, { id: crypto.randomUUID(), text, isSystem: true }]);
            }
        };

        const handleGroupStatus = ({ inGroup }: { inGroup: boolean }) => {
            setIsVisible(inGroup);
            if (!inGroup) {
                setMessages([]);
            }
        };

        socket.on("chat-message", handleChat);
        socket.on("system-message", handleSystem);
        socket.on("group-status", handleGroupStatus);

        return () => {
            socket.off("chat-message", handleChat);
            socket.off("system-message", handleSystem);
            socket.off("group-status", handleGroupStatus);
        };
    }, []);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        socket.emit("send-chat", inputValue.trim());
        
        setMessages(prev => [...prev, { id: crypto.randomUUID(), text: inputValue.trim(), senderId: socket.id }]);
        
        setInputValue("");
    };

    if (!isVisible) return null;

    return (
        <div className="chatbox-container">
            <div className="chatbox-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`chatbox-message ${msg.isSystem ? 'system' : msg.senderId === socket.id ? 'self' : 'other'}`}>
                        {!msg.isSystem && <span className="chatbox-sender">{msg.senderId === socket.id ? "You" : `Player ${msg.senderId?.slice(0,4)}`}</span>}
                        <span className="chatbox-text">{msg.text}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form className="chatbox-input-form" onSubmit={handleSend}>
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Say something to nearby players..." 
                    className="chatbox-input"
                />
            </form>
        </div>
    );
};
