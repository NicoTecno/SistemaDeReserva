'use client'

import { createClient } from "@/utils/supabase/client"

export default function Home() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">Sistema de Reservas</h1>
      <button 
        onClick={handleLogin}
        className="px-8 py-4 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-3 font-medium text-gray-700"
      >
        <span>Continuar con Google</span>
      </button>
    </main>
  )
}