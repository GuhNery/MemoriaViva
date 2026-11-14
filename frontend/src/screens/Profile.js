import React, { useState } from "react";
import {
  ActivityIndicator, Image, Platform, Pressable,
  ScrollView, Text, TextInput, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api, assetUrl, COLORS } from "../services/api";
import { Icon } from "../components/ui";
import { fileFormData } from "../components/CoverField";
import S from "../theme/prototypeInternalStyles";

const inky = "#17191f";

function ValueCard({ label, value, icon, edit, editing, input, onChange, onSave, onCancel, saving, keyboardType = "default" }) {
  return (
    <View style={{
      backgroundColor: "#f5f5f6", borderRadius: 13,
      paddingVertical: 15, paddingHorizontal: 16,
      borderWidth: 1, borderColor: "#eeedef", marginBottom: 16,
      elevation: 2,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 30 }}>
        <Text style={{ fontSize: 12, color: "#73717d", marginRight: 7 }}>{label}:</Text>
        <View style={{ flex: 1 }}>
          {editing ? (
            <TextInput
              value={input}
              onChangeText={onChange}
              autoFocus
              editable={!saving}
              keyboardType={keyboardType}
              autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
              accessibilityLabel={"Editar " + label.toLowerCase()}
              style={{ color: inky, fontSize: 14, minHeight: 33, borderBottomWidth: 1, borderColor: "#8d839e" }}
            />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "600", color: inky }} numberOfLines={2}>
              {value || "Não informado"}
            </Text>
          )}
        </View>
        {!editing && (
          <Pressable
            onPress={edit}
            accessibilityRole="button"
            accessibilityLabel={"Alterar " + label.toLowerCase()}
            style={{ width: 36, height: 36, justifyContent: "center", alignItems: "center" }}
          >
            <Icon name="edit-2" size={17} color="#3b3c45" />
          </Pressable>
        )}
      </View>
      {editing && (
        <View style={{ flexDirection: "row", gap: 9, marginTop: 15 }}>
          <Pressable
            onPress={onSave} disabled={saving}
            accessibilityRole="button" accessibilityLabel={"Salvar " + label.toLowerCase()}
            style={[S.actionButton, { flex: 1, minHeight: 42 }]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={S.actionLabel}>Salvar</Text>}
          </Pressable>
          <Pressable
            onPress={onCancel} disabled={saving}
            accessibilityRole="button" accessibilityLabel="Cancelar edição"
            style={[S.secondaryButton, { flex: 1, minHeight: 42 }]}
          >
            <Text style={S.secondaryLabel}>Cancelar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function Profile({ user, token, onBack, onUserUpdated, onLogout }) {
  const [editing, setEditing] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const displayName = user?.name || user?.nome || "Pessoa";
  const displayEmail = user?.email || "";
  const displayAge = user?.age === null || user?.age === undefined ? "" : String(user.age);
  const photoUrl = user?.photoUrl || null;

  const edit = (field) => {
    setError("");
    setEditing(field);
    setInput(field === "name" ? displayName : field === "email" ? displayEmail : displayAge);
  };

  const saveField = async () => {
    if (busy || !editing) return;
    const name = editing === "name" ? input.trim() : displayName;
    const email = editing === "email" ? input.trim().toLowerCase() : displayEmail;
    const age = editing === "age" ? input.trim() : displayAge;
    if (name.length < 2 || name.length > 100) return setError("Informe um nome entre 2 e 100 caracteres.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Informe um e-mail válido.");
    if (age !== "" && (!/^\d+$/.test(age) || Number(age) > 120)) return setError("Informe uma idade válida ou deixe em branco.");

    try {
      setBusy(true);
      setError("");
      const result = await api("/api/auth/profile", token, {
        method: "PATCH", body: JSON.stringify({ name, email, age: age === "" ? null : Number(age) }),
      });
      onUserUpdated?.(result.user);
      setEditing("");
    } catch (e) {
      setError(e.message || "Não foi possível salvar os dados.");
    } finally { setBusy(false); }
  };

  const choosePhoto = async () => {
    if (uploading) return;
    try {
      setError("");
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error("Permita o acesso à galeria.");
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setUploading(true);
      const form = await fileFormData(result.assets[0]);
      const response = await api("/api/auth/profile/photo", token, { method: "POST", body: form });
      onUserUpdated?.(response.user);
    } catch (e) { setError(e.message || "Não foi possível atualizar a foto."); }
    finally { setUploading(false); }
  };

  return (
    <ScrollView contentContainerStyle={[S.scroll, { paddingTop: 8, paddingHorizontal: 25, paddingBottom: 45 }]} showsVerticalScrollIndicator={false}>
      <Pressable
        onPress={onBack} accessibilityRole="button" accessibilityLabel="Voltar ao Início"
        style={{ width: 44, minHeight: 44, justifyContent: "center" }}
      >
        <Icon name="chevron-left" size={24} color={inky} />
      </Pressable>

      <View style={{ alignItems: "center", marginTop: 8, marginBottom: 40 }}>
        <Pressable
          onPress={choosePhoto}
          disabled={uploading}
          accessibilityRole="button" accessibilityLabel="Alterar foto de perfil"
          style={({ pressed }) => [{
            width: 112, height: 112, backgroundColor: "#17191f",
            padding: 7, borderRadius: 23, justifyContent: "center", alignItems: "center",
            elevation: 4, opacity: pressed ? 0.7 : 1,
          }]}
        >
          <View style={{
            flex: 1, width: "100%", borderRadius: 18,
            backgroundColor: "#fff", overflow: "hidden", alignItems: "center", justifyContent: "center",
          }}>
            {uploading ? <ActivityIndicator color={inky} /> : photoUrl ? (
              <Image source={{ uri: assetUrl(photoUrl) }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
            ) : <Icon name="user" size={45} color="#22242b" />}
          </View>
          <View style={{
            position: "absolute", bottom: -6, right: -7,
            width: 35, height: 35, borderRadius: 18, backgroundColor: "#fff",
            alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e5e3e9",
          }}>
            <Icon name="camera" size={17} color={inky} />
          </View>
        </Pressable>
        <Text style={{ marginTop: 18, fontSize: 12, color: "#6e6d78" }}>
          Toque para alterar sua foto
        </Text>
      </View>

      <ValueCard label="Nome" value={displayName}
        edit={() => edit("name")} editing={editing === "name"}
        input={input} onChange={setInput} onSave={saveField}
        onCancel={() => setEditing("")} saving={busy} />
      <ValueCard label="Idade" value={displayAge ? displayAge + " anos" : ""}
        edit={() => edit("age")} editing={editing === "age"}
        input={input} onChange={setInput} onSave={saveField}
        onCancel={() => setEditing("")} saving={busy} keyboardType="numeric" />
      <ValueCard label="Email" value={displayEmail}
        edit={() => edit("email")} editing={editing === "email"}
        input={input} onChange={setInput} onSave={saveField}
        onCancel={() => setEditing("")} saving={busy} keyboardType="email-address" />

      {!!error && <View style={[S.error, { marginTop: 8 }]}><Text style={S.errorText}>{error}</Text></View>}

      <Pressable
        onPress={onLogout}
        accessibilityRole="button" accessibilityLabel="Sair da conta"
        style={[S.secondaryButton, { marginTop: 28 }]}
      >
        <Icon name="log-out" size={17} color={COLORS.danger} />
        <Text style={[S.secondaryLabel, { color: COLORS.danger }]}>Sair da conta</Text>
      </Pressable>
    </ScrollView>
  );
}
export default Profile;
