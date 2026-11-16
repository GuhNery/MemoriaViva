import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Icon } from "./ui";
import S from "../theme/prototypeInternalStyles";

/**
 * Etapa explícita antes de qualquer ação irreversível:
 * nome exato, impacto nos participantes/conteúdo e opção de desistir.
 * A API valida a mesma confirmação no servidor.
 */
export function ConfirmDeletion({ kind, name, impact = [], onConfirm, onCancel }) {
  const [typedName, setTypedName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allowed = typedName === name && !busy;
  const run = async () => {
    if (!allowed) return;
    try {
      setBusy(true);
      setError("");
      await onConfirm(name);
    } catch (e) {
      setError(e?.message || "Não foi possível excluir. Nada foi alterado.");
      setBusy(false);
    }
  };

  return (
    <View style={{
      borderWidth: 1, borderColor: "#e9c5cc", backgroundColor: "#fff9fa",
      borderRadius: 15, padding: 17, marginTop: 17, marginBottom: 18,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Icon name="alert-triangle" color="#a53b4e" size={23} />
        <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: "#822e41" }}>
          Excluir {kind} definitivamente?
        </Text>
      </View>
      <Text style={{ color: "#503f46", fontSize: 13, lineHeight: 20, marginBottom: 11 }}>
        Esta ação é irreversível. Confira o que será afetado:
      </Text>
      {impact.map((item, index) => (
        <View key={index} style={{ flexDirection: "row", gap: 9, marginBottom: 9, alignItems: "flex-start" }}>
          <Icon name="minus-circle" color="#b45264" size={15} />
          <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: "#5f4e55" }}>{item}</Text>
        </View>
      ))}
      <Text style={[S.label, { marginTop: 12 }]}>
        Digite exatamente <Text style={{ fontWeight: "800" }}>{name}</Text> para confirmar.
      </Text>
      <TextInput
        value={typedName}
        onChangeText={setTypedName}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={name}
        placeholderTextColor="#a7a0aa"
        accessibilityLabel={`Nome do ${kind} que deseja excluir`}
        style={[S.input, { backgroundColor: "#fff", marginBottom: 15, borderColor: "#d8b4be" }]}
      />
      {!!error && (
        <View style={S.error} accessibilityRole="alert">
          <Text style={S.errorText}>{error}</Text>
        </View>
      )}
      <Pressable
        onPress={run}
        disabled={!allowed}
        accessibilityRole="button"
        accessibilityLabel={`Confirmar exclusão definitiva do ${kind}`}
        accessibilityState={{ disabled: !allowed }}
        style={({ pressed }) => [{
          backgroundColor: "#a83b50", borderRadius: 11, minHeight: 49,
          alignItems: "center", justifyContent: "center",
          flexDirection: "row", gap: 9,
          opacity: allowed && !pressed ? 1 : 0.45,
          marginBottom: 11,
        }]}
      >
        {busy ? <ActivityIndicator color="#fff" /> : (
          <>
            <Icon name="trash-2" color="#fff" size={17} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Excluir definitivamente</Text>
          </>
        )}
      </Pressable>
      <Pressable
        onPress={onCancel}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Cancelar exclusão"
        style={S.secondaryButton}
      >
        <Text style={S.secondaryLabel}>Cancelar, manter {kind}</Text>
      </Pressable>
    </View>
  );
}
