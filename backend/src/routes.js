const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pool, query } = require('./db');
const { authenticate, requireFamilyMember } = require('./middleware');

const router = express.Router();
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 12).replace(/[^.a-zA-Z0-9]/g, '');
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});
const maxUploadMb = Math.max(1, Number(process.env.MAX_UPLOAD_MB || 25));
const upload = multer({
  storage,
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime|webm)|audio\/(mpeg|mp4|wav|x-wav|aac|ogg|webm)|application\/pdf)$/i;
    if (allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error('Formato não permitido. Envie imagem, vídeo, áudio ou PDF.'));
  },
});

// Links temporários de mídia não incluem o JWT de autenticação do usuário.
const fileExpirySeconds = 10 * 60;
function signedFileUrl(kind, id, viewerId) {
  const expires = Math.floor(Date.now() / 1000) + fileExpirySeconds;
  const payload = `${kind}:${id}:${viewerId}:${expires}`;
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(payload).digest('hex');
  return `/api/files/${kind}/${id}?viewer=${viewerId}&expires=${expires}&sig=${signature}`;
}
const asId = (value) => String(value);
const publicUser = (u) => ({
  id: asId(u.id_usuario),
  name: u.nome,
  email: u.email,
  photoUrl: u.foto_perfil ? signedFileUrl('avatar', u.id_usuario, u.id_usuario) : null,
  createdAt: u.data_criacao,
});
const publicFamily = (f, viewerId) => ({
  id: asId(f.id_grupo),
  name: f.nome,
  description: f.descricao || '',
  photoUrl: f.foto_grupo && viewerId ? signedFileUrl('group', f.id_grupo, viewerId) : null,
  createdAt: f.data_criacao,
});
const publicMember = (row) => ({
  id: asId(row.id_participante_grupo),
  userId: asId(row.id_usuario),
  permission: row.permissao,
  joinedAt: row.data_entrada,
  user: { id: asId(row.id_usuario), name: row.nome, email: row.email,
    photoUrl: row.foto_perfil ? signedFileUrl('avatar', row.id_usuario, row.id_usuario) : null },
});
const mediaType = (mime = '') => mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'file';
const publicMedia = (m, viewerId) => ({
  id: asId(m.id_midia),
  authorId: asId(m.id_usuario),
  title: m.titulo || m.descricao || path.basename(m.arquivo),
  caption: m.descricao || '',
  place: m.local_lembranca || '',
  story: m.historia || '',
  url: signedFileUrl('media', m.id_midia, viewerId),
  type: m.tipo_midia,
  createdAt: m.data_upload,
  memoryDate: m.data_lembranca
    ? (m.data_lembranca.toISOString ? m.data_lembranca.toISOString().slice(0, 10) : String(m.data_lembranca).slice(0, 10))
    : null,
});
const publicComment = (c) => ({
  id: asId(c.id_comentario),
  body: c.conteudo,
  createdAt: c.data_criacao,
  user: { id: asId(c.id_usuario), name: c.nome, email: c.email },
});

