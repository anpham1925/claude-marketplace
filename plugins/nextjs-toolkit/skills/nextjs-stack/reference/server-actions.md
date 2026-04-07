# Server Actions

## Defining Server Actions

```tsx
// lib/actions/user.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})

export async function updateProfile(formData: FormData) {
  // 1. Validate input (Server Actions are public endpoints!)
  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // 2. Auth check
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  // 3. Mutate
  await db.user.update({
    where: { id: session.userId },
    data: parsed.data,
  })

  // 4. Revalidate
  revalidatePath('/profile')
  return { success: true }
}
```

## Using in Forms

```tsx
// Progressive enhancement — works without JavaScript
import { updateProfile } from '@/lib/actions/user'

export default function ProfileForm({ user }: { user: User }) {
  return (
    <form action={updateProfile}>
      <input name="name" defaultValue={user.name} />
      <input name="email" defaultValue={user.email} />
      <SubmitButton />
    </form>
  )
}
```

## Pending States with useActionState

```tsx
'use client'
import { useActionState } from 'react'
import { updateProfile } from '@/lib/actions/user'

export function ProfileForm({ user }: { user: User }) {
  const [state, action, isPending] = useActionState(updateProfile, null)

  return (
    <form action={action}>
      <input name="name" defaultValue={user.name} />
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <button disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

## Optimistic Updates

```tsx
'use client'
import { useOptimistic } from 'react'

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  )

  async function addTodo(formData: FormData) {
    const todo = { id: crypto.randomUUID(), text: formData.get('text') as string }
    addOptimistic(todo)
    await createTodo(formData)
  }

  return (
    <form action={addTodo}>
      <input name="text" />
      <ul>{optimisticTodos.map(t => <li key={t.id}>{t.text}</li>)}</ul>
    </form>
  )
}
```

## Rules

- Always `'use server'` at top of file or inside function
- Always validate input — Server Actions are public HTTP endpoints
- Always check auth/authorization
- Revalidate affected paths/tags after mutation
- Return serializable values only (no classes, functions, or Dates)
- Use `redirect()` for navigation after mutation (throws, so call last)
