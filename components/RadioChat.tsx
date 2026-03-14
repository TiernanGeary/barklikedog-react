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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

    const fullMsg = replyTo
      ? `↩ ${replyTo.nickname}: ${replyTo.message.slice(0, 40)}${replyTo.message.length > 40 ? '…' : ''} → ${msg}`
      : msg

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    setOptimistic((prev) => [...prev, {
      _id: tempId,
      nickname: name,
      message: fullMsg,
      _createdAt: new Date().toISOString(),
    }])
    setInput('')
    setReplyTo(null)
    setSending(true)
    requestAnimationFrame(() => inputRef.current?.focus())

    try {
      await fetch('/api/radio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name, message: fullMsg }),
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
      <div className="radio-chat-header">
        <span>CHAT</span>
        {!nicknameSet ? (
          <form onSubmit={(e) => {
            e.preventDefault()
            const name = nickname.trim()
            if (name && name.split(/\s+/).length <= 2) {
              saveNickname(name)
              setNicknameSet(true)
            }
          }} className="radio-chat-header-form">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Set name..."
              className="radio-chat-header-input"
              maxLength={20}
              autoFocus
            />
          </form>
        ) : (
          <span
            className="radio-chat-name-tag"
            onClick={() => setNicknameSet(false)}
            title="Click to change name"
            style={{ color: avatarColor(nickname) }}
          >
            {nickname}
          </span>
        )}
      </div>
      <div className="radio-chat-messages">
        {allMessages.length === 0 && (
          <div className="radio-chat-empty">No messages yet</div>
        )}
        {allMessages.map((msg) => (
          <div
            key={msg._id}
            className="radio-chat-msg"
            onClick={() => {
              if (nicknameSet) {
                setReplyTo(msg)
                inputRef.current?.focus()
              }
            }}
          >
            <span className="radio-chat-author" style={{ color: avatarColor(msg.nickname) }}>
              {msg.nickname}
            </span>
            <span className="radio-chat-text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {replyTo && (
        <div className="radio-chat-reply-bar">
          <span className="radio-chat-reply-text">
            ↩ <strong style={{ color: avatarColor(replyTo.nickname) }}>{replyTo.nickname}</strong>{' '}
            {replyTo.message.slice(0, 50)}{replyTo.message.length > 50 ? '…' : ''}
          </span>
          <span className="radio-chat-reply-close" onClick={() => setReplyTo(null)}>✕</span>
        </div>
      )}
      <form onSubmit={nicknameSet ? handleSend : (e) => e.preventDefault()} className="radio-chat-form">
        {nicknameSet && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="radio-chat-input"
            maxLength={280}
            disabled={sending}
          />
        )}
        {!nicknameSet && (
          <span className="radio-chat-input-disabled">Set a name above to chat</span>
        )}
      </form>
    </div>
  )
}