function signToken(user) {
  return jwt.sign({ sub: String(user.id_usuario) }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function listFamiliesForUser(userId) {
  const result = await query(
    `SELECT g.* FROM grupo g
     JOIN participante_grupo pg ON pg.id_grupo = g.id_grupo
     WHERE pg.id_usuario = $1 ORDER BY g.data_criacao DESC`,
    [userId],
  );
  return result.rows.map((row) => publicFamily(row, userId));
}

async function assertChapterAccess(chapterId, userId) {
  const result = await query(
    `SELECT s.*, g.id_admin,
       pg.permissao AS family_permission
     FROM subgrupo s
     JOIN participante_grupo pg ON pg.id_grupo=s.id_grupo AND pg.id_usuario=$2
     JOIN grupo g ON g.id_grupo=s.id_grupo
     WHERE s.id_subgrupo=$1`,
    [chapterId, userId],
  );
  if (!result.rowCount) return null;
  // Todos os integrantes do grupo acessam os álbuns do grupo; não existem álbuns públicos.
  return result.rows[0];
}

async function getChapter(chapterId, userId) {
  const base = await assertChapterAccess(chapterId, userId);
  if (!base) return null;
  const [members, media, comments] = await Promise.all([
    query(
      `SELECT pg.id_usuario FROM participante_grupo pg
       WHERE pg.id_grupo=$1 ORDER BY pg.data_entrada`, [base.id_grupo]),
    query('SELECT * FROM midia WHERE id_subgrupo=$1 ORDER BY data_lembranca DESC NULLS LAST, data_upload DESC', [chapterId]),
    query(
      `SELECT c.*, u.nome, u.email FROM comentario c JOIN usuario u ON u.id_usuario=c.id_usuario
       WHERE c.id_subgrupo=$1 ORDER BY c.data_criacao ASC`, [chapterId]),
  ]);
  return {
    id: asId(base.id_subgrupo),
    familyId: asId(base.id_grupo),
    title: base.nome,
    description: base.descricao || '',
    coverUrl: base.foto_capa ? signedFileUrl('album', base.id_subgrupo, userId) : null,
    eventDate: base.data_evento ? (base.data_evento.toISOString ? base.data_evento.toISOString().slice(0, 10) : String(base.data_evento).slice(0, 10)) : null,
    visibility: base.visibilidade,
    createdAt: base.data_criacao,
    createdBy: asId(base.id_criador),
    memberIds: members.rows.map((r) => asId(r.id_usuario)),
    media: media.rows.map((m) => publicMedia(m, userId)),
    comments: comments.rows.map(publicComment),
  };
}

async function familyPayload(familyId, userId) {
  const familyResult = await query('SELECT * FROM grupo WHERE id_grupo=$1', [familyId]);
  if (!familyResult.rowCount) return null;
  const membersResult = await query(
    `SELECT pg.id_participante_grupo, pg.id_usuario, pg.permissao, pg.data_entrada,
            u.nome, u.email, u.foto_perfil
     FROM participante_grupo pg JOIN usuario u ON u.id_usuario=pg.id_usuario
     WHERE pg.id_grupo=$1 ORDER BY pg.data_entrada, u.nome`, [familyId]);
  const chapterIds = await query(
    `SELECT id_subgrupo FROM subgrupo
     WHERE id_grupo=$1 ORDER BY data_criacao DESC`, [familyId]);
  const chapters = [];
  for (const row of chapterIds.rows) {
    const chapter = await getChapter(row.id_subgrupo, userId);
    if (chapter) chapters.push(chapter);
  }
  return {
    family: publicFamily(familyResult.rows[0], userId),
    members: membersResult.rows.map(publicMember),
    chapters,
  };
}

// Arquivos privados: cada URL tem assinatura temporária e permissão revalidada.
router.get('/api/files/:kind/:id', async (req, res, next) => {
  const { kind } = req.params;
  const id = Number(req.params.id);
  const viewer = Number(req.query.viewer);
  const expires = Number(req.query.expires);
  const signature = String(req.query.sig || '');
  const now = Math.floor(Date.now() / 1000);
  const validSignature = new RegExp('^[a-f0-9]{64}$').test(signature);
  if (!['media', 'avatar', 'group', 'album'].includes(kind) ||
      !Number.isSafeInteger(id) || id < 1 ||
      !Number.isSafeInteger(viewer) || viewer < 1 ||
      !Number.isSafeInteger(expires) ||
      expires < now || expires > now + fileExpirySeconds ||
      !validSignature) {
    return res.status(404).json({ error: { message: 'Arquivo indisponível.' } });
  }
  const payload = `${kind}:${id}:${viewer}:${expires}`;
  const expected = crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(payload).digest();
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expected)) {
    return res.status(404).json({ error: { message: 'Arquivo indisponível.' } });
  }
  try {
    let result;
    if (kind === 'media') {
      result = await query(
        `SELECT m.arquivo FROM midia m
         JOIN subgrupo s ON s.id_subgrupo=m.id_subgrupo
         JOIN participante_grupo pg ON pg.id_grupo=s.id_grupo AND pg.id_usuario=$2
         WHERE m.id_midia=$1`, [id, viewer],
      );
    } else if (kind === 'group') {
      result = await query(
        `SELECT g.foto_grupo AS arquivo FROM grupo g
         JOIN participante_grupo pg ON pg.id_grupo=g.id_grupo AND pg.id_usuario=$2
         WHERE g.id_grupo=$1`, [id, viewer]
      );
    } else if (kind === 'album') {
      result = await query(
        `SELECT s.foto_capa AS arquivo FROM subgrupo s
         JOIN participante_grupo pg ON pg.id_grupo=s.id_grupo AND pg.id_usuario=$2
         WHERE s.id_subgrupo=$1`, [id, viewer]
      );
    } else {
      result = await query(
        'SELECT foto_perfil AS arquivo FROM usuario WHERE id_usuario=$1 AND id_usuario=$2',
        [id, viewer],
      );
    }
    const stored = result.rows[0]?.arquivo;
    if (!stored || !stored.startsWith('/uploads/')) {
      return res.status(404).json({ error: { message: 'Arquivo não encontrado.' } });
    }
    return res.sendFile(path.basename(stored), {
      root: uploadsDir,
      headers: { 'Cache-Control': 'private, max-age=60' },
    }, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: { message: 'Arquivo indisponível neste servidor.' } });
      }
    });
  } catch (err) { next(err); }
});

