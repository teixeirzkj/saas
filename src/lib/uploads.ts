import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Upload de imagens com dois modos, escolhidos automaticamente:
 *
 *  - **Produção (Vercel)**: se `BLOB_READ_WRITE_TOKEN` existir (ativado ao ligar
 *    "Blob" no dashboard da Vercel — Storage → Create Database → Blob), grava no
 *    Vercel Blob e devolve uma URL pública em CDN. É o modo real de produção:
 *    o filesystem do Vercel é somente leitura fora de /tmp, então escrever em
 *    `public/uploads` quebraria silenciosamente ali.
 *  - **Dev local**: sem esse token, grava em `public/uploads/<pasta>/`, servido
 *    direto pelo Next — zero configuração extra pra rodar `npm run dev`.
 *
 * Não é uma server action (sem 'use server' no topo do arquivo): recebe o File
 * já validado por quem chama, dentro de uma action que passou por
 * requireBusiness() — nunca é exposto diretamente ao cliente.
 */

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export type UploadResult = { url: string } | { error: string };

function usesBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveUploadedImage(file: File | null, folder: string): Promise<UploadResult> {
  if (!file || file.size === 0) return { error: 'Nenhum arquivo enviado.' };

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) return { error: 'Formato não suportado. Envie uma imagem JPG, PNG, WEBP ou GIF.' };

  if (file.size > MAX_SIZE_BYTES) return { error: 'A imagem precisa ter até 5MB.' };

  // Nome de pasta seguro: só letras, números, hífen (evita path traversal)
  const safeFolder = folder.replace(/[^a-zA-Z0-9-]/g, '');
  const filename = `${randomUUID()}.${extension}`;

  if (usesBlobStorage()) {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(`${safeFolder}/${filename}`, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      return { url: blob.url };
    } catch (err) {
      console.error('[uploads] falha ao gravar no Vercel Blob:', err);
      return { error: 'Não foi possível enviar a imagem agora. Tente novamente em instantes.' };
    }
  }

  try {
    const dir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    return { url: `/uploads/${safeFolder}/${filename}` };
  } catch (err) {
    console.error('[uploads] falha ao gravar no disco local:', err);
    return {
      error:
        'Não foi possível salvar a imagem neste ambiente. Em produção, ative o Vercel Blob (Storage → Create Database → Blob) ou cole um link de imagem já hospedada.',
    };
  }
}

/** Remove um upload anterior quando o campo é trocado (best-effort, nunca derruba a request). */
export async function deleteUploadedImage(url: string | null | undefined) {
  if (!url) return;

  if (usesBlobStorage() && url.includes('.blob.vercel-storage.com')) {
    try {
      const { del } = await import('@vercel/blob');
      await del(url);
    } catch {
      // best-effort — nunca falha a request principal por causa de uma limpeza
    }
    return;
  }

  if (!url.startsWith('/uploads/')) return;
  try {
    await unlink(path.join(process.cwd(), 'public', url));
  } catch {
    // arquivo já não existe ou nunca foi um upload local (ex.: link colado) — ignora
  }
}
