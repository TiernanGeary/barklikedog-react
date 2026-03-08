'use client'

import { useState } from 'react'
import type { WPComment } from '@/lib/types'
import { avatarColor, formatRelativeTime, postComment } from '@/lib/wordpress'

interface Props {
  comments: WPComment[]
  postId: number
}

export default function Comments({ comments, postId }: Props) {
  // Build comment tree (top-level + nested)
  const topLevel = comments.filter(c => c.parent === 0)
  const children = comments.filter(c => c.parent !== 0)

  return (
    <section className="comments-area">
      <h2 className="comments-title">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h2>

      {topLevel.length > 0 && (
        <ol className="comment-list">
          {topLevel.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={children.filter(c => c.parent === comment.id)}
              allComments={children}
            />
          ))}
        </ol>
      )}

      <CommentForm postId={postId} />
    </section>
  )
}

function CommentItem({
  comment,
  replies,
  allComments,
}: {
  comment: WPComment
  replies: WPComment[]
  allComments: WPComment[]
}) {
  const [open, setOpen] = useState(false)
  const color = avatarColor(comment.author_name)
  const time  = formatRelativeTime(comment.date)

  return (
    <li id={`comment-${comment.id}`} className="comment">
      <div className="comment-body">
        <div className="comment-row">
          <div className="comment-avatar" style={{ backgroundColor: color }} />
          <div className="comment-main">
            <div className="comment-meta">
              <span className="comment-author-name">{comment.author_name}</span>
              <span className="comment-time">{time}</span>
            </div>
            {comment.status === 'hold' && (
              <p className="comment-awaiting-moderation">Awaiting moderation</p>
            )}
            <div
              className="comment-content"
              dangerouslySetInnerHTML={{ __html: comment.content.rendered }}
            />
          </div>
        </div>

        {replies.length > 0 && (
          <>
            <button
              className="view-replies-btn"
              onClick={() => setOpen(o => !o)}
            >
              {open
                ? 'hide replies'
                : `view ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            </button>

            {open && (
              <ol className={`children replies-open`}>
                {replies.map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    replies={allComments.filter(c => c.parent === reply.id)}
                    allComments={allComments}
                  />
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </li>
  )
}

function CommentForm({ postId }: { postId: number }) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus]   = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      await postComment({ post: postId, author_name: name, author_email: email, content })
      setStatus('done')
      setName('')
      setEmail('')
      setContent('')
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'done') {
    return (
      <p style={{ marginTop: '40px', fontSize: '12px' }}>
        Comment submitted — it will appear after moderation.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '40px' }}>
      <h3 style={{ fontSize: '11px', letterSpacing: '0.12em', marginBottom: '20px' }}>
        Leave a Reply
      </h3>

      {status === 'error' && (
        <p style={{ color: '#ff3700', fontSize: '12px', marginBottom: '10px' }}>
          {errorMsg}
        </p>
      )}

      <div className="form-row">
        <label htmlFor="comment-name">Name *</label>
        <input
          id="comment-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="comment-email">Email *</label>
        <input
          id="comment-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="comment-content">Comment *</label>
        <textarea
          id="comment-content"
          rows={5}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="button" disabled={status === 'sending'}>
        {status === 'sending' ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  )
}