// Health check
router.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', service: 'memoria-viva-api', database: 'connected' });
  } catch (_err) {
    res.status(503).json({ status: 'error', service: 'memoria-viva-api', database: 'disconnected' });
  }
});

// Authentication
router.post('/api/auth/register', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: { message: 'Informe seu nome (de 2 a 100 caracteres).' } });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) return res.status(400).json({ error: { message: 'Informe um e-mail válido.' } });
  if (password.length < 6 || password.length > 100) return res.status(400).json({ error: { message: 'A senha deve ter entre 6 e 100 caracteres.' } });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT 1 FROM usuario WHERE LOWER(email)=LOWER($1)', [email]);
    if (exists.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: { message: 'Este e-mail já está cadastrado.' } });
    }
    const hash = await bcrypt.hash(password, 12);
    const inserted = await client.query(
      'INSERT INTO usuario (nome,email,senha) VALUES ($1,$2,$3) RETURNING id_usuario,nome,email,foto_perfil,data_criacao',
      [name, email, hash],
    );
    const user = inserted.rows[0];
    // Convites são aceitos explicitamente pelo usuário, nunca durante o cadastro.
    await client.query('COMMIT');
    res.status(201).json({ token: signToken(user), user: publicUser(user), families: await listFamiliesForUser(user.id_usuario) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally { client.release(); }
});

router.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const result = await query('SELECT * FROM usuario WHERE LOWER(email)=LOWER($1)', [email]);
    if (!result.rowCount || !(await bcrypt.compare(password, result.rows[0].senha))) {
      return res.status(401).json({ error: { message: 'E-mail ou senha incorretos.' } });
    }
    const user = result.rows[0];
    res.json({ token: signToken(user), user: publicUser(user), families: await listFamiliesForUser(user.id_usuario) });
  } catch (err) { next(err); }
});

router.get('/api/auth/me', authenticate, async (req, res, next) => {
  try { res.json({ user: publicUser(req.user), families: await listFamiliesForUser(req.user.id_usuario) }); }
  catch (err) { next(err); }
});
router.post('/api/auth/logout', authenticate, (_req, res) => res.status(204).end());

router.patch('/api/auth/profile', authenticate, async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: { message: 'O nome deve ter entre 2 e 100 caracteres.' },
    });
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 150
  ) {
    return res.status(400).json({
      error: { message: 'Informe um e-mail válido.' },
    });
  }

  try {
    const duplicate = await query(
      `SELECT id_usuario FROM usuario
       WHERE LOWER(email) = LOWER($1) AND id_usuario <> $2`,
      [email, req.user.id_usuario],
    );

    if (duplicate.rowCount) {
      return res.status(409).json({
        error: { message: 'Este e-mail já está sendo utilizado.' },
      });
    }

    const result = await query(
      `UPDATE usuario
       SET nome = $1, email = $2
       WHERE id_usuario = $3
       RETURNING id_usuario, nome, email, foto_perfil, data_criacao`,
      [name, email, req.user.id_usuario],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        error: { message: 'Usuário não encontrado.' },
      });
    }

    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: { message: 'Este e-mail já está sendo utilizado.' },
      });
    }
    next(err);
  }
});

router.post('/api/auth/profile/photo', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({
        error: {
          message:
            err.code === 'LIMIT_FILE_SIZE'
              ? `A imagem excede o limite de ${maxUploadMb} MB.`
              : err.message,
        },
      });
    }
    next();
  });
}, async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: { message: 'Selecione uma foto.' },
    });
  }

  try {
    const photoUrl = `/uploads/${req.file.filename}`;

    const result = await query(
      `UPDATE usuario
       SET foto_perfil = $1
       WHERE id_usuario = $2
       RETURNING id_usuario, nome, email, foto_perfil, data_criacao`,
      [photoUrl, req.user.id_usuario],
    );

    if (!result.rowCount) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({
        error: { message: 'Usuário não encontrado.' },
      });
    }

    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    next(err);
  }
});

