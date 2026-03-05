'use client';

import { useState, useCallback, useRef } from 'react';

interface CommentInputProps {
  taskId: string;
  onCommentAdded: () => void;
}

export function CommentInput({ taskId, onCommentAdded }: CommentInputProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      setText('');
      onCommentAdded();
    } catch {
      // Toast handled by caller
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  }, [text, taskId, onCommentAdded]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="comment-input">
      <textarea
        ref={textareaRef}
        className="comment-input__textarea"
        placeholder="Add a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitting}
        rows={1}
      />
      <div className="comment-input__actions">
        <span className="comment-input__hint">Cmd+Enter to submit</span>
        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
        >
          {submitting ? 'Sending...' : 'Comment'}
        </button>
      </div>
    </div>
  );
}
