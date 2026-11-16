import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { assetUrl } from "../services/api";
import { Icon } from "../components/ui";
import S from "../theme/prototypeInternalStyles";

const logo = require("../../assets/logo-memoria-viva.jpg");

function niceDate(date) {
  if (!date) return "Sem data da lembrança";
  const parsed = new Date(String(date).slice(0, 10) + "T12:00:00");
  return Number.isNaN(parsed.getTime()) ? "Data não informada" : parsed.toLocaleDateString("pt-BR");
}

export function HomeDashboard({
  user, families = [], recentMemories = [], stats = null, invitationsCount = 0,
  onOpenGroup, onOpenMedia, onGroups, onCreateGroup, searchMode = false,
}) {
  const [term, setTerm] = useState("");
  const q = term.trim().toLocaleLowerCase("pt-BR");
  const recent = useMemo(() => recentMemories.filter((item) =>
    !q || [item.media.title, item.album.title, item.group.name]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase("pt-BR").includes(q))
  ), [recentMemories, q]);
  const shownGroups = families.filter((g) => !q || g.name.toLocaleLowerCase("pt-BR").includes(q));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
      <View style={[S.hero, { minHeight: 157, marginTop: 8, marginBottom: 25 }]}>
        <Image source={logo} style={{ width: 82, height: 82, borderRadius: 41 }} resizeMode="contain" />
        <Text style={[S.heroCaption, { marginTop: 8 }]}>MEMÓRIA VIVA</Text>
      </View>

      {!searchMode && (
        <View style={{ marginBottom: 24 }}>
          <Text style={[S.heading, { fontSize: 16, marginBottom: 12 }]}>Seu espaço</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { label: "Grupos", icon: "users", value: stats ? stats.groups : "—" },
              { label: "Álbuns", icon: "layers", value: stats ? stats.albums : "—" },
              { label: "Memórias", icon: "image", value: stats ? stats.memories : "—" },
            ].map((item) => (
              <View key={item.label} style={{
                flex: 1, minWidth: 0,
                paddingVertical: 13, paddingHorizontal: 7,
                backgroundColor: "#f8f7fb", borderRadius: 12,
                borderWidth: 1, borderColor: "#efedf4",
                justifyContent: "center", alignItems: "center", gap: 6,
              }}>
                <Icon name={item.icon} size={18} color="#746b92" />
                <Text style={{ fontSize: 21, color: "#1c1d25", fontWeight: "800" }}>
                  {item.value}
                </Text>
                <Text style={{ fontSize: 11, color: "#777582" }}>{item.label}</Text>
              </View>
            ))}
          </View>
          {stats?.partial && (
            <Text style={[S.memoryMeta, { marginTop: 9, textAlign: "center" }]}>
              Alguns grupos não carregaram; totais de álbuns e memórias podem estar incompletos.
            </Text>
          )}
        </View>
      )}

      {searchMode && (
        <View style={S.searchField}>
          <Icon name="search" size={18} color="#76737f" />
          <TextInput value={term} onChangeText={setTerm} autoFocus
            placeholder="Pesquisar grupos e memórias" placeholderTextColor="#91909a"
            style={S.searchInput} accessibilityLabel="Pesquisar meus grupos e memórias" />
        </View>
      )}

      <View style={S.headingRow}>
        <Text style={S.heading}>Últimas memórias</Text>
      </View>

      {!recent.length ? (
        <View style={S.empty}>
          <Icon name="image" size={28} color="#827a9a" />
          <Text style={S.emptyTitle}>{q ? "Nenhuma memória encontrada" : "Suas histórias começam aqui"}</Text>
          <Text style={S.emptyBody}>
            {q ? "Tente outra pesquisa." : "Quando você adicionar lembranças aos seus álbuns, elas aparecerão aqui."}
          </Text>
        </View>
      ) : (
        recent.slice(0, 4).map(({ group, album, media }) => (
          <Pressable
            key={String(group.id) + "-" + String(album.id) + "-" + String(media.id)}
            onPress={() => onOpenMedia({ group, album, media })}
            accessibilityRole="button"
            accessibilityLabel={"Abrir " + media.title}
            style={({ pressed }) => [S.memoryRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[S.memoryIconBox, { width: 43, height: 43, overflow: "hidden" }]}>
              {media.type === "image" ? (
                <Image source={{ uri: assetUrl(media.url) }}
                  style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : <Icon name={media.type === "video" ? "film" : "headphones"} size={21} color="#55516b" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.memoryName} numberOfLines={1}>{media.title || "Lembrança"}</Text>
              <Text style={S.memoryMeta} numberOfLines={1}>{group.name} · {album.title}</Text>
              <Text style={S.memoryMeta}>{niceDate(media.memoryDate)}</Text>
            </View>
            <Icon name="chevron-right" size={19} color="#55535e" />
          </Pressable>
        ))
      )}

      <View style={[S.headingRow, { marginTop: 28 }]}>
        <Text style={S.heading}>Meus grupos</Text>
        {!!families.length && (
          <Pressable onPress={onGroups} accessibilityRole="button" accessibilityLabel="Ver todos os grupos">
            <Text style={S.textLink}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      {shownGroups.length ? shownGroups.slice(0, 3).map((group) => (
        <Pressable
          key={String(group.id)}
          onPress={() => onOpenGroup(group)}
          accessibilityRole="button"
          accessibilityLabel={"Entrar no grupo " + group.name}
          style={({ pressed }) => [S.groupCard, pressed && { opacity: 0.7 }]}
        >
          <View style={[S.groupIcon, { width: 46, height: 46, borderRadius: 9, overflow: "hidden", backgroundColor: "#f2f0f8" }]}>
            {group.photoUrl ? (
              <Image source={{ uri: assetUrl(group.photoUrl) }}
                style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : <Icon name="users" size={25} color="#36354a" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.groupTitle} numberOfLines={1}>{group.name}</Text>
            <Text style={S.groupHint}><Icon name="lock" size={10} color="#6e6a78" /> Privado</Text>
          </View>
          <Icon name="chevron-right" size={19} color="#777482" />
        </Pressable>
      )) : (
        !q && (
          <View style={S.empty}>
            <Icon name="users" size={30} color="#817a96" />
            <Text style={S.emptyTitle}>Você ainda não participa de grupos</Text>
            <Text style={S.emptyBody}>
              Crie um espaço privado só para você ou aceite um convite de alguém.
            </Text>
          </View>
        )
      )}

      {!families.length && (
        <Pressable
          onPress={onCreateGroup}
          accessibilityRole="button" accessibilityLabel="Criar meu primeiro grupo"
          style={({ pressed }) => [S.actionButton, { marginTop: 17 }, pressed && { opacity: 0.7 }]}
        >
          <Icon name="plus" size={19} color="#fff" />
          <Text style={S.actionLabel}>Criar meu primeiro grupo</Text>
        </Pressable>
      )}
      {invitationsCount > 0 && (
        <Pressable
          onPress={onGroups}
          accessibilityRole="button" accessibilityLabel="Ver convites pendentes"
          style={[S.secondaryButton, { marginTop: 12 }]}
        >
          <Icon name="mail" color="#615b79" size={18} />
          <Text style={S.secondaryLabel}>
            {invitationsCount} {invitationsCount === 1 ? "convite pendente" : "convites pendentes"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