router.post('/api/auth/forgot-password', async (_req, res) => {
  // Mensagem genérica para não revelar se o e-mail está cadastrado.
  // O envio real de e-mail exige configurar um provedor SMTP/transacional.
  res.json({ message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.' });
});

// Families/groups
router.post('/api/families', authenticate, async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: { message: 'O nome da família deve ter de 2 a 100 caracteres.' } });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = await client.query(
      'INSERT INTO grupo (nome,descricao,id_admin) VALUES ($1,$2,$3) RETURNING *',
      [name, description || null, req.user.id_usuario],
    );
    const family = created.rows[0];
    await client.query("INSERT INTO participante_grupo (id_usuario,id_grupo,permissao) VALUES ($1,$2,'admin')", [req.user.id_usuario, family.id_grupo]);
    await client.query('COMMIT');
    res.status(201).json({ family: publicFamily(family, req.user.id_usuario) });
  } catch (err) { await client.query('ROLLBACK').catch(() => {}); next(err); }
  finally { client.release(); }
});

router.get('/api/families/:id', authenticate, requireFamilyMember, async (req, res, next) => {
  try {
    const data = await familyPayload(req.familyId, req.user.id_usuario);
    if (!data) return res.status(404).json({ error: { message: 'Família não encontrada.' } });
    res.json(data);
  } catch (err) { next(err); }
});

router.patch('/api/families/:id', authenticate, requireFamilyMember, async (req, res, next) => {
  if (req.familyPermission !== 'admin' && Number(req.familyAdminId) !== Number(req.user.id_usuario)) {
    return res.status(403).json({ error: { message: 'Somente administradores podem alterar a família.' } });
  }
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: { message: 'O nome da família deve ter de 2 a 100 caracteres.' } });
  try {
    const result = await query('UPDATE grupo SET nome=$1, descricao=$2 WHERE id_grupo=$3 RETURNING *', [name, description || null, req.familyId]);
    res.json({ family: publicFamily(result.rows[0], req.user.id_usuario) });
  } catch (err) { next(err); }
});

// O administrador escolhe o destino das mídias antes de retirar alguém do grupo.
router.delete('/api/families/:familyId/members/:userId', authenticate, requireFamilyMember, async (req, res, next) => {
  if (req.familyPermission !== 'admin' && Number(req.familyAdminId) !== Number(req.user.id_usuario)) {
    return res.status(403).json({ error: { message: 'Somente administradores podem remover integrantes.' } });
  }
  const targetId=Number(req.params.userId);
  const deleteMedia=req.body?.deleteMedia === true;
  if(!Number.isSafeInteger(targetId)||targetId<1) {
    return res.status(400).json({error:{message:'Integrante inválido.'}});
  }
  if(targetId===Number(req.familyAdminId)||targetId===Number(req.user.id_usuario)) {
    return res.status(403).json({error:{message:'O administrador não pode remover sua própria conta do grupo.'}});
  }
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const member=await client.query(
      `SELECT permissao FROM participante_grupo WHERE id_grupo=$1 AND id_usuario=$2 FOR UPDATE`,
      [req.familyId,targetId]
    );
    if(!member.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({error:{message:'Participante não encontrado no grupo.'}});
    }
    if(member.rows[0].permissao==='admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({error:{message:'Não é possível remover outro administrador.'}});
    }
    let files=[];
    if(deleteMedia) {
      const existing=await client.query(
        `SELECT m.arquivo FROM midia m JOIN subgrupo s ON s.id_subgrupo=m.id_subgrupo
         WHERE s.id_grupo=$1 AND m.id_usuario=$2`,[req.familyId,targetId]
      );
      files=existing.rows.map(row=>row.arquivo);
      await client.query(
        `DELETE FROM midia m USING subgrupo s
         WHERE m.id_subgrupo=s.id_subgrupo AND s.id_grupo=$1 AND m.id_usuario=$2`,
        [req.familyId,targetId]
      );
    }
    await client.query(
      `DELETE FROM participante_subgrupo ps USING subgrupo s
       WHERE ps.id_subgrupo=s.id_subgrupo AND s.id_grupo=$1 AND ps.id_usuario=$2`,
      [req.familyId,targetId]
    );
    await client.query('DELETE FROM participante_grupo WHERE id_grupo=$1 AND id_usuario=$2',
      [req.familyId,targetId]);
    await client.query('COMMIT');
    for(const file of files) {
      if(file?.startsWith('/uploads/')) {
        await fs.promises.unlink(path.join(uploadsDir,path.basename(file))).catch(()=>{});
      }
    }
    res.json({message:deleteMedia?
      'Participante removido. As mídias dele neste grupo foram excluídas.':
      'Participante removido. As mídias dele foram preservadas neste grupo.'
    });
  }catch(err) {
    await client.query('ROLLBACK').catch(()=>{});
    next(err);
  }finally { client.release(); }
});

