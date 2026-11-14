
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { api, COLORS, assetUrl, formatDate } from "../services/api";
import styles from "../theme/styles";
import {
  Screen,
  TopBar,
  EmptyState,
  Button,
  Field,
  Icon,
  Filter,
  Stat,
  Avatar,
} from "../components/ui";

function initials(name) {
  if (!name || typeof name !== "string") return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function getErrorMessage(error) {
  if (error?.message) return error.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function Dashboard({
  family,
  chapters,
  members,
  setScreen,
  openChapter,
  onAdd,
}) {
  const years = useMemo(
    () =>
      new Set(
        chapters
          .map((item) => item.eventDate?.slice(0, 4))
          .filter(Boolean),
      ).size,
    [chapters],
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollBottom}
    >
      <View style={styles.welcomeCard}>
        <Text style={styles.eyebrow}>UM RETRATO DA SUA HISTÓRIA</Text>

        <Text style={styles.welcomeTitle}>
          {family?.description ||
            "Cada família tem um jeito único de contar o tempo."}
        </Text>

        <Text style={styles.welcomeSub}>
          Comece registrando aquele momento que sempre volta nas conversas.
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat
          value={String(chapters.length).padStart(2, "0")}
          label="memórias"
        />
        <Stat
          value={String(members.length).padStart(2, "0")}
          label="pessoas"
        />
        <Stat value={String(years).padStart(2, "0")} label="anos" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>O QUE ESTÁ VIVO POR AQUI</Text>
          <Text style={styles.sectionTitle}>Memórias recentes</Text>
        </View>

        <Pressable onPress={() => setScreen("timeline")}>
          <Text style={styles.link}>Ver todas</Text>
        </Pressable>
      </View>

      {chapters.length === 0 ? (
        <EmptyState onCreate={onAdd} />
      ) : (
        chapters.slice(0, 3).map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            onPress={() => openChapter(chapter)}
          />
        ))
      )}

      <View style={styles.quote}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>
          Uma família é um conjunto de pessoas que carregam umas às outras no
          tempo.
        </Text>
        <Text style={styles.quoteAuthor}>— Memória Viva</Text>
      </View>
    </ScrollView>
  );
}

