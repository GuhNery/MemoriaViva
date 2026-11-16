-- Memória Viva - alinhamento com telas do protótipo (etapa 2)
-- Alterações aditivas: preservam grupos, álbuns, usuários e arquivos existentes.
ALTER TABLE subgrupo ADD COLUMN IF NOT EXISTS foto_capa TEXT;
ALTER TABLE midia ADD COLUMN IF NOT EXISTS titulo VARCHAR(150);
ALTER TABLE midia ADD COLUMN IF NOT EXISTS local_lembranca VARCHAR(160);
ALTER TABLE midia ADD COLUMN IF NOT EXISTS historia TEXT;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS idade INTEGER CHECK (idade BETWEEN 0 AND 120);