// Convites privados: criar pendência não concede acesso ao grupo.
router.post('/api/families/:familyId/members/invite', authenticate, requireFamilyMember, async (req, res, next) => {
  if (req.familyPermission !== 'admin' && Number(req.familyAdminId) !== Number(req.user.id_usuario)) {
    return res.status(403).json({ error: { message: 'Somente administradores podem convidar pessoas.' } });
  }
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    return res.status(400).json({ error: { message: 'Informe um e-mail válido.' } });
  }
  if (email === String(req.user.email).toLowerCase()) {
    return res.status(400).json({ error: { message: 'Você já participa deste grupo.' } });
  }
  try {
    const alreadyMember = await query(
      `SELECT 1 FROM participante_grupo pg JOIN usuario u ON u.id_usuario=pg.id_usuario
       WHERE pg.id_grupo=$1 AND LOWER(u.email)=LOWER($2)`, [req.familyId,email]
    );
    if (alreadyMember.rowCount) {
      return res.status(409).json({ error: { message: 'Esta pessoa já participa do grupo.' } });
    }
    await query(
      `INSERT INTO convite_grupo (email,id_grupo,id_convidante,status) VALUES ($1,$2,$3,'pending')
       ON CONFLICT (email,id_grupo) DO UPDATE
       SET id_convidante=EXCLUDED.id_convidante,status='pending',data_criacao=CURRENT_TIMESTAMP`,
      [email,req.familyId,req.user.id_usuario]
    );
    res.status(201).json({
      message: 'Convite registrado. A pessoa poderá aceitá-lo em Meus grupos ao entrar com esse e-mail. O envio externo de e-mail ainda não está habilitado.'
    });
  } catch (err) { next(err); }
});

// Convites só são exibidos ao titular autenticado do endereço de e-mail.
router.get('/api/invitations', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.id_convite, c.data_criacao, g.id_grupo, g.nome
       FROM convite_grupo c
       JOIN grupo g ON g.id_grupo=c.id_grupo
       WHERE LOWER(c.email)=LOWER($1) AND c.status='pending'
       ORDER BY c.data_criacao DESC`, [req.user.email]
    );
    res.json({ invitations: result.rows.map((row) => ({
      id: asId(row.id_convite),
      groupId: asId(row.id_grupo),
      groupName: row.nome,
      createdAt: row.data_criacao,
    })) });
  } catch (err) { next(err); }
});

router.post('/api/invitations/:id/accept', authenticate, async (req, res, next) => {
  const invitationId = Number(req.params.id);
  if (!Number.isInteger(invitationId) || invitationId < 1) {
    return res.status(400).json({ error: { message: 'Convite inválido.' } });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT id_convite, id_grupo, email FROM convite_grupo
       WHERE id_convite=$1 AND status='pending' FOR UPDATE`, [invitationId]
    );
    if (!result.rowCount || result.rows[0].email.toLowerCase() !== String(req.user.email).toLowerCase()) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: { message: 'Convite não encontrado ou já resolvido.' } });
    }
    const groupId=result.rows[0].id_grupo;
    await client.query(
      `INSERT INTO participante_grupo (id_usuario,id_grupo,permissao)
       VALUES ($1,$2,'member') ON CONFLICT (id_usuario,id_grupo) DO NOTHING`,
      [req.user.id_usuario,groupId]
    );
    await client.query("UPDATE convite_grupo SET status='accepted' WHERE id_convite=$1",[invitationId]);
    await client.query('COMMIT');
    res.json({ message: 'Convite aceito.', groupId: asId(groupId) });
  } catch(err) {
    await client.query('ROLLBACK').catch(()=>{});
    next(err);
  } finally { client.release(); }
});

