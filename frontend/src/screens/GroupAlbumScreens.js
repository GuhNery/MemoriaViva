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
          { name: "settings", label: "Configurações do grupo", onPress: onSettings },
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
  // Sem setas entre cartões: o eixo contínuo com marcos numerados indica a
  // sequência. Registros sem data ficam no fim, sem inventar sua posição.
  const [oldestFirst, setOldestFirst] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");

  const items = useMemo(() => {
    const arr = [...(album?.media || [])];
    arr.sort((a, b) => {
      if (!a.memoryDate && !b.memoryDate) {
        const order = String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
        return oldestFirst ? order : -order;
      }
      if (!a.memoryDate) return 1;
      if (!b.memoryDate) return -1;
      const delta = String(a.memoryDate).localeCompare(String(b.memoryDate));
      if (delta) return oldestFirst ? delta : -delta;
      const uploaded = String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      return oldestFirst ? uploaded : -uploaded;
    });
    const lookup = term.trim().toLocaleLowerCase("pt-BR");
    return lookup
      ? arr.filter((item) => [item.title, item.place, item.story].filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(lookup)))
      : arr;
  }, [album?.media, oldestFirst, term]);

  const orderText = oldestFirst ? "Mais antigas primeiro" : "Mais recentes primeiro";

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
          style={{ width: "100%", height: 155, borderRadius: 14, marginBottom: 20 }}
          resizeMode="cover" />
      )}

      <Text style={[S.heading, { fontSize: 20, marginBottom: 8 }]}>Linha do tempo</Text>
      <Text style={[S.emptyBody, { textAlign: "left", marginBottom: 16 }]}>
        Cada lembrança aparece na data em que aconteceu, não na data do envio.
      </Text>

      <View style={{
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        gap: 10, marginBottom: 23, paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 12, backgroundColor: "#f6f4fa",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="clock" size={16} color="#6c6387" />
          <Text style={{ color: "#5e5672", fontSize: 12, fontWeight: "600" }}>
            {items.length} {items.length === 1 ? "lembrança" : "lembranças"}
          </Text>
        </View>
        <Pressable
          onPress={() => setOldestFirst((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={"Alterar ordem. Atual: " + orderText}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 42 }}
        >
          <Icon name="repeat" size={17} color="#4b455d" />
          <Text style={{ color: "#464153", fontSize: 11, fontWeight: "700", textAlign: "right" }}>
            {orderText}
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

      {items.length > 0 && (
        <View style={{ marginBottom: 17, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 38, alignItems: "center" }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#766b97" }} />
          </View>
          <Text style={{ color: "#777084", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 }}>
            INÍCIO DA SEQUÊNCIA
          </Text>
        </View>
      )}

      {items.map((media, index) => {
        const last = index === items.length - 1;
        const year = media.memoryDate ? String(media.memoryDate).slice(0, 4) : "Data não informada";
        const previous = index ? items[index - 1] : null;
        const previousYear = previous?.memoryDate ? String(previous.memoryDate).slice(0, 4) : "Data não informada";
        return (
          <View key={String(media.id)}>
            {(index === 0 || year !== previousYear) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <View style={{ width: 38, alignItems: "center" }}>
                  <View style={{ width: 2, height: 17, backgroundColor: "#c9c1d7" }} />
                </View>
                <Text style={{ color: "#766b90", fontSize: 13, fontWeight: "700" }}>
                  {year}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", alignItems: "stretch", gap: 11 }}>
              <View style={{ width: 38, alignItems: "center" }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: "#22212d", justifyContent: "center", alignItems: "center",
                  zIndex: 1,
                }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>{index + 1}</Text>
                </View>
                <View style={{
                  flex: 1, minHeight: 19,
                  width: 2, backgroundColor: last ? "transparent" : "#c9c1d7",
                }} />
              </View>
              <Pressable
                onPress={() => onOpenMemory(media)}
                accessibilityRole="button"
                accessibilityLabel={`Lembrança ${index + 1} de ${items.length}, ${media.title || "sem título"}, ${dateLabel(media.memoryDate)}`}
                style={({ pressed }) => [{
                  flex: 1, minWidth: 0, marginBottom: last ? 3 : 19,
                  padding: 12, borderRadius: 15, borderWidth: 1, borderColor: "#eae8ee",
                  backgroundColor: "#fff", elevation: 2, opacity: pressed ? 0.68 : 1,
                }]}
              >
                <Text style={{ color: "#5c5473", fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                  {dateLabel(media.memoryDate)}
                </Text>
                <Text numberOfLines={2} style={{ color: BASE, fontSize: 15, fontWeight: "800", marginBottom: 11 }}>
                  {media.title || "Lembrança"}
                </Text>
                <View style={{
                  minHeight: 145, backgroundColor: "#f2f0f5",
                  borderRadius: 10, alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {media.type === "image" ? (
                    <Image source={{ uri: assetUrl(media.url) }}
                      style={{ width: "100%", height: 155 }} resizeMode="cover" />
                  ) : (
                    <View style={{ alignItems: "center", gap: 7, padding: 18 }}>
                      <Icon name={media.type === "video" ? "film" : media.type === "audio" ? "headphones" : "file"} size={31} color="#6e6686" />
                      <Text style={{ color: "#686075", fontSize: 12 }}>
                        {media.type === "video" ? "Vídeo" : media.type === "audio" ? "Áudio" : "Arquivo"}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 11, gap: 7 }}>
                  {!!media.place && (
                    <>
                      <Icon name="map-pin" size={12} color="#7e7887" />
                      <Text numberOfLines={1} style={{ color: "#7e7887", fontSize: 11, flex: 1 }}>
                        {media.place}
                      </Text>
                    </>
                  )}
                  <Icon name="chevron-right" size={17} color="#555068" />
                </View>
              </Pressable>
            </View>
          </View>
        );
      })}

      {items.length ? (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 8, marginBottom: 18 }}>
          <View style={{ width: 38, alignItems: "center" }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#766b97" }} />
          </View>
          <Text style={{ color: "#777084", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 }}>
            FIM DA SEQUÊNCIA
          </Text>
        </View>
      ) : (
        <View style={S.empty}>
          <Icon name="image" size={35} color="#888591" />
          <Text style={S.emptyTitle}>
            {term ? "Nenhuma lembrança encontrada" : "Este álbum está vazio"}
          </Text>
          <Text style={S.emptyBody}>
            Suas fotos, vídeos e áudios aparecerão aqui, com a data escolhida para cada lembrança.
          </Text>
          {!term && (
            <Pressable
              onPress={onAddMemory}
              accessibilityRole="button"
              style={[S.actionButton, { marginTop: 12 }]}
            >
              <Icon name="plus" size={17} color="#fff" />
              <Text style={S.actionLabel}>Adicionar primeira lembrança</Text>
            </Pressable>
          )}
        </View>
      )}
    </Screen>
  );
}
