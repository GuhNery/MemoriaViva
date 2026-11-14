import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { assetUrl, COLORS } from "../services/api";
import { Icon, Screen } from "../components/ui";
import S from "../theme/prototypeInternalStyles";
const BASE = "#17191f";

function CircleAction({ name, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{
        height: 43, width: 43, borderRadius: 23, backgroundColor: "#fff",
        borderWidth: 1, borderColor: "#eeeef1",
        alignItems: "center", justifyContent: "center",
        elevation: 2, opacity: pressed ? 0.6 : 1,
      }]}
    >
      <Icon name={name} size={19} color={BASE} />
    </Pressable>
  );
}

function TopActions({ title, onBack, actions = [] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18, paddingTop: 4 }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={{ width: 38, minHeight: 45, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="chevron-left" size={23} color={BASE} />
      </Pressable>
      <Text style={{ flex: 1, fontSize: 19, fontWeight: "700", color: BASE }} numberOfLines={1}>
        {title}
      </Text>
      {actions.map((a) => <CircleAction key={a.label} {...a} />)}
    </View>
  );
}

export function GroupDashboard({
  family, albums = [], onBack, onOpenAlbum, onCreateAlbum,
  onEditAlbum, onMembers, onSettings, canManage = false,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const shown = albums.filter((album) =>
    String(album.title || "").toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR"))
  );

  return (
    <Screen>
      <TopActions
        title={family.name}
        onBack={onBack}
        actions={[
          { name: "search", label: "Pesquisar álbuns do grupo", onPress: () => setSearchOpen((v) => !v) },
          { name: "user-plus", label: "Ver participantes e convites", onPress: onMembers },
          { name: "users", label: "Configurações do grupo", onPress: onSettings },
        ]}
      />
      <View style={{
        backgroundColor: BASE, minHeight: family.photoUrl ? 168 : 130,
        borderRadius: 15, marginBottom: 22, overflow: "hidden",
        alignItems: "center", justifyContent: "center",
      }}>
        {family.photoUrl ? (
          <Image source={{ uri: assetUrl(family.photoUrl) }}
            style={{ width: "100%", height: 168 }} resizeMode="cover" />
        ) : (
          <>
            <Icon name="users" size={34} color="#e4deef" />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 8 }}>
              {family.name}
            </Text>
          </>
        )}
      </View>
      <View style={[S.headingRow, { marginBottom: 8 }]}>
        <Text style={S.heading}>Álbuns deste grupo</Text>
        <Text style={S.memoryMeta}>{albums.length} {albums.length === 1 ? "álbum" : "álbuns"}</Text>
      </View>
      <Text style={[S.emptyBody, { textAlign: "left", marginBottom: 19 }]}>
        Um espaço privado para suas histórias. Selecione um álbum para ver suas lembranças.
      </Text>
      {searchOpen && (
        <View style={S.searchField}>
          <Icon name="search" size={18} color="#797784" />
          <TextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Buscar álbum..."
            placeholderTextColor="#93919a"
            style={S.searchInput}
            accessibilityLabel="Buscar álbuns neste grupo"
          />
        </View>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 13 }}>
        {shown.map((album) => (
          <View key={String(album.id)} style={{ width: "47%", marginBottom: 5 }}>
            <Pressable
              onPress={() => onOpenAlbum(album)}
              accessibilityRole="button"
              accessibilityLabel={"Abrir álbum " + album.title}
              style={({ pressed }) => [{
                minHeight: 168, padding: 8, borderRadius: 14,
                borderWidth: 1, borderColor: "#eae8ee",
                backgroundColor: "#fff", elevation: 2,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 23 }}>
                <Text style={{ color: BASE, fontSize: 12, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                  {album.title}
                </Text>
                {canManage && (
                  <Pressable
                    onPress={(e) => { e?.stopPropagation?.(); onEditAlbum(album); }}
                    accessibilityRole="button"
                    accessibilityLabel={"Editar álbum " + album.title}
                    style={{ minWidth: 27, minHeight: 27, alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon name="edit-2" size={15} color="#4d4c57" />
                  </Pressable>
                )}
              </View>
              <View style={{
                flex: 1, backgroundColor: "#f6f5f8", borderRadius: 9,
                overflow: "hidden", alignItems: "center", justifyContent: "center",
              }}>
                {album.coverUrl ? (
                  <Image source={{ uri: assetUrl(album.coverUrl) }}
                    style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <Icon name="image" size={30} color="#9a97a4" />
                )}
              </View>
              <Text style={{ color: "#878591", fontSize: 10, marginTop: 8 }}>
                {album.media?.length || 0} {(album.media?.length || 0) === 1 ? "lembrança" : "lembranças"}
              </Text>
            </Pressable>
          </View>
        ))}
        {canManage && !term && (
          <Pressable
            onPress={onCreateAlbum}
            accessibilityRole="button"
            accessibilityLabel="Criar álbum de memórias neste grupo"
            style={({ pressed }) => [{
              width: "47%", minHeight: 168, borderRadius: 14,
              backgroundColor: "#f6f5f8", borderWidth: 1, borderColor: "#eae8ee",
              alignItems: "center", justifyContent: "center", gap: 14,
              opacity: pressed ? 0.7 : 1,
            }]}
          >
            <View style={{ backgroundColor: "#fff", padding: 18, borderRadius: 11 }}>
              <Icon name="plus-square" size={31} color={BASE} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: BASE }}>Criar álbum</Text>
          </Pressable>
        )}
      </View>
      {!shown.length && !!term && (
        <View style={S.empty}><Text style={S.emptyBody}>Nenhum álbum com esse nome.</Text></View>
      )}
      {!albums.length && !canManage && (
        <View style={S.empty}>
          <Text style={S.emptyTitle}>Ainda não há álbuns.</Text>
          <Text style={S.emptyBody}>O administrador poderá criar o primeiro.</Text>
        </View>
      )}
    </Screen>
  );
}

function dateLabel(date) {
  if (!date) return "Sem data";
  const parsed = new Date(String(date).slice(0, 10) + "T12:00:00");
  return Number.isNaN(parsed.getTime()) ? "Sem data" : parsed.toLocaleDateString("pt-BR");
}

export function AlbumSequence({ album, onBack, onAddMemory, onOpenMemory }) {
  const [oldestFirst, setOldestFirst] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");

  const items = useMemo(() => {
    const arr = [...(album?.media || [])];
    arr.sort((a, b) => {
      if (!a.memoryDate && !b.memoryDate) return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      if (!a.memoryDate) return 1;
      if (!b.memoryDate) return -1;
      const delta = String(a.memoryDate).localeCompare(String(b.memoryDate));
      return oldestFirst ? delta : -delta;
    });
    return arr.filter((m) => [m.title,m.place,m.story].filter(Boolean)
      .some((v) => String(v).toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR"))));
  }, [album?.media, oldestFirst, term]);

  return (
    <Screen>
      <TopActions
        title={album.title}
        onBack={onBack}
        actions={[
          { name: "plus-circle", label: "Adicionar memória ao álbum", onPress: onAddMemory },
          { name: "search", label: "Buscar lembranças no álbum", onPress: () => setSearchOpen((v) => !v) },
        ]}
      />
      {!!album.coverUrl && (
        <Image source={{ uri: assetUrl(album.coverUrl) }}
          style={{ width: "100%", height: 150, borderRadius: 14, marginBottom: 20 }}
          resizeMode="cover" />
      )}
      <View style={S.headingRow}>
        <Text style={[S.heading, { fontSize: 17 }]}>Sequência de lembranças</Text>
        <Pressable
          onPress={() => setOldestFirst((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Inverter ordem cronológica"
          style={{ minHeight: 40, flexDirection: "row", alignItems: "center", gap: 5 }}
        >
          <Icon name="repeat" size={15} color="#626078" />
          <Text style={[S.memoryMeta, { color: "#58546d" }]}>
            {oldestFirst ? "Mais antigas primeiro" : "Mais recentes primeiro"}
          </Text>
        </Pressable>
      </View>
      {searchOpen && (
        <View style={S.searchField}>
          <Icon name="search" size={18} color="#858391" />
          <TextInput
            value={term} onChangeText={setTerm}
            placeholder="Buscar lembrança..."
            placeholderTextColor="#92919a"
            style={S.searchInput}
            accessibilityLabel="Buscar lembranças no álbum"
          />
        </View>
      )}
      <View style={{ paddingHorizontal: 7, paddingBottom: 65 }}>
        {items.map((media, index) => (
          <View key={String(media.id)}>
            <View style={{ flexDirection: "row", justifyContent: index % 2 ? "flex-end" : "flex-start" }}>
              <Pressable
                onPress={() => onOpenMemory(media)}
                accessibilityRole="button"
                accessibilityLabel={"Abrir lembrança " + (media.title || "sem título")}
                style={({ pressed }) => [{
                  width: "52%", borderRadius: 13, padding: 8,
                  backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e8ec",
                  elevation: 2, opacity: pressed ? 0.7 : 1,
                }]}
              >
                <View style={{ minHeight: 24, flexDirection: "row", justifyContent: "space-between", gap: 5 }}>
                  <Text style={{ fontSize: 12, color: BASE, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                    {media.title || "Lembrança"}
                  </Text>
                  <Icon name="chevron-right" size={16} color="#55545e" />
                </View>
                <View style={{
                  height: 118, backgroundColor: "#f2f1f4", borderRadius: 9,
                  alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {media.type === "image" ? (
                    <Image source={{ uri: assetUrl(media.url) }}
                      style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : <Icon name={media.type === "video" ? "film" : media.type === "audio" ? "headphones" : "file"} size={30} color="#888591" />}
                </View>
                <Text style={{ color: "#777580", fontSize: 11, marginTop: 8 }}>
                  {dateLabel(media.memoryDate)}
                </Text>
              </Pressable>
            </View>
            {index < items.length - 1 && (
              <View style={{ alignItems: index % 2 ? "flex-end" : "flex-start", paddingHorizontal: "27%", height: 56 }}>
                <View style={{ height: 40, borderLeftWidth: 1.5, borderStyle: "dashed", borderLeftColor: "#a7a4ad" }} />
                <Icon name="arrow-down" size={17} color="#918e9a" />
              </View>
            )}
          </View>
        ))}
        {!items.length && (
          <View style={S.empty}>
            <Icon name="image" size={35} color="#888591" />
            <Text style={S.emptyTitle}>{term ? "Nenhuma lembrança encontrada" : "Este álbum está vazio"}</Text>
            <Text style={S.emptyBody}>Adicione fotos, vídeos ou áudios. Eles aparecerão em ordem cronológica.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
