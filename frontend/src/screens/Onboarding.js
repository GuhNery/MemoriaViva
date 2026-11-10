import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import styles from "../theme/styles";
import { Screen, Logo, Button, Field, Icon } from "../components/ui";

// Logo recortada do protótipo original fornecido pelo grupo.
// Arquivo necessário: frontend/assets/logo-memoria-viva.png
const brandLogo = require("../../assets/logo-memoria-viva.png");

export function Welcome({ onLogin, onRegister }) {
  return (
    <SafeAreaView style={styles.prototypeWelcome}>
      <View style={styles.prototypeWelcomeCenter}>
        <Image
          source={brandLogo}
          style={styles.prototypeWelcomeLogo}
          resizeMode="contain"
          accessibilityLabel="Logotipo Memória Viva: película lilás e azul com detalhes dourados"
        />
        <Text style={styles.prototypeWelcomeName}>MEMÓRIA VIVA</Text>
      </View>
      <View style={styles.prototypeWelcomeFooter}>
        <Pressable
          onPress={onRegister}
          accessibilityRole="button"
          accessibilityLabel="Começar, criar uma conta"
          style={({ pressed }) => [
            styles.prototypeWelcomePrimary,
            pressed && styles.prototypeButtonPressed,
          ]}
        >
          <Text style={styles.prototypeWelcomePrimaryText}>Começar</Text>
          <Icon name="arrow-right" color="#171820" size={19} />
        </Pressable>
        <Pressable
          onPress={onLogin}
          accessibilityRole="button"
          accessibilityLabel="Já tenho uma conta, entrar"
          style={({ pressed }) => [
            styles.prototypeWelcomeSecondary,
            pressed && styles.prototypeButtonPressed,
          ]}
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
  const [showPassword, setShowPassword] = useState(false);

  const changeMode = (nextMode) => {
    setError("");
    onBack(nextMode);
  };

  const submit = async () => {
    if (loading) return;
    setError("");
    if (!form.email.trim()) {
      setError("Informe seu e-mail para continuar.");
      return;
    }
    if (isForgot) {
      setError("A recuperação por e-mail ainda não está disponível.");
      return;
    }
    if (isRegister && !form.name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    if (!form.password) {
      setError("Informe sua senha.");
      return;
    }
    if (isRegister && form.password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    try {
      setLoading(true);
      const result = await api(isRegister ? "/api/auth/register" : "/api/auth/login", null, {
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
    <SafeAreaView style={styles.prototypeAuthSafe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.prototypeAuthScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.prototypeAuthPage}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => onBack()}
            style={styles.prototypeBack}
          >
            <Icon name="arrow-left" size={21} color="#22232b" />
          </Pressable>

          <View style={styles.prototypeAuthBrand}>
            <Image source={brandLogo} style={styles.prototypeAuthBrandImage} resizeMode="contain" />
            <Text style={styles.prototypeAuthBrandName}>MEMÓRIA VIVA</Text>
          </View>

          {!isForgot && (
            <View style={styles.prototypeAuthTabs}>
              <Pressable
                onPress={() => changeMode("login")}
                accessibilityRole="tab"
                accessibilityState={{ selected: !isRegister }}
                style={[styles.prototypeAuthTab, !isRegister && styles.prototypeAuthTabActive]}
              >
                <Text style={[styles.prototypeAuthTabText, !isRegister && styles.prototypeAuthTabTextActive]}>
                  Entrar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => changeMode("register")}
                accessibilityRole="tab"
                accessibilityState={{ selected: isRegister }}
                style={[styles.prototypeAuthTab, isRegister && styles.prototypeAuthTabActive]}
              >
                <Text style={[styles.prototypeAuthTabText, isRegister && styles.prototypeAuthTabTextActive]}>
                  Criar conta
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.prototypeAuthTitle}>
            {isForgot ? "Recuperar acesso" : isRegister ? "Crie sua conta" : "Bem-vindo de volta"}
          </Text>
          <Text style={styles.prototypeAuthSubtitle}>
            {isForgot
              ? "Essa funcionalidade está em desenvolvimento."
              : isRegister
                ? "Um espaço para preservar suas histórias."
                : "Entre para continuar suas memórias."}
          </Text>

          <View style={styles.prototypeAuthForm}>
            {isRegister && (
              <View style={styles.prototypeAuthField}>
                <Text style={styles.prototypeAuthFieldLabel}>Nome completo</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(name) => setForm({ ...form, name })}
                  placeholder="Como podemos chamar você?"
                  placeholderTextColor="#90919b"
                  autoComplete="name"
                  style={styles.prototypeAuthInput}
                  accessibilityLabel="Nome completo"
                />
              </View>
            )}
            <View style={styles.prototypeAuthField}>
              <Text style={styles.prototypeAuthFieldLabel}>E-mail</Text>
              <TextInput
                value={form.email}
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor="#90919b"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={styles.prototypeAuthInput}
                accessibilityLabel="E-mail"
              />
            </View>
            {!isForgot && (
              <View style={styles.prototypeAuthField}>
                <Text style={styles.prototypeAuthFieldLabel}>Senha</Text>
                <View style={styles.prototypePasswordRow}>
                  <TextInput
                    value={form.password}
                    onChangeText={(password) => setForm({ ...form, password })}
                    placeholder="Mínimo de 6 caracteres"
                    placeholderTextColor="#90919b"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    style={styles.prototypePasswordInput}
                    accessibilityLabel="Senha"
                  />
                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    style={styles.prototypePasswordToggle}
                  >
                    <Icon name={showPassword ? "eye-off" : "eye"} size={19} color="#777886" />
                  </Pressable>
                </View>
              </View>
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
              <View style={styles.prototypeAuthError} accessibilityRole="alert">
                <Text style={styles.prototypeAuthErrorText}>{error}</Text>
              </View>
            )}

            {isForgot ? (
              <Pressable
                onPress={() => changeMode("login")}
                accessibilityRole="button"
                style={styles.prototypeAuthSubmit}
              >
                <Text style={styles.prototypeAuthSubmitText}>Voltar ao login</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={submit}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                style={({ pressed }) => [
                  styles.prototypeAuthSubmit,
                  (pressed || loading) && styles.prototypeButtonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.prototypeAuthSubmitText}>
                      {isRegister ? "Criar conta" : "Entrar"}
                    </Text>
                    <Icon name="arrow-right" color="#fff" size={18} />
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
