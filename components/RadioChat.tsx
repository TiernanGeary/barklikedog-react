'use client'

import { useState, useRef, useEffect } from 'react'
import { avatarColor } from '@/lib/sanity'

interface ChatMessage {
  _id: string
  nickname: string
  message: string
  _createdAt: string
}

interface Props {
  messages: ChatMessage[]
}

const NICKNAME_KEY = 'radio-chat-nickname'

export default function RadioChat({ messages }: Props) {
  const [nickname, setNickname] = useState('')
  const [nicknameSet, setNicknameSet] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load saved nickname
  useEffect(() => {
    const saved = localStorage.getItem(NICKNAME_KEY)
    if (saved) {
      setNickname(saved)
      setNicknameSet(true)
    }
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSetNickname(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) return
    const name = nickname.trim().slice(0, 20)
    setNickname(name)
    setNicknameSet(true)
    localStorage.setItem(NICKNAME_KEY, name)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    try {
      await fetch('/api/radio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, message: input.trim().slice(0, 280) }),
      })
      setInput('')
    } catch {
      // Silent fail
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateStr: string) {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  if (!nicknameSet) {
    return (
      <div className="radio-chat">
        <div className="radio-chat-header">CHAT</div>
        <form onSubmit={handleSetNickname} className="radio-chat-nickname-form">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Pick a nickname..."
            className="radio-chat-input"
            maxLength={20}
            autoFocus
          />
          <button type="submit" disabled={!nickname.trim()} className="radio-chat-send">
            Join
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="radio-chat">
      <div className="radio-chat-header">
        CHAT
        <span
          className="radio-chat-nick-display"
          onClick={() => { setNicknameSet(false) }}
          title="Click to change nickname"
        >
          {nickname}
        </span>
      </div>
      <div className="radio-chat-messages">
        {messages.length === 0 && (
          <div className="radio-chat-empty">No messages yet</div>
        )}
        {messages.map((msg) => (
          <div key={msg._id} className="radio-chat-msg">
            <span className="radio-chat-time">{formatTime(msg._createdAt)}</span>
            <span className="radio-chat-author" style={{ color: avatarColor(msg.nickname) }}>
              {msg.nickname}
            </span>
            <span className="radio-chat-text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="radio-chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          className="radio-chat-input"
          maxLength={280}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()} className="radio-chat-send">
          Send
        </button>
      </form>
    </div>
  )
}