router.post('/api/invitations/:id/decline', authenticate, async (req, res, next) => {
  const invitationId=Number(req.params.id);
  if (!Number.isInteger(invitationId) || invitationId < 1) {
    return res.status(400).json({ error: { message: 'Convite inválido.' } });
  }
  try {
    const result=await query(
      `UPDATE convite_grupo SET status='cancelled'
       WHERE id_convite=$1 AND LOWER(email)=LOWER($2) AND status='pending'
       RETURNING id_convite`,[invitationId,req.user.email]
    );
    if (!result.rowCount) return res.status(404).json({ error: { message: 'Convite não encontrado ou já resolvido.' } });
    res.json({ message: 'Convite recusado.' });
  } catch(err) { next(err); }
});

// Chapters/subgroups
// Álbuns são coleções temáticas, não eventos: não exigem data ou subparticipantes.
router.post('/api/families/:familyId/chapters', authenticate, requireFamilyMember, async (req, res, next) => {
  if (req.familyPermission !== 'admin' && Number(req.familyAdminId) !== Number(req.user.id_usuario)) {
    return res.status(403).json({ error: { message: 'Somente o administrador pode criar álbuns.' } });
  }
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  if (title.length < 2 || title.length > 150) {
    return res.status(400).json({ error: { message: 'O nome do álbum deve ter entre 2 e 150 caracteres.' } });
  }
  try {
    const result = await query(
      `INSERT INTO subgrupo (nome,descricao,id_grupo,id_criador,visibilidade)
       VALUES ($1,$2,$3,$4,'family') RETURNING id_subgrupo`,
      [title,description || null,req.familyId,req.user.id_usuario]
    );
    res.status(201).json({ chapter: await getChapter(result.rows[0].id_subgrupo,req.user.id_usuario) });
  } catch(err) { next(err); }
});

router.patch('/api/chapters/:id', authenticate, async (req, res, next) => {
  const chapterId=Number(req.params.id);
  if(!Number.isInteger(chapterId)||chapterId<1) return res.status(400).json({error:{message:'Álbum inválido.'}});
  try {
    const chapter=await assertChapterAccess(chapterId,req.user.id_usuario);
    if(!chapter) return res.status(404).json({error:{message:'Álbum não encontrado ou sem acesso.'}});
    if(chapter.family_permission!=='admin' && Number(chapter.id_admin)!==Number(req.user.id_usuario)) {
      return res.status(403).json({error:{message:'Somente administradores podem editar álbuns.'}});
    }
    const title=String(req.body.title ?? chapter.nome).trim();
    const description=String(req.body.description ?? chapter.descricao ?? '').trim();
    if(title.length<2||title.length>150) return res.status(400).json({error:{message:'Nome do álbum inválido.'}});
    await query('UPDATE subgrupo SET nome=$1,descricao=$2 WHERE id_subgrupo=$3',
      [title,description||null,chapterId]);
    res.json({chapter:await getChapter(chapterId,req.user.id_usuario)});
  } catch(err) { next(err); }
});

