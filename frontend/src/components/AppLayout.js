import React from "react";
import { Pressable, SafeAreaView, StatusBar, Text, View } from "react-native";
import { Icon } from "./ui";
import S from "../theme/prototypeInternalStyles";

export function Header({ family, screen, setScreen }) {
  const searchActive = screen === "search";
  return (
    <View style={S.header}>
      <View style={S.headerLeft}>
        <Pressable
          onPress={() => setScreen("profile")}
          accessibilityRole="button"
          accessibilityLabel="Abrir meu perfil"
          style={S.avatar}
        >
          <Icon name="user" size={19} color="#fff" />
        </Pressable>
        <Text style={S.headerGroup} numberOfLines={1}>{family?.name || "Memória Viva"}</Text>
      </View>
      <View style={S.headerActions}>
        <Pressable
          onPress={() => setScreen(searchActive ? "home" : "search")}
          accessibilityRole="button"
          accessibilityLabel={searchActive ? "Fechar pesquisa" : "Pesquisar memórias"}
          style={S.iconAction}
        >
          <Icon name={searchActive ? "x" : "search"} size={19} color="#303139" />
        </Pressable>
        <Pressable
          onPress={() => setScreen("settings")}
          accessibilityRole="button"
          accessibilityLabel="Abrir configurações do grupo"
          style={S.iconAction}
        >
          <Icon name="settings" size={19} color="#303139" />
        </Pressable>
      </View>
    </View>
  );
}

export function Tabs({ current, setScreen }) {
  const tabs = [
    { key: "groups", icon: "users", label: "Meus grupos" },
    { key: "home", icon: "home", label: "Início" },
    { key: "profile", icon: "user", label: "Perfil" },
  ];
  return (
    <View style={S.footer}>
      {tabs.map((tab) => {
        const active = current === tab.key || (tab.key === "home" && current === "search");
        return (
          <Pressable
            key={tab.key}
            onPress={() => setScreen(tab.key)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            style={S.footerTab}
          >
            {tab.key === "home" ? (
              <View style={S.footerCenter}>
                <Icon name="home" color="#fff" size={20} />
              </View>
            ) : (
              <Icon name={tab.icon} color={active ? "#17181e" : "#777880"} size={20} />
            )}
            <Text style={[S.footerLabel, active && S.footerLabelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppLayout({ children, family, screen, setScreen }) {
  return (
    <SafeAreaView style={S.shell}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={S.shellInner}>
        <Header family={family} screen={screen} setScreen={setScreen} />
        <View style={S.main}>{children}</View>
        <Tabs current={screen} setScreen={setScreen} />
      </View>
    </SafeAreaView>
  );
}
