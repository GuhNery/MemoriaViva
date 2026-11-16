import React, { useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api, assetUrl } from "../services/api";
import { Icon } from "./ui";
import S from "../theme/prototypeInternalStyles";

export async function pickCoverImage() {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error("Permita acesso às fotos para selecionar a capa.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.82,
  });
  return !result.canceled ? result.assets?.[0] || null : null;
}

export function fileFormData(asset) {
  const form = new FormData();
  if (Platform.OS === "web") {
    // ImagePicker fornece File no navegador; Blob é o fallback.
    return (async () => {
      const file = asset.file || await (await fetch(asset.uri)).blob();
      form.append("file", file, asset.fileName || "capa.jpg");
      return form;
    })();
  }
  form.append("file", {
    uri: asset.uri,
    name: asset.fileName || "capa.jpg",
    type: asset.mimeType || "image/jpeg",
  });
  return Promise.resolve(form);
}

export async function uploadCover({ kind, id, token, asset }) {
  if (!asset) return null;
  const form = await fileFormData(asset);
  const route = kind === "group" ? `/api/families/${id}/cover` : `/api/chapters/${id}/cover`;
  return api(route, token, { method: "POST", body: form });
}

export function CoverField({ value, selected, onPick, busy = false, label = "Adicionar capa", small = false }) {
  const [picking, setPicking] = useState(false);
  const choose = async () => {
    if (busy || picking) return;
    setPicking(true);
    try {
      const asset = await pickCoverImage();
      if (asset) onPick?.(asset);
    } catch (e) {
      // O formulário apresenta erros de upload; a escolha é reversível.
      console.warn("Não foi possível escolher a imagem:", e?.message);
    } finally {
      setPicking(false);
    }
  };
  const uri = selected?.uri || (value ? assetUrl(value) : null);
  return (
    <Pressable
      onPress={choose}
      disabled={busy || picking}
      accessibilityRole="button"
      accessibilityLabel={uri ? "Trocar foto de capa" : label}
      style={({ pressed }) => [{
        alignSelf: "center",
        width: small ? 122 : 184,
        height: small ? 130 : 192,
        padding: 10,
        backgroundColor: "#faf9fc",
        borderWidth: 1,
        borderColor: "#eeeeef",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: pressed || busy ? 0.75 : 1,
        marginVertical: 13,
      }]}
    >
      <Text style={[S.memoryMeta, { fontSize: 11, color: "#666474", textAlign: "center" }]}>
        {uri ? "Editar capa" : label}
      </Text>
      <View style={{
        width: "100%", flex: 1,
        borderRadius: 12, backgroundColor: "#f2f1f5",
        alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        {picking ? <ActivityIndicator color="#696181" /> : uri ? (
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            accessibilityLabel="Imagem escolhida para a capa"
          />
        ) : <Icon name="image" size={35} color="#797688" />}
      </View>
    </Pressable>
  );
}
