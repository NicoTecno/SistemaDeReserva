import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
    
    // Si hay error, lo imprimimos en la terminal donde corre npm run dev
    console.error('Error de Supabase Auth:', error.message)
  }

  // Si llegamos acá, algo falló. Volvemos al inicio para reintentar.
  return NextResponse.redirect(`${origin}/`)
}