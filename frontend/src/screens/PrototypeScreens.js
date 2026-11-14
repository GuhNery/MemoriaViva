import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { Icon } from "../components/ui";
import { api } from "../services/api";
import S from "../theme/prototypeInternalStyles";

const brandLogo = require("../../assets/logo-memoria-viva.jpg");

function mediaIcon(type) {
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "audio") return "music";
  return "file-text";
}

function formatShortDate(input) {
  if (!input) return "";
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}

export function PrototypeHome({
  family,
  chapters = [],
  onOpenChapter,
  onShowTimeline,
  onCreateAlbum,
  onCreateGroup,
  canManage = false,
  searchMode = false,
}) {
  const [search, setSearch] = useState("");
  const allMedia = useMemo(() => {
    const records = [];
    for (const chapter of chapters) {
      for (const media of chapter.media || []) {
        records.push({ chapter, media });
      }
    }
    return records.sort((a, b) => {
      const left = a.media.memoryDate || a.media.createdAt || "";
      const right = b.media.memoryDate || b.media.createdAt || "";
      return String(right).localeCompare(String(left));
    });
  }, [chapters]);

  const term = search.trim().toLocaleLowerCase("pt-BR");
  const recent = allMedia.filter(({ chapter, media }) =>
    !term || [media.title, chapter.title, chapter.description]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term)),
  );
  const albums = chapters.filter((chapter) =>
    !term || [chapter.title, chapter.description].filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term)),
  );

  // A conta pode existir sem grupos. Não bloqueamos o restante do aplicativo.
  if (!family) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        <View style={S.hero}>
          <Image
            source={brandLogo}
            style={S.heroLogo}
            resizeMode="contain"
            accessibilityLabel="Logotipo do Memória Viva"
          />
          <Text style={S.heroCaption}>MEMÓRIA VIVA</Text>
        </View>
        <View style={S.empty}>
          <Icon name="lock" size={31} color="#77738b" />
          <Text style={S.emptyTitle}>Suas memórias começam aqui</Text>
          <Text style={S.emptyBody}>
            Você ainda não participa de nenhum grupo. Pode criar um espaço
            privado só para você ou aguardar um convite de alguém.
          </Text>
        </View>
        <Pressable
          onPress={onCreateGroup}
          accessibilityRole="button"
          accessibilityLabel="Criar meu primeiro grupo"
          style={({ pressed }) => [S.actionButton, { marginTop: 18 }, pressed && { opacity: 0.75 }]}
        >
          <Icon name="plus" color="#fff" size={20} />
          <Text style={S.actionLabel}>Criar meu primeiro grupo</Text>
        </Pressable>
        <Text style={[S.note, { marginTop: 18 }]}>
          Nenhum grupo é público. Você decide se quer guardar suas lembranças
          individualmente ou compartilhar com pessoas convidadas.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
      <View style={S.hero}>
        <Image
          source={brandLogo}
          style={S.heroLogo}
          resizeMode="contain"
          accessibilityLabel="Logotipo do Memória Viva"
        />
        <Text style={S.heroCaption}>MEMÓRIA VIVA</Text>
      </View>

      {searchMode && (
        <View style={S.searchField}>
          <Icon name="search" size={18} color="#5a5b65" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar memórias e álbuns"
            placeholderTextColor="#8b8c95"
            autoFocus
            accessibilityLabel="Pesquisar memórias e álbuns"
            style={S.searchInput}
          />
        </View>
      )}

      <View style={S.headingRow}>
        <Text style={S.heading}>Últimas memórias</Text>
        {!!allMedia.length && (
          <Pressable onPress={onShowTimeline} accessibilityRole="button" accessibilityLabel="Ver todos os álbuns">
            <Text style={S.textLink}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      {recent.length > 0 ? recent.slice(0, searchMode ? undefined : 4).map(({ chapter, media }) => (
        <Pressable
          key={String(chapter.id) + "-" + String(media.id)}
          accessibilityRole="button"
          accessibilityLabel={"Abrir " + (media.title || "memória")}
          onPress={() => onOpenChapter(chapter)}
          style={({ pressed }) => [S.memoryRow, pressed && { opacity: 0.7 }]}
        >
          <View style={S.memoryIconBox}>
            <Icon name={mediaIcon(media.type)} size={20} color="#43445a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.memoryName} numberOfLines={1}>{media.title || "Memória sem título"}</Text>
            <Text style={S.memoryMeta} numberOfLines={1}>
              {chapter.title}{formatShortDate(media.memoryDate || media.createdAt) ? " · " + formatShortDate(media.memoryDate || media.createdAt) : ""}
            </Text>
          </View>
          <Icon name="chevron-right" size={19} color="#5b5b66" />
        </Pressable>
      )) : (
        <View style={S.empty}>
          <Icon name="image" size={28} color="#77738b" />
          <Text style={S.emptyTitle}>
            {term ? "Nenhuma memória encontrada" : "Suas memórias começam aqui"}
          </Text>
          <Text style={S.emptyBody}>
            {term ? "Experimente outro termo de pesquisa." :
              "Quando você adicionar fotos, vídeos ou áudios a um álbum, eles aparecerão nesta área."}
          </Text>
        </View>
      )}

      <View style={[S.headingRow, { marginTop: 24 }]}>
        <Text style={S.heading}>Álbuns de memórias</Text>
        {!!chapters.length && (
          <Pressable
            onPress={onShowTimeline}
            accessibilityRole="button"
            accessibilityLabel="Ver todos os álbuns em ordem cronológica"
          >
            <Text style={S.textLink}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      {albums.length ? albums.slice(0, searchMode ? undefined : 6).map((chapter) => (
        <Pressable
          key={String(chapter.id)}
          accessibilityRole="button"
          accessibilityLabel={"Abrir álbum " + chapter.title}
          onPress={() => onOpenChapter(chapter)}
          style={({ pressed }) => [S.memoryRow, pressed && { opacity: 0.7 }]}
        >
          <View style={S.memoryIconBox}>
            <Icon name="layers" size={20} color="#43445a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.memoryName} numberOfLines={1}>{chapter.title}</Text>
            <Text style={S.memoryMeta}>{chapter.media?.length || 0} registros</Text>
          </View>
          <Icon name="chevron-right" color="#5b5b66" size={19} />
        </Pressable>
      )) : (
        !term && (
          <View style={S.empty}>
            <Icon name="layers" size={27} color="#77738b" />
            <Text style={S.emptyTitle}>Nenhum álbum criado</Text>
            <Text style={S.emptyBody}>
              Os álbuns organizam as memórias do grupo {family?.name || "selecionado"} por assunto.
            </Text>
          </View>
        )
      )}

      {canManage && (
        <Pressable
          onPress={onCreateAlbum}
          accessibilityRole="button"
          accessibilityLabel="Criar novo álbum de memórias"
          style={({ pressed }) => [S.actionButton, { marginTop: 18 }, pressed && { opacity: 0.75 }]}
        >
          <Icon name="plus" color="#fff" size={19} />
          <Text style={S.actionLabel}>Criar álbum de memórias</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

export function PrototypeGroups({
  families = [],
  activeFamilyId,
  onSelectFamily,
  onEditFamily,
  onAddFamily,
  onManageMembers,
  isCurrentAdmin = false,
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
      <Text style={S.groupsTitle}>Meus grupos</Text>
      {families.length === 0 && (
        <View style={S.empty}>
          <Icon name="folder" size={28} color="#77738b" />
          <Text style={S.emptyTitle}>Nenhum grupo por enquanto</Text>
          <Text style={S.emptyBody}>
            Crie um espaço privado para suas memórias ou aceite o convite
            de alguém para participar de um grupo existente.
          </Text>
        </View>
      )}
      {families.map((family) => {
        const selected = String(family.id) === String(activeFamilyId);
        return (
          <View key={String(family.id)} style={S.groupCard}>
            <Pressable
              onPress={() => onSelectFamily(family)}
              accessibilityRole="button"
              accessibilityLabel={"Selecionar grupo " + family.name}
              style={{ flex: 1, minHeight: 44, alignItems: "center", flexDirection: "row", gap: 12 }}
            >
              <View style={S.groupIcon}>
                <Icon name="users" color="#25262e" size={25} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.groupTitle} numberOfLines={1}>{family.name}</Text>
                <Text style={S.groupHint}>{selected ? "Grupo ativo" : "Toque para abrir"}</Text>
              </View>
            </Pressable>
            {selected && isCurrentAdmin ? (
              <Pressable
                onPress={() => onEditFamily(family)}
                accessibilityRole="button"
                accessibilityLabel={"Editar grupo " + family.name}
                style={S.pencil}
              >
                <Icon name="edit-2" color="#43444c" size={18} />
              </Pressable>
            ) : (
              <Icon name="chevron-right" color="#9899a1" size={19} />
            )}
          </View>
        );
      })}
      <Pressable
        onPress={onAddFamily}
        accessibilityRole="button"
        accessibilityLabel="Adicionar um grupo"
        style={({ pressed }) => [S.addGroup, pressed && { opacity: 0.75 }]}
      >
        <Icon name="plus" color="#2b2b31" size={24} />
        <Text style={S.addGroupText}>Adicione um grupo</Text>
      </Pressable>
      {!!activeFamilyId && (
      <Pressable
        onPress={onManageMembers}
        accessibilityRole="button"
        accessibilityLabel="Gerenciar membros do grupo ativo"
        style={({ pressed }) => [S.secondaryButton, { marginTop: 20 }, pressed && { opacity: 0.7 }]}
      >
        <Icon name="user-plus" size={18} color="#33343a" />
        <Text style={S.secondaryLabel}>Integrantes do grupo ativo</Text>
      </Pressable>
      )}
    </ScrollView>
  );
}

export function PrototypeCreateFamily({ token, onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (loading) return;
    const cleaned = name.trim();
    if (cleaned.length < 2 || cleaned.length > 100) {
      setError("Digite um nome de 2 a 100 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api("/api/families", token, {
        method: "POST",
        body: JSON.stringify({ name: cleaned, description: description.trim() }),
      });
      await onCreated(result.family);
    } catch (e) {
      setError(e.message || "Não foi possível criar o grupo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={S.shell}>
      <View style={S.shellInner}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
      {!!onCancel && (
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Voltar aos meus grupos"
          style={{ width: 44, minHeight: 44, justifyContent: "center" }}
        >
          <Icon name="arrow-left" size={21} color="#24252c" />
        </Pressable>
      )}
      <Text style={S.formTitle}>Criar grupo</Text>
      <View style={S.coverPlaceholder}>
        <Text style={[S.note, { marginBottom: 9 }]}>Capa do grupo</Text>
        <View style={S.coverInner}>
          <Icon name="image" size={36} color="#8a8a95" />
        </View>
      </View>
      <View style={S.field}>
        <Text style={S.label}>Nome do grupo</Text>
        <TextInput
          style={S.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Viagens, Família, Amigos..."
          placeholderTextColor="#92939a"
          maxLength={100}
          accessibilityLabel="Nome do grupo"
        />
      </View>
      <View style={S.field}>
        <Text style={S.label}>Descrição (opcional)</Text>
        <TextInput
          style={[S.input, { minHeight: 90, paddingVertical: 13, textAlignVertical: "top" }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Conte um pouco sobre este grupo"
          placeholderTextColor="#92939a"
          multiline
          accessibilityLabel="Descrição do grupo"
        />
      </View>
      <Text style={S.note}>Você será o administrador deste grupo. A capa poderá ser configurada em uma próxima etapa.</Text>
      {!!error && (
        <View style={S.error} accessibilityRole="alert">
          <Text style={S.errorText}>{error}</Text>
        </View>
      )}
      <Pressable
        onPress={create}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
        style={({ pressed }) => [S.actionButton, (loading || pressed) && { opacity: 0.7 }]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.actionLabel}>Criar grupo</Text>}
      </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
