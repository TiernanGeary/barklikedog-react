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
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(NICKNAME_KEY)
    if (saved) {
      setNickname(saved)
      setNicknameSet(true)
    }
  }, [])

  // Clear optimistic messages once they appear in server data
  useEffect(() => {
    if (optimistic.length > 0) {
      setOptimistic((prev) => prev.filter((opt) =>
        !messages.some((m) => m.nickname === opt.nickname && m.message === opt.message)
      ))
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, optimistic])

  function saveNickname(name: string) {
    setNickname(name)
    if (name.trim()) localStorage.setItem(NICKNAME_KEY, name.trim())
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const name = nickname.trim().slice(0, 20)
    const msg = input.trim().slice(0, 280)
    if (!name || !msg || sending) return
    if (name.split(/\s+/).length > 2) return
    if (msg.split(/\s+/).length > 50) return

    saveNickname(name)

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    setOptimistic((prev) => [...prev, {
      _id: tempId,
      nickname: name,
      message: msg,
      _createdAt: new Date().toISOString(),
    }])
    setInput('')
    setSending(true)

    try {
      await fetch('/api/radio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name, message: msg }),
      })
    } catch {
      // Remove optimistic on failure
      setOptimistic((prev) => prev.filter((m) => m._id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const allMessages = [...messages, ...optimistic]

  return (
    <div className="radio-chat">
      <div className="radio-chat-header">CHAT</div>
      <div className="radio-chat-messages">
        {allMessages.length === 0 && (
          <div className="radio-chat-empty">No messages yet</div>
        )}
        {allMessages.map((msg) => (
          <div key={msg._id} className="radio-chat-msg">
            <span className="radio-chat-author" style={{ color: avatarColor(msg.nickname) }}>
              {msg.nickname}
            </span>
            <span className="radio-chat-text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {!nicknameSet ? (
        <form onSubmit={(e) => {
          e.preventDefault()
          const name = nickname.trim()
          if (name && name.split(/\s+/).length <= 2) {
            saveNickname(name)
            setNicknameSet(true)
          }
        }} className="radio-chat-form">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Choose a name to chat..."
            className="radio-chat-input"
            maxLength={20}
            autoFocus
          />
        </form>
      ) : (
        <form onSubmit={handleSend} className="radio-chat-form">
          <span
            className="radio-chat-name-tag"
            onClick={() => setNicknameSet(false)}
            title="Click to change name"
            style={{ color: avatarColor(nickname) }}
          >
            {nickname}
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="radio-chat-input"
            maxLength={280}
            disabled={sending}
          />
        </form>
      )}
    </div>
  )
}
