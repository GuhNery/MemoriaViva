import React, { useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { api, COLORS } from "../services/api";
import { Icon, Screen } from "../components/ui";
import S from "../theme/prototypeInternalStyles";

function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T12:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function CreateMemory({ album, token, onBack, onSaved }) {
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [place, setPlace] = useState("");
  const [story, setStory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const choose = async () => {
    if (saving) return;
    try {
      setError("");
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "video/*", "audio/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.[0]) setSelected(result.assets[0]);
    } catch (e) {
      setError(e.message || "Não foi possível selecionar o arquivo.");
    }
  };

  const save = async () => {
    if (saving) return;
    if (!selected) return setError("Selecione uma foto, vídeo ou áudio.");
    if (title.trim().length < 2 || title.trim().length > 150) {
      return setError("Informe o nome da lembrança (2 a 150 caracteres).");
    }
    if (!validateDate(memoryDate)) {
      return setError("Informe uma data válida no formato AAAA-MM-DD.");
    }
    if (place.length > 160 || story.length > 10000) {
      return setError("Local ou história ultrapassam o tamanho permitido.");
    }

    try {
      setSaving(true);
      setError("");
      const form = new FormData();
      form.append("title", title.trim());
      form.append("memoryDate", memoryDate);
      form.append("place", place.trim());
      form.append("story", story.trim());

      const name = selected.name || `memoria-${Date.now()}`;
      const mimetype = selected.mimeType || "application/octet-stream";
      if (Platform.OS === "web") {
        let file = selected.file;
        if (!file && selected.uri) file = await (await fetch(selected.uri)).blob();
        if (!file) throw new Error("O arquivo selecionado não está disponível.");
        form.append("file", file, name);
      } else {
        form.append("file", { uri: selected.uri, name, type: mimetype });
      }

      const saved = await api(`/api/chapters/${album.id}/media`, token, {
        method: "POST", body: form,
      });
      await onSaved(saved.media);
    } catch (e) {
      setError(e.message || "Não foi possível armazenar a lembrança.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Pressable
        onPress={onBack}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Cancelar e voltar ao álbum"
        style={{ minHeight: 50, justifyContent: "center", alignSelf: "flex-start" }}
      >
        <Icon name="arrow-left" size={23} color={COLORS.ink} />
      </Pressable>

      <Text style={[S.heading, { fontSize: 23, textAlign: "center", marginBottom: 12 }]}>Criar memória</Text>
      <Text style={[S.emptyBody, { marginBottom: 14 }]}>
        Álbum: {album?.title}. Organize suas lembranças pelo dia em que aconteceram.
      </Text>

      <Pressable
        onPress={choose}
        accessibilityRole="button"
        accessibilityLabel="Escolher foto, vídeo ou áudio"
        style={({ pressed }) => [{
          width: 192, height: 188, borderWidth: 1, borderColor: "#ecebf0",
          borderRadius: 15, backgroundColor: "#fcfafc", alignSelf: "center",
          padding: 10, alignItems: "center", justifyContent: "center",
          marginTop: 8, marginBottom: 29, opacity: pressed ? 0.7 : 1,
        }]}
      >
        <Text style={{ fontSize: 11, color: "#666373", marginBottom: 10 }}>
          {selected ? "Trocar arquivo" : "Armazenar memória"}
        </Text>
        <View style={{
          width: "100%", flex: 1, alignItems: "center", justifyContent: "center",
          backgroundColor: "#f3f2f5", borderRadius: 10, overflow: "hidden",
        }}>
          {selected?.mimeType?.startsWith("image/") && selected.uri ? (
            <Image source={{ uri: selected.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Icon name={selected?.mimeType?.startsWith("video/") ? "film" : selected?.mimeType?.startsWith("audio/") ? "headphones" : "image"} color="#8d8996" size={35} />
          )}
        </View>
        {selected && (
          <Text style={[S.memoryMeta, { marginTop: 6, textAlign: "center" }]} numberOfLines={1}>
            {selected.name}
          </Text>
        )}
      </Pressable>

      <View style={S.field}>
        <Text style={S.label}>Nome da memória</Text>
        <TextInput value={title} onChangeText={setTitle} maxLength={150}
          placeholder="Ex.: Passeio no Coliseu" placeholderTextColor="#898793"
          style={S.input} accessibilityLabel="Nome da memória" />
      </View>
      <View style={S.field}>
        <Text style={S.label}>Data da memória</Text>
        <TextInput value={memoryDate} onChangeText={setMemoryDate} maxLength={10}
          placeholder="AAAA-MM-DD" placeholderTextColor="#898793"
          style={S.input} accessibilityLabel="Data em que a memória aconteceu" />
      </View>
      <View style={S.field}>
        <Text style={S.label}>Local (opcional)</Text>
        <TextInput value={place} onChangeText={setPlace} maxLength={160}
          placeholder="Ex.: Roma, Itália" placeholderTextColor="#898793"
          style={S.input} accessibilityLabel="Local da memória" />
      </View>
      <View style={S.field}>
        <Text style={S.label}>História (opcional)</Text>
        <TextInput value={story} onChangeText={setStory} multiline
          placeholder="Conte a história por trás desta lembrança..."
          placeholderTextColor="#898793"
          style={[S.input, { minHeight: 105, textAlignVertical: "top", paddingVertical: 12 }]}
          accessibilityLabel="História da memória" />
      </View>
      {!!error && <View style={S.error}><Text style={S.errorText}>{error}</Text></View>}
      <Pressable onPress={save} disabled={saving}
        accessibilityRole="button" accessibilityLabel="Armazenar memória"
        style={({ pressed }) => [S.actionButton, { marginBottom: 11 }, (pressed || saving) && { opacity: 0.6 }]}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.actionLabel}>Criar memória</Text>}
      </Pressable>
      <Pressable onPress={onBack} disabled={saving} accessibilityRole="button" style={S.secondaryButton}>
        <Text style={S.secondaryLabel}>Cancelar</Text>
      </Pressable>
    </Screen>
  );
}