router.delete('/api/chapters/:id', authenticate, async (req, res, next) => {
  try {
    const chapter = await assertChapterAccess(Number(req.params.id), req.user.id_usuario);
    if (!chapter) return res.status(404).json({ error: { message: 'Memória não encontrada ou sem permissão.' } });
    if (chapter.family_permission !== 'admin' && Number(chapter.id_admin) !== Number(req.user.id_usuario)) return res.status(403).json({ error: { message: 'Somente administradores podem excluir álbuns.' } });
    const media = await query('SELECT arquivo FROM midia WHERE id_subgrupo=$1', [req.params.id]);
    await query('DELETE FROM subgrupo WHERE id_subgrupo=$1', [req.params.id]);
    for (const item of media.rows) {
      if (item.arquivo && item.arquivo.startsWith('/uploads/')) fs.promises.unlink(path.join(uploadsDir, path.basename(item.arquivo))).catch(() => {});
    }
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post('/api/chapters/:id/comments', authenticate, async (req, res, next) => {
  const body = String(req.body.body || '').trim();
  if (!body || body.length > 5000) return res.status(400).json({ error: { message: 'O comentário deve ter entre 1 e 5000 caracteres.' } });
  try {
    const chapter = await assertChapterAccess(Number(req.params.id), req.user.id_usuario);
    if (!chapter) return res.status(404).json({ error: { message: 'Memória não encontrada ou sem permissão.' } });
    const created = await query('INSERT INTO comentario (conteudo,id_usuario,id_subgrupo) VALUES ($1,$2,$3) RETURNING *', [body, req.user.id_usuario, req.params.id]);
    res.status(201).json({ comment: publicComment({ ...created.rows[0], nome: req.user.nome, email: req.user.email }) });
  } catch (err) { next(err); }
});

router.post('/api/chapters/:id/media', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: { message: err.code === 'LIMIT_FILE_SIZE' ? `O arquivo excede o limite de ${maxUploadMb} MB.` : err.message } });
    }
    next();
  });
}, async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: { message: 'Selecione um arquivo para enviar.' } });
  try {
    const chapter = await assertChapterAccess(Number(req.params.id), req.user.id_usuario);
    if (!chapter) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: { message: 'Memória não encontrada ou sem permissão.' } });
    }
    const memoryDate = String(req.body.memoryDate || '').trim();
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(memoryDate)
      ? new Date(`${memoryDate}T12:00:00Z`) : new Date(NaN);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== memoryDate) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: { message: 'Informe a data da lembrança no formato AAAA-MM-DD.' } });
    }
    const type = mediaType(req.file.mimetype);
    const url = `/uploads/${req.file.filename}`;
    const caption = String(req.body.caption || '').trim().slice(0, 255);
    const inserted = await query(
      'INSERT INTO midia (arquivo,descricao,tipo_midia,id_usuario,id_subgrupo,data_lembranca) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [url, caption || req.file.originalname.slice(0, 255), type, req.user.id_usuario, req.params.id, memoryDate],
    );
    res.status(201).json({ media: publicMedia(inserted.rows[0], req.user.id_usuario) });
  } catch (err) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    next(err);
  }
});

// Detalhes e administração de lembranças individuais (não do álbum inteiro).
async function mediaForUser(mediaId,userId) {
  const result=await query(
    `SELECT m.*,s.id_grupo,g.id_admin,pg.permissao AS group_permission,u.nome AS author_name
     FROM midia m
     JOIN subgrupo s ON s.id_subgrupo=m.id_subgrupo
     JOIN grupo g ON g.id_grupo=s.id_grupo
     JOIN participante_grupo pg ON pg.id_grupo=g.id_grupo AND pg.id_usuario=$2
     JOIN usuario u ON u.id_usuario=m.id_usuario
     WHERE m.id_midia=$1`,[mediaId,userId]
  );
  return result.rows[0] || null;
}
function canManageMedia(record,userId) {
  return Number(record.id_usuario)===Number(userId) ||
    record.group_permission==='admin' || Number(record.id_admin)===Number(userId);
}
function validMemoryDate(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===value;
}

router.get('/api/media/:id',authenticate,async(req,res,next)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:{message:'Mídia inválida.'}});
  try {
    const record=await mediaForUser(id,req.user.id_usuario);
    if(!record)return res.status(404).json({error:{message:'Lembrança não encontrada ou sem permissão.'}});
    const comments=await query(
      `SELECT c.*,u.nome,u.email FROM comentario c JOIN usuario u ON u.id_usuario=c.id_usuario
       WHERE c.id_midia=$1 ORDER BY c.data_criacao ASC`,[id]
    );
    res.json({media:{...publicMedia(record,req.user.id_usuario),authorName:record.author_name,
      albumId:asId(record.id_subgrupo),groupId:asId(record.id_grupo),
      canManage:canManageMedia(record,req.user.id_usuario),
      isGroupAdmin:record.group_permission==='admin' || Number(record.id_admin)===Number(req.user.id_usuario),
      comments:comments.rows.map(publicComment)
    }});
  }catch(err){next(err)}
});

