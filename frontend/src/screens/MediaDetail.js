import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Linking, Platform, Pressable,
  Text, TextInput, View,
} from "react-native";
import { api, assetUrl, COLORS } from "../services/api";
import { Icon, Screen } from "../components/ui";
import S from "../theme/prototypeInternalStyles";

function niceDate(raw) {
  if (!raw) return "Data não informada";
  const parsed = new Date(String(raw).slice(0, 10) + "T12:00:00");
  return Number.isNaN(parsed.getTime()) ? "Data não informada" :
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(parsed);
}

function AskBefore({ title, message, proceed }) {
  if (Platform.OS === "web") {
    if (window.confirm(message)) proceed();
  } else {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: proceed },
    ]);
  }
}

export function MediaDetail({ mediaId, token, currentUserId, onBack, onRefresh, onDeleted }) {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [comment, setComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingBody, setEditingBody] = useState("");

  const load = async () => {
    const result = await api(`/api/media/${mediaId}`, token);
    setMedia(result.media);
    setCaption(result.media.title || "");
    setMemoryDate(result.media.memoryDate || "");
    return result.media;
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/api/media/${mediaId}`, token)
      .then(({ media: loaded }) => {
        if (active) {
          setMedia(loaded);
          setCaption(loaded.title || "");
          setMemoryDate(loaded.memoryDate || "");
          setError("");
        }
      })
      .catch((e) => { if (active) setError(e.message || "Erro ao abrir a lembrança."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mediaId, token]);

  const save = async () => {
    try {
      setBusy(true);
      setError("");
      await api(`/api/media/${mediaId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ caption: caption.trim(), memoryDate }),
      });
      await onRefresh?.();
      await load();
      setEditing(false);
    } catch (e) { setError(e.message || "Não foi possível salvar."); }
    finally { setBusy(false); }
  };

  const deleteMedia = () => AskBefore({
    title: "Excluir lembrança",
    message: "Deseja excluir este arquivo e seus comentários? A ação não poderá ser desfeita.",
    proceed: async () => {
      try {
        setBusy(true);
        setError("");
        await api(`/api/media/${mediaId}`, token, { method: "DELETE" });
        await onDeleted();
      } catch (e) {
        setError(e.message || "Não foi possível excluir.");
        setBusy(false);
      }
    },
  });

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      setBusy(true); setError("");
      await api(`/api/media/${mediaId}/comments`, token, {
        method: "POST", body: JSON.stringify({ body: comment.trim() }),
      });
      setComment("");
      await load();
    } catch (e) { setError(e.message || "Não foi possível comentar."); }
    finally { setBusy(false); }
  };

  const saveComment = async () => {
    if (!editingBody.trim() || !editingCommentId) return;
    try {
      setBusy(true); setError("");
      await api(`/api/media/comments/${editingCommentId}`, token, {
        method: "PATCH", body: JSON.stringify({ body: editingBody.trim() }),
      });
      setEditingCommentId(null);
      setEditingBody("");
      await load();
    } catch (e) { setError(e.message || "Não foi possível editar o comentário."); }
    finally { setBusy(false); }
  };

  const deleteComment = (item) => AskBefore({
    title: "Excluir comentário",
    message: "Deseja excluir este comentário?",
    proceed: async () => {
      try {
        setBusy(true); setError("");
        await api(`/api/media/comments/${item.id}`, token, { method: "DELETE" });
        await load();
      } catch (e) { setError(e.message || "Não foi possível excluir comentário."); }
      finally { setBusy(false); }
    },
  });

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingVertical: 80, alignItems: "center" }}>
          <ActivityIndicator color={COLORS.teal} />
          <Text style={[S.emptyBody, { marginTop: 12 }]}>Carregando lembrança...</Text>
        </View>
      </Screen>
    );
  }

  if (!media) {
    return (
      <Screen>
        <Pressable onPress={onBack} style={{ minHeight: 48, justifyContent: "center" }}>
          <Icon name="arrow-left" size={22} color={COLORS.ink} />
        </Pressable>
        <View style={S.error}><Text style={S.errorText}>{error || "Memória não encontrada."}</Text></View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar ao álbum"
        style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 11 }}
      >
        <Icon name="arrow-left" size={22} color={COLORS.ink} />
        <Text style={S.secondaryLabel}>Voltar ao álbum</Text>
      </Pressable>

      <View style={{ minHeight: 215, backgroundColor: "#191b22", borderRadius: 14, overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
        {media.type === "image" ? (
          <Image
            source={{ uri: assetUrl(media.url) }}
            style={{ width: "100%", height: 285 }}
            resizeMode="contain"
            accessibilityLabel={media.title || "Fotografia da lembrança"}
          />
        ) : (
          <View style={{ padding: 28, alignItems: "center", gap: 17 }}>
            <Icon name={media.type === "video" ? "film" : "headphones"} size={40} color="#dfdaee" />
            <Text style={{ color: "#f8f7fc", fontWeight: "600", fontSize: 15, textAlign: "center" }}>
              {media.type === "video" ? "Vídeo da lembrança" : "Áudio da lembrança"}
            </Text>
            <Pressable
              onPress={() => Linking.openURL(assetUrl(media.url)).catch(() => setError("Não foi possível abrir o arquivo."))}
              accessibilityRole="button"
              style={[S.secondaryButton, { minHeight: 42, paddingHorizontal: 20 }]}
            >
              <Text style={S.secondaryLabel}>Abrir arquivo</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={{ marginTop: 24, marginBottom: 20 }}>
        <Text style={[S.memoryMeta, { color: "#6d628f", fontSize: 12, marginBottom: 8 }]}>
          <Icon name="calendar" size={13} color="#6d628f" />  {niceDate(media.memoryDate)}
        </Text>
        <Text style={[S.heading, { fontSize: 21 }]}>{media.title || "Lembrança"}</Text>
        <Text style={[S.memoryMeta, { fontSize: 12, marginTop: 9 }]}>
          Adicionada por {media.authorName || "Participante"}
        </Text>
      </View>

      {media.canManage && !editing && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            style={[S.secondaryButton, { flex: 1 }]}
          >
            <Icon name="edit-2" size={17} color={COLORS.teal} />
            <Text style={S.secondaryLabel}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={deleteMedia}
            disabled={busy}
            accessibilityRole="button"
            style={[S.secondaryButton, { flex: 1, borderColor: "#eed5dd" }]}
          >
            <Icon name="trash-2" size={17} color={COLORS.danger} />
            <Text style={[S.secondaryLabel, { color: COLORS.danger }]}>Excluir</Text>
          </Pressable>
        </View>
      )}

      {editing && (
        <View style={[S.empty, { alignItems: "stretch", gap: 12, marginBottom: 22 }]}>
          <Text style={[S.heading, { fontSize: 17 }]}>Editar lembrança</Text>
          <Text style={S.label}>Descrição</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            style={S.input}
            maxLength={255}
            accessibilityLabel="Descrição da lembrança"
          />
          <Text style={S.label}>Data da lembrança (AAAA-MM-DD)</Text>
          <TextInput
            value={memoryDate}
            onChangeText={setMemoryDate}
            placeholder="2024-07-15"
            style={S.input}
            accessibilityLabel="Data da lembrança"
          />
          <Pressable
            onPress={save}
            disabled={busy}
            style={[S.actionButton, busy && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={S.actionLabel}>Salvar alterações</Text>}
          </Pressable>
          <Pressable
            onPress={() => { setEditing(false); setCaption(media.title || ""); setMemoryDate(media.memoryDate || ""); }}
            disabled={busy}
            style={S.secondaryButton}
            accessibilityRole="button"
          >
            <Text style={S.secondaryLabel}>Cancelar</Text>
          </Pressable>
        </View>
      )}

      <View style={[S.headingRow, { marginTop: 12 }]}>
        <Text style={S.heading}>Comentários</Text>
        <Text style={S.memoryMeta}>{media.comments?.length || 0}</Text>
      </View>
      {(media.comments || []).map((item) => {
        const canEdit = media.canManage || String(item.user?.id) === String(currentUserId);
        return (
          <View key={String(item.id)} style={[S.groupCard, { flexDirection: "column", alignItems: "stretch" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={S.memoryName}>{item.user?.name || "Participante"}</Text>
              {canEdit && (
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <Pressable
                    onPress={() => { setEditingCommentId(item.id); setEditingBody(item.body); }}
                    accessibilityRole="button"
                    accessibilityLabel="Editar comentário"
                  >
                    <Icon name="edit-2" size={16} color="#6f6981" />
                  </Pressable>
                  <Pressable onPress={() => deleteComment(item)} accessibilityRole="button" accessibilityLabel="Excluir comentário">
                    <Icon name="trash-2" size={16} color={COLORS.danger} />
                  </Pressable>
                </View>
              )}
            </View>
            {editingCommentId === item.id ? (
              <View style={{ gap: 9 }}>
                <TextInput
                  value={editingBody}
                  onChangeText={setEditingBody}
                  multiline
                  style={[S.input, { minHeight: 76 }]}
                  accessibilityLabel="Editar texto do comentário"
                />
                <Pressable onPress={saveComment} disabled={busy} style={S.actionButton} accessibilityRole="button">
                  <Text style={S.actionLabel}>Salvar comentário</Text>
                </Pressable>
                <Pressable onPress={() => setEditingCommentId(null)} style={S.secondaryButton} accessibilityRole="button">
                  <Text style={S.secondaryLabel}>Cancelar</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[S.emptyBody, { textAlign: "left" }]}>{item.body}</Text>
            )}
          </View>
        );
      })}
      {!(media.comments || []).length && (
        <Text style={[S.emptyBody, { textAlign: "left", marginBottom: 18 }]}>
          Ainda não há comentários nesta lembrança.
        </Text>
      )}
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        placeholder="Escreva um comentário sobre esta lembrança"
        placeholderTextColor="#8f8e9a"
        accessibilityLabel="Novo comentário"
        style={[S.input, { minHeight: 87, marginBottom: 10, textAlignVertical: "top", paddingVertical: 12 }]}
      />
      <Pressable
        onPress={addComment}
        disabled={busy || !comment.trim()}
        accessibilityRole="button"
        style={[S.actionButton, (busy || !comment.trim()) && { opacity: 0.6 }]}
      >
        {busy ? <ActivityIndicator color="#fff" /> : (
          <>
            <Icon name="send" size={17} color="#fff" />
            <Text style={S.actionLabel}>Publicar comentário</Text>
          </>
        )}
      </Pressable>
      {!!error && <View style={[S.error, { marginTop: 18 }]}><Text style={S.errorText}>{error}</Text></View>}
    </Screen>
  );
}
