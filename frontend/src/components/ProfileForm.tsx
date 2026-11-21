import { useState, type FormEvent } from 'react'
import { ApiError, type ProfileInput } from '../api/profiles.ts'

interface ProfileFormProps {
  initialValues?: ProfileInput
  submitLabel: string
  onSubmit: (values: ProfileInput) => Promise<void>
}

/** Shared form for creating and editing a profile. */
export function ProfileForm({ initialValues, submitLabel, onSubmit }: ProfileFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      await onSubmit({ name: name.trim(), description: description.trim() })
    } catch (error) {
      setErrors(error instanceof ApiError ? error.messages : ['Something went wrong.'])
      setSubmitting(false)
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <ul className="errors" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <label>
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={3}
          maxLength={100}
          required
        />
      </label>

      <label>
        What are you looking for?
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={1000}
          required
        />
      </label>

      <button type="submit" className="button" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
