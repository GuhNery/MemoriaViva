import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { api, COLORS } from "../services/api";
import { Screen, Icon } from "../components/ui";
import S from "../theme/prototypeInternalStyles";
import { CoverField, uploadCover } from "../components/CoverField";

function GoBack({ onBack, title }) {
  return (
    <Pressable
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel={"Voltar: " + title}
      style={{ flexDirection: "row", gap: 12, alignItems: "center", minHeight: 52, marginBottom: 12 }}
    >
      <Icon name="arrow-left" color={COLORS.ink} size={21} />
      <Text style={{ color: COLORS.ink, fontWeight: "700", fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function AlbumList({ chapters = [], onOpen, onBack, onAdd, canManage = false }) {
  const [search, setSearch] = useState("");
  const shown = useMemo(() => chapters.filter((album) =>
    [album.title, album.description].filter(Boolean).some((text) =>
      String(text).toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))
    )
  ), [chapters, search]);

  return (
    <Screen>
      <GoBack onBack={onBack} title="Voltar ao Início" />
      <Text style={[S.heading, { fontSize: 24 }]}>Álbuns de memórias</Text>
      <Text style={[S.emptyBody, { textAlign: "left", marginTop: 8, marginBottom: 23 }]}>
        Organize suas lembranças por lugar, pessoa, assunto ou ocasião.
        Dentro de cada álbum, as mídias seguem a data em que aconteceram.
      </Text>
      <View style={S.searchField}>
        <Icon name="search" size={18} color={COLORS.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar álbuns"
          placeholderTextColor="#888695"
          style={S.searchInput}
          accessibilityLabel="Pesquisar álbuns"
        />
      </View>
      <View style={[S.headingRow, { marginTop: 6 }]}>
        <Text style={[S.heading, { fontSize: 17 }]}>Seus álbuns</Text>
        <Text style={S.memoryMeta}>{shown.length} encontrados</Text>
      </View>
      {shown.length ? shown.map((album) => (
        <Pressable
          key={String(album.id)}
          onPress={() => onOpen(album)}
          accessibilityRole="button"
          accessibilityLabel={"Abrir álbum " + album.title}
          style={({ pressed }) => [S.groupCard, { minHeight: 86 }, pressed && { opacity: 0.72 }]}
        >
          <View style={[S.groupIcon, { backgroundColor: COLORS.sage, borderRadius: 10, width: 48, height: 48 }]}>
            <Icon name="layers" size={24} color={COLORS.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.groupTitle, { fontSize: 15 }]} numberOfLines={1}>{album.title}</Text>
            <Text style={S.groupHint} numberOfLines={2}>
              {album.description || "Coleção privada de memórias"}
            </Text>
            <Text style={[S.memoryMeta, { marginTop: 5 }]}>
              {album.media?.length || 0} {(album.media?.length || 0) === 1 ? "registro" : "registros"}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.muted} />
        </Pressable>
      )) : (
        <View style={[S.empty, { marginBottom: 16 }]}>
          <Icon name="layers" size={26} color="#8178a0" />
          <Text style={S.emptyTitle}>{search ? "Nenhum álbum encontrado" : "Nenhum álbum por enquanto"}</Text>
          <Text style={S.emptyBody}>
            {search ? "Tente outro nome ou assunto." : "Crie álbuns para organizar as memórias do grupo."}
          </Text>
        </View>
      )}
      {canManage && (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Criar álbum"
          style={({ pressed }) => [S.actionButton, { marginTop: 8 }, pressed && { opacity: 0.72 }]}
        >
          <Icon name="plus" size={18} color="#fff" />
          <Text style={S.actionLabel}>Criar novo álbum</Text>
        </Pressable>
      )}
    </Screen>
  );
}

export function AlbumForm({ family, token, existing, onSaved, onBack }) {
  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [cover, setCover] = useState(null);
  const [savedAlbum, setSavedAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    const cleaned = title.trim();
    if (cleaned.length < 2 || cleaned.length > 150) {
      setError("Digite um nome de 2 a 150 caracteres.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const album = savedAlbum || (await api(
        existing ? `/api/chapters/${existing.id}` : `/api/families/${family.id}/chapters`,
        token,
        {
          method: existing ? "PATCH" : "POST",
          body: JSON.stringify({ title: cleaned, description: description.trim() }),
        }
      )).chapter;
      setSavedAlbum(album);
      let finalAlbum = album;
      if (cover) {
        try {
          const uploaded = await uploadCover({ kind: "album", id: album.id, token, asset: cover });
          finalAlbum = uploaded.chapter || album;
        } catch (uploadError) {
          setError("O álbum foi salvo, mas a capa não pôde ser enviada: " + (uploadError.message || "tente novamente."));
          return;
        }
      }
      await onSaved(finalAlbum);
    } catch (e) {
      setError(e.message || "Não foi possível salvar o álbum.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <GoBack onBack={onBack} title="Cancelar e voltar" />
      <Text style={[S.heading, { fontSize: 24, marginTop: 6 }]}>
        {existing ? "Editar álbum" : "Criar álbum"}
      </Text>
      <Text style={[S.emptyBody, { textAlign: "left", marginTop: 10, marginBottom: 23 }]}>
        Escolha um tema para reunir suas lembranças. A data pertence a cada foto,
        vídeo ou áudio, não ao álbum inteiro.
      </Text>
      <CoverField
        value={existing?.coverUrl}
        selected={cover}
        onPick={setCover}
        label="Adicionar capa do álbum"
        busy={loading}
      />
      <View style={S.field}>
        <Text style={S.label}>Nome do álbum</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          maxLength={150}
          placeholder="Ex.: Itália, Natal, Formatura..."
          placeholderTextColor="#8f8e9a"
          accessibilityLabel="Nome do álbum"
          style={S.input}
        />
      </View>
      <View style={S.field}>
        <Text style={S.label}>Descrição (opcional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Sobre o que são essas lembranças?"
          placeholderTextColor="#8f8e9a"
          multiline
          accessibilityLabel="Descrição do álbum"
          style={[S.input, { minHeight: 106, textAlignVertical: "top", paddingVertical: 12 }]}
        />
      </View>
      {!!error && <View style={S.error}><Text style={S.errorText}>{error}</Text></View>}
      <Pressable
        onPress={save}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={existing ? "Salvar álbum" : "Criar álbum"}
        style={({ pressed }) => [S.actionButton, (pressed || loading) && { opacity: 0.7 }]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Icon name="check" size={18} color="#fff" />
            <Text style={S.actionLabel}>{savedAlbum ? "Tentar salvar capa" : existing ? "Salvar alterações" : "Criar álbum"}</Text>
          </>
        )}
      </Pressable>
      {!!savedAlbum && (
        <Pressable
          onPress={() => onSaved(savedAlbum)}
          disabled={loading}
          accessibilityRole="button"
          style={[S.secondaryButton, { marginTop: 10 }]}
        >
          <Text style={S.secondaryLabel}>Continuar sem capa</Text>
        </Pressable>
      )}
      <Pressable
        onPress={onBack}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Cancelar edição do álbum"
        style={[S.secondaryButton, { marginTop: 12 }]}
      >
        <Text style={S.secondaryLabel}>Cancelar</Text>
      </Pressable>
    </Screen>
  );
}
