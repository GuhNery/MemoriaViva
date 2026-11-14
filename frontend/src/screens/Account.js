import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { api, COLORS, initials } from "../services/api";
import { Avatar, Icon, Screen } from "../components/ui";
import S from "../theme/prototypeInternalStyles";

function BackHeader({ title, subtitle, onBack }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={{ width: 44, height: 44, justifyContent: "center" }}
      >
        <Icon name="arrow-left" size={22} color={COLORS.ink} />
      </Pressable>
      <Text style={[S.heading, { fontSize: 24, marginTop: 8 }]}>{title}</Text>
      {!!subtitle && (
        <Text style={[S.memoryMeta, { fontSize: 13, lineHeight: 19, marginTop: 8 }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function PrimaryAction({ label, icon, onPress, loading = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        S.actionButton,
        (pressed || loading || disabled) && { opacity: 0.65 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {!!icon && <Icon name={icon} size={18} color="#fff" />}
          <Text style={S.actionLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Members({ family, token, members = [], onRefresh, onBack, isAdmin = false }) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Digite um endereço de e-mail válido.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await api(`/api/families/${family.id}/members/invite`, token, {
        method: "POST",
        body: JSON.stringify({ email: address }),
      });
      setMessage(result.message || "Convite registrado.");
      setEmail("");
      setShowInvite(false);
      await onRefresh?.();
    } catch (e) {
      setError(e.message || "Não foi possível registrar o convite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <BackHeader
        title="Participantes"
        subtitle={`Gerencie quem compartilha as lembranças de "${family?.name || "este grupo"}".`}
        onBack={onBack}
      />

      <View style={[S.empty, { alignItems: "flex-start", marginBottom: 22 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Icon name="lock" size={18} color="#5e567a" />
          <Text style={[S.memoryName, { fontSize: 14 }]}>Grupo privado</Text>
        </View>
        <Text style={[S.emptyBody, { textAlign: "left" }]}>
          Somente você e os integrantes autorizados podem visualizar este espaço.
          Cada participante pode registrar suas próprias memórias.
        </Text>
      </View>

      {isAdmin && (
        <View style={{ marginBottom: 22 }}>
          {!showInvite && (
            <PrimaryAction
              label="Convidar participante"
              icon="user-plus"
              onPress={() => { setShowInvite(true); setError(""); setMessage(""); }}
            />
          )}
          {showInvite && (
            <View style={[S.empty, { alignItems: "stretch", gap: 12 }]}>
              <Text style={[S.heading, { fontSize: 17 }]}>Novo convite</Text>
              <Text style={[S.emptyBody, { textAlign: "left" }]}>
                Informe o e-mail da pessoa. O convite aparecerá na área Meus grupos
                quando ela entrar com essa conta. O e-mail não é enviado automaticamente.
              </Text>
              <Text style={S.label}>E-mail do convidado</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="pessoa@exemplo.com"
                placeholderTextColor="#92939a"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={S.input}
                accessibilityLabel="E-mail da pessoa convidada"
              />
              <PrimaryAction
                label="Registrar convite"
                icon="mail"
                onPress={invite}
                loading={loading}
              />
              <Pressable
                onPress={() => { setShowInvite(false); setError(""); }}
                accessibilityRole="button"
                style={[S.secondaryButton]}
              >
                <Text style={S.secondaryLabel}>Cancelar</Text>
              </Pressable>
            </View>
          )}
          {!!error && (
            <View style={[S.error, { marginTop: 12 }]}>
              <Text style={S.errorText}>{error}</Text>
            </View>
          )}
          {!!message && (
            <View style={[S.empty, { marginTop: 12 }]}>
              <Text style={[S.emptyBody, { textAlign: "left" }]}>{message}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[S.headingRow, { marginBottom: 10 }]}>
        <Text style={S.heading}>Integrantes</Text>
        <Text style={[S.memoryMeta, { fontSize: 12 }]}>
          {members.length} {members.length === 1 ? "pessoa" : "pessoas"}
        </Text>
      </View>
      {members.map((member) => {
        const person = member.user || {};
        const personName = person.name || person.nome || "Participante";
        const role = member.permission === "admin" ? "Administrador" :
          member.permission === "editor" ? "Editor" : "Participante";
        return (
          <View key={String(member.id)} style={S.memoryRow}>
            <Avatar
              text={initials(personName)}
              photoUrl={person.photoUrl || person.foto_perfil || null}
              color="#38384d"
            />
            <View style={{ flex: 1 }}>
              <Text style={S.memoryName} numberOfLines={1}>{personName}</Text>
              <Text style={S.memoryMeta} numberOfLines={1}>{person.email || ""}</Text>
            </View>
            <View style={{ backgroundColor: COLORS.sage, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: COLORS.teal, fontSize: 10, fontWeight: "700" }}>
                {role}
              </Text>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

export function Settings({
  family, token, onFamilyUpdated, onBack, onManageMembers, isAdmin = false,
}) {
  const [name, setName] = useState(family?.name || "");
  const [description, setDescription] = useState(family?.description || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(family?.name || "");
    setDescription(family?.description || "");
  }, [family?.id]);

  const save = async () => {
    if (!isAdmin || saving) return;
    if (name.trim().length < 2 || name.trim().length > 100) {
      setMessage("O nome do grupo deve ter entre 2 e 100 caracteres.");
      return;
    }
    try {
      setSaving(true);
      setMessage("");
      const result = await api(`/api/families/${family.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      onFamilyUpdated?.(result.family);
      setMessage("Alterações salvas com sucesso.");
    } catch (e) {
      setMessage(e.message || "Não foi possível salvar o grupo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackHeader
        title="Configurações do grupo"
        subtitle="Organize os detalhes e controle quem pode participar deste espaço."
        onBack={onBack}
      />

      <View style={[S.empty, { flexDirection: "row", alignItems: "center", marginBottom: 22 }]}>
        <Icon name="lock" color="#655e82" size={25} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={S.memoryName}>Espaço privado</Text>
          <Text style={[S.emptyBody, { textAlign: "left" }]}>
            Apenas integrantes autorizados podem ver as memórias.
          </Text>
        </View>
      </View>

      <View style={[S.field, { marginBottom: 14 }]}>
        <Text style={S.label}>Nome do grupo</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={isAdmin && !saving}
          style={[S.input, !isAdmin && { backgroundColor: "#f4f4f7" }]}
          accessibilityLabel="Nome do grupo"
        />
      </View>
      <View style={S.field}>
        <Text style={S.label}>Descrição (opcional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          editable={isAdmin && !saving}
          multiline
          style={[S.input, { minHeight: 100, paddingVertical: 12, textAlignVertical: "top" }, !isAdmin && { backgroundColor: "#f4f4f7" }]}
          accessibilityLabel="Descrição do grupo"
        />
      </View>

      {isAdmin ? (
        <PrimaryAction label="Salvar alterações" icon="check" onPress={save} loading={saving} />
      ) : (
        <Text style={[S.note, { textAlign: "left" }]}>
          Apenas administradores podem alterar os dados do grupo.
        </Text>
      )}
      {!!message && (
        <View style={[S.empty, { marginTop: 12 }]}>
          <Text style={S.emptyBody}>{message}</Text>
        </View>
      )}

      <View style={[S.headingRow, { marginTop: 30 }]}>
        <Text style={S.heading}>Participantes</Text>
      </View>
      <Pressable
        onPress={onManageMembers}
        accessibilityRole="button"
        accessibilityLabel="Visualizar participantes e convites"
        style={[S.memoryRow, { minHeight: 66 }]}
      >
        <View style={S.memoryIconBox}>
          <Icon name="users" size={21} color={COLORS.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.memoryName}>Gerenciar participantes</Text>
          <Text style={S.memoryMeta}>
            {isAdmin ? "Convidar e consultar integrantes" : "Visualizar integrantes"}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.muted} />
      </Pressable>
    </Screen>
  );
}
