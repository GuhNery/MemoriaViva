import React, { useState } from "react";
import { SafeAreaView, Text, View, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, COLORS } from "../services/api";
import styles from "../theme/styles";
import { Screen, Logo, Button, Field, Icon } from "../components/ui";

// Primeira etapa de alinhamento ao protótipo do Figma.
// As telas autenticadas continuam usando os componentes existentes até a próxima etapa.
export function Welcome({ onLogin, onRegister }) {
  return (
    <SafeAreaView style={styles.prototypeWelcome}>
      <View style={styles.prototypeWelcomeInner}>
        <View style={styles.prototypeWelcomeEmblem}>
          <Icon name="film" size={58} color="#c9b5f2" />
          <View style={styles.prototypeWelcomeSpark}>
            <Icon name="star" size={22} color="#f3c86f" />
          </View>
        </View>
        <Text style={styles.prototypeWelcomeName}>MEMÓRIA VIVA</Text>
        <Text style={styles.prototypeWelcomeTagline}>
          Suas histórias merecem ser lembradas.
        </Text>
      </View>
      <View style={styles.prototypeWelcomeActions}>
        <Pressable
          onPress={onRegister}
          accessibilityRole="button"
          accessibilityLabel="Criar conta no Memória Viva"
          style={styles.prototypeWelcomePrimary}
        >
          <Text style={styles.prototypeWelcomePrimaryText}>Começar</Text>
          <Icon name="arrow-right" color="#15171c" size={18} />
        </Pressable>
        <Pressable
          onPress={onLogin}
          accessibilityRole="button"
          accessibilityLabel="Já tenho uma conta"
          style={styles.prototypeWelcomeSecondary}
        >
          <Text style={styles.prototypeWelcomeSecondaryText}>Já tenho uma conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function Auth({ mode, onBack, onSuccess }) {
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const changeMode = (nextMode) => {
    setError("");
    onBack(nextMode);
  };

  const submit = async () => {
    setError("");
    if (!form.email.trim()) {
      setError("Informe seu e-mail para continuar.");
      return;
    }
    if (isForgot) {
      setError("A recuperação por e-mail ainda não está disponível nesta versão.");
      return;
    }
    if (isRegister && !form.name.trim()) {
      setError("Informe seu nome para criar a conta.");
      return;
    }
    if (!form.password) {
      setError("Informe sua senha para continuar.");
      return;
    }
    if (isRegister && form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      setLoading(true);
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const result = await api(endpoint, null, {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      await AsyncStorage.setItem("mv_token", result.token);
      onSuccess(result);
    } catch (e) {
      setError(e.message || "Não foi possível concluir a operação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.prototypeAuthPage}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => onBack()}
          style={styles.prototypeBack}
        >
          <Icon name="arrow-left" size={20} color={COLORS.ink} />
        </Pressable>

        {!isForgot && (
          <View style={styles.prototypeAuthTabs}>
            <Pressable
              onPress={() => changeMode("login")}
              accessibilityRole="tab"
              accessibilityState={{ selected: !isRegister }}
              style={[styles.prototypeAuthTab, !isRegister && styles.prototypeAuthTabActive]}
            >
              <Text style={[styles.prototypeAuthTabText, !isRegister && styles.prototypeAuthTabTextActive]}>
                Login
              </Text>
            </Pressable>
            <Pressable
              onPress={() => changeMode("register")}
              accessibilityRole="tab"
              accessibilityState={{ selected: isRegister }}
              style={[styles.prototypeAuthTab, isRegister && styles.prototypeAuthTabActive]}
            >
              <Text style={[styles.prototypeAuthTabText, isRegister && styles.prototypeAuthTabTextActive]}>
                Cadastrar-se
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.prototypeAuthTitle}>
          {isForgot ? "Recuperar acesso" : isRegister ? "É novo por aqui?" : "Bem-vindo"}
        </Text>
        <Text style={styles.prototypeAuthSubtitle}>
          {isForgot
            ? "Informe o e-mail da sua conta."
            : isRegister
              ? "Cadastre-se para guardar suas memórias."
              : "Preencha seus dados para continuar."}
        </Text>

        <View style={styles.prototypeAuthForm}>
          {isRegister && (
            <Field
              label="Nome"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
              placeholder="Seu nome completo"
            />
          )}
          <Field
            label="E-mail"
            value={form.email}
            onChangeText={(email) => setForm({ ...form, email })}
            placeholder="voce@exemplo.com"
            keyboardType="email-address"
          />
          {!isForgot && (
            <Field
              label="Senha"
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
              placeholder="Mínimo de 6 caracteres"
              secureTextEntry
            />
          )}
          {!isForgot && (
            <Pressable
              onPress={() => changeMode("forgot")}
              accessibilityRole="button"
              style={styles.prototypeForgotLink}
            >
              <Text style={styles.prototypeForgotLinkText}>Esqueceu sua senha?</Text>
            </Pressable>
          )}
          {!!error && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {isForgot ? (
            <Button variant="outline" onPress={() => changeMode("login")}>
              Voltar ao login
            </Button>
          ) : (
            <Button onPress={submit} loading={loading} icon="arrow-right">
              {isRegister ? "Criar conta" : "Começar"}
            </Button>
          )}
        </View>
      </View>
    </Screen>
  );
}

export function FamilySetup({ token, user, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const create = async () => {
    try {
      setLoading(true);
      const result = await api("/api/families", token, {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
      onCreated(result.family);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen>
      <View style={styles.setup}>
        <Logo />
        <Text style={styles.eyebrow}>PRIMEIRO PASSO</Text>
        <Text style={styles.setupTitle}>
          Vamos dar um nome{`\n`}
          <Text style={styles.heroItalic}>a esta história?</Text>
        </Text>
        <Text style={styles.heroText}>
          Crie o espaço onde as memórias da sua família vão morar. Você poderá
          convidar outras pessoas depois.
        </Text>
        <Field
          label="NOME DA FAMÍLIA"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Família Oliveira"
        />
        <Field
          label="UMA FRASE SOBRE VOCÊS"
          value={description}
          onChangeText={setDescription}
          placeholder="Ex.: onde sempre cabe mais um"
          multiline
        />
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <Button onPress={create} loading={loading} icon="arrow-right">
          Criar espaço da família
        </Button>
        <Text style={styles.setupNote}>
          Olá, {user.name.split(" ")[0]}. Você será o administrador.
        </Text>
      </View>
    </Screen>
  );
}
