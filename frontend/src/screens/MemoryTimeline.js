import React, { useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { assetUrl, COLORS } from "../services/api";
import { Icon, Screen } from "../components/ui";
import S from "../theme/prototypeInternalStyles";

function memoryDateLabel(raw) {
  if (!raw) return "Data da lembrança não informada";
  const date = new Date(String(raw).slice(0, 10) + "T12:00:00");
  return Number.isNaN(date.getTime()) ? "Data não informada" :
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export function MemoryTimeline({ chapters = [], onOpen, onOpenMedia, onBack }) {
  const [oldestFirst, setOldestFirst] = useState(false);

  const groups = useMemo(() => {
    const entries = chapters.flatMap((album) =>
      (album.media || []).map((media) => ({ album, media }))
    );
    const dated = entries.filter((entry) => !!entry.media.memoryDate);
    const undated = entries.filter((entry) => !entry.media.memoryDate);
    dated.sort((a, b) => {
      const comparison = String(a.media.memoryDate).localeCompare(String(b.media.memoryDate));
      return oldestFirst ? comparison : -comparison;
    });
    undated.sort((a, b) =>
      String(b.media.createdAt || "").localeCompare(String(a.media.createdAt || ""))
    );
    const list = dated.concat(undated);
    return list.reduce((acc, entry) => {
      const label = entry.media.memoryDate
        ? String(entry.media.memoryDate).slice(0, 4)
        : "Sem data definida";
      const last = acc[acc.length - 1];
      if (last && last.label === label) {
        last.entries.push(entry);
      } else {
        acc.push({ label, entries: [entry] });
      }
      return acc;
    }, []);
  }, [chapters, oldestFirst]);

  const total = groups.reduce((n, group) => n + group.entries.length, 0);

  return (
    <Screen>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar para o Início"
        style={{ minHeight: 45, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 11 }}
      >
        <Icon name="arrow-left" size={21} color={COLORS.ink} />
        <Text style={S.secondaryLabel}>Voltar ao Início</Text>
      </Pressable>
      <Text style={[S.heading, { fontSize: 24 }]}>Linha do tempo</Text>
      <Text style={[S.emptyBody, { textAlign: "left", marginTop: 9, marginBottom: 23 }]}>
        Reviva suas histórias pela data em que cada lembrança aconteceu,
        independentemente de quando foi enviada.
      </Text>
      <View style={[S.headingRow, { marginBottom: 19 }]}>
        <Text style={[S.memoryMeta, { fontSize: 12 }]}>
          {total} {total === 1 ? "lembrança" : "lembranças"}
        </Text>
        <Pressable
          onPress={() => setOldestFirst((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={oldestFirst ? "Ordenar das mais recentes para as antigas" : "Ordenar das mais antigas para as recentes"}
          style={[S.secondaryButton, { paddingHorizontal: 11, minHeight: 41 }]}
        >
          <Icon name="repeat" size={16} color="#595277" />
          <Text style={S.secondaryLabel}>
            {oldestFirst ? "Antigas primeiro" : "Recentes primeiro"}
          </Text>
        </Pressable>
      </View>
      {!total && (
        <View style={S.empty}>
          <Icon name="clock" size={29} color="#7a7199" />
          <Text style={S.emptyTitle}>A linha do tempo está vazia</Text>
          <Text style={S.emptyBody}>Adicione uma foto, vídeo ou áudio a um álbum para começar.</Text>
        </View>
      )}
      {groups.map((group) => (
        <View key={group.label} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: "#8176a7" }} />
            <Text style={[S.heading, { fontSize: 17 }]}>{group.label}</Text>
          </View>
          <View style={{ borderLeftWidth: 2, borderLeftColor: "#e2ddec", marginLeft: 5, paddingLeft: 20 }}>
            {group.entries.map(({ album, media }) => (
              <Pressable
                key={String(album.id) + "-" + String(media.id)}
                onPress={() => onOpenMedia(media, album)}
                accessibilityRole="button"
                accessibilityLabel={"Abrir " + (media.title || "lembrança") + " no álbum " + album.title}
                style={({ pressed }) => [S.memoryRow, { paddingHorizontal: 11 }, pressed && { opacity: 0.72 }]}
              >
                <View style={[S.memoryIconBox, { width: 53, height: 53 }]}>
                  {media.type === "image" ? (
                    <Image
                      source={{ uri: assetUrl(media.url) }}
                      style={{ width: 53, height: 53, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Icon name={media.type === "video" ? "film" : media.type === "audio" ? "volume-2" : "file-text"} size={23} color="#595277" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.memoryName} numberOfLines={2}>{media.title || "Lembrança"}</Text>
                  <Text style={S.memoryMeta} numberOfLines={1}>{album.title}</Text>
                  <Text style={[S.memoryMeta, { color: "#655b80" }]}>{memoryDateLabel(media.memoryDate)}</Text>
                </View>
                <Icon name="chevron-right" size={19} color="#797688" />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