export function ChapterCard({ chapter, onPress }) {
  const media = chapter.media?.[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chapterCard,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.chapterImage,
          media?.type === "image" && { backgroundColor: "#ccdcd2" },
        ]}
      >
        {media?.type === "image" ? (
          <Image
            source={{ uri: assetUrl(media.url) }}
            style={styles.chapterImageFill}
          />
        ) : (
          <Icon name="star" size={24} color="#ffffffaa" />
        )}

        <View style={styles.chapterImageOverlay}>
          <Text style={styles.chapterYear}>
            {chapter.eventDate?.slice(0, 4) || ""}
          </Text>

          <View style={styles.chapterPrivacy}>
            <Icon
              name={chapter.visibility === "private" ? "lock" : "users"}
              size={11}
              color={COLORS.white}
            />
            <Text style={styles.chapterPrivacy}>
              {chapter.visibility === "private" ? "privado" : "família"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chapterBody}>
        <Text style={styles.chapterDate}>
          {formatDate(chapter.eventDate)}
        </Text>

        <Text style={styles.chapterTitle}>{chapter.title}</Text>

        <Text style={styles.chapterDescription} numberOfLines={2}>
          {chapter.description ||
            "Uma memória esperando por mais detalhes."}
        </Text>

        <View style={styles.chapterFooter}>
          <Text style={styles.mutedSmall}>
            {chapter.media?.length || 0} registros
          </Text>

          <View style={styles.circleArrow}>
            <Icon name="arrow-right" size={13} color={COLORS.teal} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function Timeline({
  chapters,
  members,
  setScreen,
  openChapter,
  onAdd,
}) {
  const [memberId, setMemberId] = useState("");

  const filtered = memberId
    ? chapters.filter((item) => item.memberIds?.includes(memberId))
    : chapters;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollBottom}
    >
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>UMA HISTÓRIA EM MOVIMENTO</Text>
          <Text style={styles.sectionTitle}>Linha do tempo</Text>
        </View>

        <Pressable onPress={onAdd}>
          <Icon name="plus-circle" size={23} color={COLORS.teal} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        <Filter
          active={!memberId}
          label="Toda a família"
          onPress={() => setMemberId("")}
        />

        {members.map((item) => (
          <Filter
            key={item.userId}
            active={memberId === item.userId}
            label={item.user?.name?.split(" ")[0] || "Pessoa"}
            onPress={() => setMemberId(item.userId)}
          />
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState onCreate={onAdd} />
      ) : (
        <View style={styles.timeline}>
          {filtered.map((chapter, index) => (
            <View key={chapter.id} style={styles.timelineItem}>
              <View style={styles.timelineRail}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineYear}>
                  {chapter.eventDate?.slice(0, 4) || ""}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <ChapterCard
                  chapter={chapter}
                  onPress={() => openChapter(chapter)}
                />

                <Text style={styles.timelineNumber}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export function ChapterForm({
  family,
  token,
  members,
  existing,
  onSaved,
  onBack,
}) {
  const [form, setForm] = useState({
    title: existing?.title || "",
    eventDate:
      existing?.eventDate?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
    description: existing?.description || "",
    visibility: existing?.visibility || "family",
    memberIds: existing?.memberIds || [],
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (id) => {
    setForm((previous) => ({
      ...previous,
      memberIds: previous.memberIds.includes(id)
        ? previous.memberIds.filter((item) => item !== id)
        : [...previous.memberIds, id],
    }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("Informe um título para a memória.");
      return;
    }

    if (!form.eventDate.trim()) {
      setError("Informe a data da memória.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const result = await api(
        existing
          ? `/api/chapters/${existing.id}`
          : `/api/families/${family.id}/chapters`,
        token,
        {
          method: existing ? "PATCH" : "POST",
          body: JSON.stringify(form),
        },
      );

      if (!result?.chapter) {
        throw new Error("O servidor não retornou a memória salva.");
      }

      onSaved(result.chapter);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <TopBar
        title={existing ? "Editar memória" : "Nova memória"}
        onBack={onBack}
      />

      <View style={styles.formPage}>
        <Text style={styles.eyebrow}>
          {existing ? "EDITAR CAPÍTULO" : "NOVO CAPÍTULO"}
        </Text>

        <Text style={styles.formTitle}>
          {existing
            ? "Dê novos detalhes a esta memória."
            : "Qual momento merece ser lembrado?"}
        </Text>

        <Text style={styles.formIntro}>
          Conte um pouco. O tempo agradece quando a gente dá nome às coisas
          importantes.
        </Text>

        <Field
          label="TÍTULO DA MEMÓRIA"
          value={form.title}
          onChangeText={(title) => setForm({ ...form, title })}
          placeholder="Ex.: O dia em que nos mudamos"
        />

        <Field
          label="QUANDO ACONTECEU"
          value={form.eventDate}
          onChangeText={(eventDate) => setForm({ ...form, eventDate })}
          placeholder="AAAA-MM-DD"
        />

        <Field
          label="CONTE A HISTÓRIA"
          value={form.description}
          onChangeText={(description) =>
            setForm({ ...form, description })
          }
          placeholder="O que você gostaria que as próximas gerações soubessem?"
          multiline
        />

        <Text style={styles.fieldLabel}>QUEM PODE VER?</Text>

        <View style={styles.segment}>
          <Pressable
            onPress={() => setForm({ ...form, visibility: "family" })}
            style={[
              styles.segmentItem,
              form.visibility === "family" && styles.segmentActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                form.visibility === "family" &&
                  styles.segmentTextActive,
              ]}
            >
              Toda a família
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setForm({ ...form, visibility: "private" })}
            style={[
              styles.segmentItem,
              form.visibility === "private" && styles.segmentActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                form.visibility === "private" &&
                  styles.segmentTextActive,
              ]}
            >
              Participantes
            </Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>QUEM FAZ PARTE?</Text>

        <View style={styles.memberPills}>
          {members.map((member) => (
            <Pressable
              key={member.userId}
              onPress={() => toggle(member.userId)}
              style={[
                styles.memberPill,
                form.memberIds.includes(member.userId) &&
                  styles.memberPillActive,
              ]}
            >
              <Avatar
                text={initials(member.user?.name)}
                small
                color={
                  form.memberIds.includes(member.userId)
                    ? COLORS.teal
                    : "#c8927c"
                }
              />

              <Text style={styles.memberPillText}>
                {member.user?.name?.split(" ")[0] || "Pessoa"}
              </Text>

              {form.memberIds.includes(member.userId) ? (
                <Icon name="check" size={14} color={COLORS.teal} />
              ) : null}
            </Pressable>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button onPress={save} loading={loading} icon="arrow-right">
          {existing ? "Salvar alterações" : "Guardar esta memória"}
        </Button>
      </View>
    </Screen>
  );
}

export function ChapterDetail({
  chapter,
  token,
  onBack,
  onRefresh,
  onEdit,
  onDelete,
  canManage = false,
  onOpenMedia,
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [memoryCaption, setMemoryCaption] = useState("");

  const upload = async () => {
    if (uploading) return;
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(memoryDate)
      ? new Date(`${memoryDate}T12:00:00Z`)
      : new Date(NaN);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== memoryDate) {
      setError("Informe a data da lembrança no formato AAAA-MM-DD antes de selecionar o arquivo.");
      return;
    }

    try {
      setError("");

      const picked = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "video/*", "audio/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets?.[0]) return;

      const item = picked.assets[0];

      if (!item.uri && !item.file) {
        throw new Error("Não foi possível acessar o arquivo selecionado.");
      }

      const filename = item.name || `memoria-${Date.now()}`;
      const mimeType =
        item.mimeType || "application/octet-stream";

      setUploading(true);

      const formData = new FormData();
      formData.append("memoryDate", memoryDate);
      formData.append("caption", memoryCaption.trim());

      if (Platform.OS === "web") {
        // No navegador, envie o File original retornado pelo DocumentPicker.
        let browserFile = item.file;

        if (!browserFile && item.uri) {
          const response = await fetch(item.uri);

          if (!response.ok) {
            throw new Error("Não foi possível ler o arquivo selecionado.");
          }

          const blob = await response.blob();

          browserFile = new File([blob], filename, {
            type: mimeType,
          });
        }

        if (!browserFile) {
          throw new Error("O navegador não disponibilizou o arquivo.");
        }

        formData.append("file", browserFile, filename);
      } else {
        // No Android/iOS, o React Native utiliza uri, name e type.
        formData.append(
          "file",
          {
            uri: item.uri,
            name: filename,
            type: mimeType,
          },
        );
      }

      const result = await api(
        `/api/chapters/${chapter.id}/media`,
        token,
        {
          method: "POST",
          body: formData,
        },
      );

      if (result?.error) {
        throw new Error(result.error);
      }

      await onRefresh();
      setMemoryCaption("");

      if (Platform.OS === "web") {
        window.alert("Arquivo enviado com sucesso!");
      } else {
        Alert.alert("Sucesso", "Arquivo enviado com sucesso!");
      }
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message);

      if (Platform.OS === "web") {
        window.alert(`Não foi possível enviar o arquivo: ${message}`);
      } else {
        Alert.alert("Falha no upload", message);
      }
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = () => {
    const remove = () => onDelete();

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Excluir álbum? Esta ação remove todas as mídias e comentários dele.",
        )
      ) {
        remove();
      }
      return;
    }

    Alert.alert(
      "Excluir álbum",
      "Esta ação remove todas as mídias e comentários dele.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: remove },
      ],
    );
  };

  return (
    <Screen>
      <TopBar
        title="Álbum de memórias"
        onBack={onBack}
        action={
          canManage ? (
            <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Editar álbum">
              <Icon name="edit-3" size={19} color={COLORS.teal} />
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.detailPage}>
        <Text style={styles.chapterDate}>
          <Icon name="lock" size={12} color={COLORS.terracotta} /> Álbum privado
        </Text>

        <Text style={styles.detailTitle}>{chapter.title}</Text>

        <Text style={styles.detailDescription}>
          {chapter.description ||
            "Uma história que ainda pode ganhar mais detalhes."}
        </Text>

        {canManage && (
          <View style={styles.detailActions}>
            <Button variant="outline" small onPress={onEdit} icon="edit-3">
              Editar álbum
            </Button>
            <Button variant="danger" small onPress={confirmDelete} icon="trash-2">
              Excluir álbum
            </Button>
          </View>
        )}

        <View style={[styles.detailSectionHeader, { marginTop: 26 }]}>
          <View>
            <Text style={styles.eyebrow}>MINHAS LEMBRANÇAS</Text>
            <Text style={styles.sectionTitleSmall}>Fotos, vídeos e áudios</Text>
          </View>
        </View>
        <View style={[styles.card, { marginBottom: 22 }]}>
          <Text style={[styles.memberName, { fontSize: 14, marginBottom: 12 }]}>
            Adicionar uma lembrança
          </Text>
          <Text style={styles.fieldLabel}>DATA DA LEMBRANÇA (AAAA-MM-DD)</Text>
          <TextInput
            value={memoryDate}
            onChangeText={setMemoryDate}
            placeholder="Ex.: 2024-07-15"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, { marginBottom: 14 }]}
            accessibilityLabel="Data em que a lembrança aconteceu"
          />
          <Text style={styles.fieldLabel}>DESCRIÇÃO DA MÍDIA (OPCIONAL)</Text>
          <TextInput
            value={memoryCaption}
            onChangeText={setMemoryCaption}
            placeholder="Ex.: Visita ao Coliseu"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, { marginBottom: 13 }]}
            accessibilityLabel="Descrição da mídia"
            maxLength={255}
          />
          <Button onPress={upload} loading={uploading} icon="upload-cloud">
            Selecionar foto, vídeo ou áudio
          </Button>
          <Text style={[styles.mutedSmall, { marginTop: 12, lineHeight: 17 }]}>
            As mídias são organizadas pela data escolhida, não pelo dia do envio.
          </Text>
        </View>

        {chapter.media?.length ? (
          <View style={styles.mediaGrid}>
            {chapter.media.map((media) => (
              <Pressable
                key={media.id}
                onPress={() => onOpenMedia?.(media)}
                accessibilityRole="button"
                accessibilityLabel={"Abrir lembrança " + (media.title || "sem título")}
                style={[styles.mediaItem, {
                  borderWidth: 1, borderColor: COLORS.line,
                  borderRadius: 12, padding: 8, backgroundColor: COLORS.card,
                }]}
              >
                {media.type === "image" ? (
                  <Image
                    source={{ uri: assetUrl(media.url) }}
                    style={styles.mediaImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.mediaNonImage,
                      media.type === "video" && {
                        backgroundColor: COLORS.peach,
                      },
                    ]}
                  >
                    <Icon
                      name={media.type === "audio" ? "volume-2" : "film"}
                      size={25}
                      color={COLORS.teal}
                    />
                    <Text style={styles.mutedSmall}>{media.type}</Text>
                  </View>
                )}

                <Text style={styles.mediaTitle} numberOfLines={2}>
                  {media.title || "Arquivo"}
                </Text>
                <Text style={[styles.mutedSmall, { marginTop: 4 }]}>
                  {media.memoryDate ? formatDate(media.memoryDate) : "Data da lembrança não informada"}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.mediaEmpty}>
            <Icon name="upload-cloud" size={25} color="#8daf9f" />

            <Text style={styles.mutedText}>
              Este álbum ainda não tem registros.
            </Text>

            <Button
              variant="quiet"
              onPress={upload}
              loading={uploading}
              icon="arrow-right"
            >
              Adicionar o primeiro arquivo
            </Button>
          </View>
        )}

        <View style={styles.commentsBox}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <Icon name="message-circle" size={21} color={COLORS.terracotta} />
            <Text style={[styles.memberName, { fontSize: 14 }]}>Comentários em cada lembrança</Text>
          </View>
          <Text style={[styles.mutedText, { textAlign: "left" }]}>
            Toque em uma foto, vídeo ou áudio para abrir os detalhes, editar
            sua lembrança ou deixar um comentário.
          </Text>
          {!!chapter.comments?.length && (
            <View style={{ borderTopWidth: 1, borderTopColor: COLORS.line, marginTop: 13, paddingTop: 13 }}>
              <Text style={[styles.memberName, { marginBottom: 8 }]}>
                Comentários antigos deste álbum
              </Text>
              {chapter.comments.map((item) => (
                <View key={item.id} style={styles.comment}>
                  <Avatar text={initials(item.user?.name)} small />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentAuthor}>{item.user?.name || "Participante"}</Text>
                    <Text style={styles.commentBody}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
      </View>
    </Screen>
  );
}
