import { redirect } from 'next/navigation'

// MNI is invite-only: credentials are provisioned by MNI administration.
export default function SignupPage() {
  redirect('/login-help')
}
