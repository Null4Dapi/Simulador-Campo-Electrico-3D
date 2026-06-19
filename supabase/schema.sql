-- Schema for CampoElectrico (Inferred from code)

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso anónimo (dado que la app usa session_id sin auth completo)
CREATE POLICY "Anon users can insert messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anon users can read messages"
    ON public.chat_messages FOR SELECT
    USING (true);