router.patch('/api/media/:id',authenticate,async(req,res,next)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:{message:'Mídia inválida.'}});
  try {
    const record=await mediaForUser(id,req.user.id_usuario);
    if(!record)return res.status(404).json({error:{message:'Lembrança não encontrada.'}});
    if(!canManageMedia(record,req.user.id_usuario))return res.status(403).json({error:{message:'Somente o autor ou administrador pode editar.'}});
    const caption=String(req.body.caption ?? record.descricao ?? '').trim();
    const memoryDate=String(req.body.memoryDate ?? (record.data_lembranca ? record.data_lembranca.toISOString().slice(0,10) : '')).trim();
    if(caption.length>255)return res.status(400).json({error:{message:'A descrição tem limite de 255 caracteres.'}});
    if(!validMemoryDate(memoryDate))return res.status(400).json({error:{message:'Informe a data da lembrança no formato AAAA-MM-DD.'}});
    await query('UPDATE midia SET descricao=$1,data_lembranca=$2 WHERE id_midia=$3',[caption||null,memoryDate,id]);
    res.json({message:'Lembrança atualizada.'});
  }catch(err){next(err)}
});

router.delete('/api/media/:id',authenticate,async(req,res,next)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:{message:'Mídia inválida.'}});
  try {
    const record=await mediaForUser(id,req.user.id_usuario);
    if(!record)return res.status(404).json({error:{message:'Lembrança não encontrada.'}});
    if(!canManageMedia(record,req.user.id_usuario))return res.status(403).json({error:{message:'Somente o autor ou administrador pode excluir.'}});
    await query('DELETE FROM midia WHERE id_midia=$1',[id]);
    if(record.arquivo?.startsWith('/uploads/')) {
      await fs.promises.unlink(path.join(uploadsDir,path.basename(record.arquivo))).catch(()=>{});
    }
    res.status(204).end();
  }catch(err){next(err)}
});

router.post('/api/media/:id/comments',authenticate,async(req,res,next)=>{
  const id=Number(req.params.id);
  const body=String(req.body.body||'').trim();
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:{message:'Mídia inválida.'}});
  if(!body||body.length>5000)return res.status(400).json({error:{message:'O comentário deve ter entre 1 e 5000 caracteres.'}});
  try {
    const record=await mediaForUser(id,req.user.id_usuario);
    if(!record)return res.status(404).json({error:{message:'Lembrança não encontrada ou sem acesso.'}});
    const result=await query('INSERT INTO comentario (conteudo,id_usuario,id_midia) VALUES ($1,$2,$3) RETURNING *',
      [body,req.user.id_usuario,id]);
    res.status(201).json({comment:publicComment({...result.rows[0],nome:req.user.nome,email:req.user.email})});
  }catch(err){next(err)}
});

async function editableComment(commentId,userId) {
  const result=await query(
    `SELECT c.*,g.id_admin,pg.permissao AS group_permission
     FROM comentario c
     JOIN midia m ON m.id_midia=c.id_midia
     JOIN subgrupo s ON s.id_subgrupo=m.id_subgrupo
     JOIN grupo g ON g.id_grupo=s.id_grupo
     JOIN participante_grupo pg ON pg.id_grupo=g.id_grupo AND pg.id_usuario=$2
     WHERE c.id_comentario=$1`,[commentId,userId]
  );
  return result.rows[0] || null;
}
function canManageComment(record,userId) {
  return Number(record.id_usuario)===Number(userId) ||
    record.group_permission==='admin' || Number(record.id_admin)===Number(userId);
}

router.patch('/api/media/comments/:id',authenticate,async(req,res,next)=>{
  const id=Number(req.params.id), body=String(req.body.body||'').trim();
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:{message:'Comentário inválido.'}});
  if(!body||body.length>5000)return res.status(400).json({error:{message:'O comentário deve ter entre 1 e 5000 caracteres.'}});
  try {
    const record=await editableComment(id,req.user.id_usuario);
    if(!record)return res.status(404).json({error:{message:'Comentário não encontrado.'}});
    if(!canManageComment(record,req.user.id_usuario))return res.status(403).json({error:{message:'Você não pode editar este comentário.'}});
    await query('UPDATE comentario SET conteudo=$1 WHERE id_comentario=$2',[body,id]);
    res.json({message:'Comentário atualizado.'});
  }catch(err){next(err)}
});

router.delete('/api/media/comments/:id',authenticate,async(req,res,next)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:{message:'Comentário inválido.'}});
  try {
    const record=await editableComment(id,req.user.id_usuario);
    if(!record)return res.status(404).json({error:{message:'Comentário não encontrado.'}});
    if(!canManageComment(record,req.user.id_usuario))return res.status(403).json({error:{message:'Você não pode excluir este comentário.'}});
    await query('DELETE FROM comentario WHERE id_comentario=$1',[id]);
    res.status(204).end();
  }catch(err){next(err)}
});

module.exports = router;
