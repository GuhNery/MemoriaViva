
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "./src/services/api";
import { LoadingScreen } from "./src/components/ui";
import { AppLayout } from "./src/components/AppLayout";
import { PrototypeHome, PrototypeGroups, PrototypeCreateFamily } from "./src/screens/PrototypeScreens";
import { Alert, Platform } from "react-native";

import { Welcome, Auth } from "./src/screens/Onboarding";

import {
  Timeline,
  ChapterForm,
  ChapterDetail,
} from "./src/screens/Memories";

import {
  Members,
  Settings,
} from "./src/screens/Account";

import { Profile } from "./src/screens/Profile";

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [screen, setScreen] = useState("welcome");
  const [selected, setSelected] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [createFamilyReturn, setCreateFamilyReturn] = useState("groups");
  const [invitations, setInvitations] = useState([]);
  const [invitationBusyId, setInvitationBusyId] = useState(null);
  const [invitationsError, setInvitationsError] = useState("");
  const [groupBack, setGroupBack] = useState("groups");

  const refreshFamily = async (
    familyId = family?.id,
    activeToken = token
  ) => {
    if (!familyId || !activeToken) return;

    const result = await api(
      `/api/families/${familyId}`,
      activeToken
    );

    setFamily(result.family);
    setMembers(result.members || []);
    setChapters(result.chapters || []);

    setSelected((current) =>
      current
        ? (result.chapters || []).find(
          (item) => item.id === current.id
        ) || current
        : current
    );

    return result;
  };

  const loadSession = async (savedToken) => {
    try {
      const me = await api("/api/auth/me", savedToken);

      setToken(savedToken);
      setUser(me.user);
      setFamilies(me.families || []);

      if (me.families?.[0]) {
        await refreshFamily(
          me.families[0].id,
          savedToken
        );

        setScreen("home");
      } else {
        // Uma conta pode existir sem participar de nenhum grupo.
        setFamily(null);
        setMembers([]);
        setChapters([]);
        setScreen("home");
      }
    } catch (error) {
      try {
        await AsyncStorage.removeItem("mv_token");
      } catch (storageError) {
        console.error(
          "Erro ao remover sessão inválida:",
          storageError
        );
      }

      setToken(null);
      setUser(null);
      setFamily(null);
      setFamilies([]);
      setMembers([]);
      setChapters([]);
      setSelected(null);
      setScreen("welcome");
    } finally {
      setBooting(false);
    }
  };

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("mv_token");

        if (!active) return;

        if (savedToken) {
          await loadSession(savedToken);
        } else {
          setBooting(false);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar sessão:",
          error
        );

        if (active) {
          setToken(null);
          setUser(null);
          setScreen("welcome");
          setBooting(false);
        }
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, []);

  // Busca convites pendentes sem conceder acesso antes da aceitação.
  const loadInvitations = async (activeToken = token) => {
    if (!activeToken) return;
    try {
      const result = await api("/api/invitations", activeToken);
      setInvitations(result.invitations || []);
      setInvitationsError("");
    } catch (error) {
      setInvitationsError(error?.message || "Não foi possível consultar os convites.");
    }
  };

  useEffect(() => {
    if (!token || (screen !== "home" && screen !== "groups")) return;
    loadInvitations(token);
  }, [screen, token]);

  const answerInvitation = async (invitation, response) => {
    if (!invitation?.id || invitationBusyId) return;
    try {
      setInvitationBusyId(invitation.id);
      setInvitationsError("");
      await api(`/api/invitations/${invitation.id}/${response}`, token, { method: "POST" });
      const me = await api("/api/auth/me", token);
      setFamilies(me.families || []);
      await loadInvitations(token);
      if (response === "accept") {
        const addedGroup = (me.families || []).find((item) =>
          String(item.id) === String(invitation.groupId)
        );
        if (addedGroup) {
          await refreshFamily(addedGroup.id, token);
          setScreen("home");
        }
      }
    } catch (error) {
      setInvitationsError(error?.message || "Não foi possível responder ao convite.");
    } finally {
      setInvitationBusyId(null);
    }
  };

  const openCreateFamily = (returnTo = "groups") => {
    setCreateFamilyReturn(returnTo);
    setScreen("createFamily");
  };

  // Atualiza a lista de grupos ao abrir a tela correspondente.
  useEffect(() => {
    if (screen !== "groups" || !token) return undefined;
    let active = true;
    api("/api/auth/me", token)
      .then((result) => {
        if (active) setFamilies(result.families || []);
      })
      .catch((error) => {
        console.error("Não foi possível atualizar os grupos:", error.message);
      });
    return () => { active = false; };
  }, [screen, token]);

  // Logout local: não depende da resposta do backend.
  const logout = async () => {
    // Limpa a sessão imediatamente na interface
    setToken(null);
    setUser(null);
    setFamily(null);
    setFamilies([]);
    setInvitations([]);
    setMembers([]);
    setChapters([]);
    setSelected(null);
    setAuthMode("login");
    setScreen("welcome");

    // Remove a sessão salva no dispositivo
    try {
      await AsyncStorage.removeItem("mv_token");
    } catch (error) {
      console.error("Erro ao remover token:", error);
    }
  };

  const authSuccess = async (result) => {
    try {
      await AsyncStorage.setItem(
        "mv_token",
        result.token
      );

      setToken(result.token);
      setUser(result.user);
      setFamilies(result.families || []);

      if (result.families?.[0]) {
        await refreshFamily(
          result.families[0].id,
          result.token
        );

        setScreen("home");
      } else {
        setFamily(null);
        setMembers([]);
        setChapters([]);
        setScreen("home");
      }
    } catch (error) {
      Alert.alert(
        "Erro ao entrar",
        error?.message ||
        "Não foi possível iniciar sua sessão."
      );
    }
  };

  const familyCreated = async (newFamily) => {
    await refreshFamily(newFamily.id, token);
    setFamilies((current) => [
      newFamily,
      ...current.filter((item) => String(item.id) !== String(newFamily.id)),
    ]);
    setScreen("home");
  };

  const openGroupSettings = (returnTo = "groups") => {
    setGroupBack(returnTo);
    setScreen("settings");
  };

  const openGroupMembers = (returnTo = "groups") => {
    setGroupBack(returnTo);
    setScreen("members");
  };

  const selectFamily = async (selectedFamily) => {
    try {
      await refreshFamily(selectedFamily.id, token);
      setScreen("home");
    } catch (error) {
      Alert.alert("Não foi possível abrir o grupo", error?.message || "Tente novamente.");
    }
  };

  const currentUserIsAdmin = members.some(
    (member) => String(member.userId) === String(user?.id) && member.permission === "admin"
  );

  const openChapter = (chapter) => {
    setSelected(chapter);
    setScreen("chapter");
  };

  const deleteChapter = async () => {
    if (!selected?.id) return;

    try {
      await api(
        `/api/chapters/${selected.id}`,
        token,
        { method: "DELETE" }
      );

      await refreshFamily();

      setSelected(null);
      setScreen("timeline");
    } catch (error) {
      Alert.alert(
        "Não foi possível excluir",
        error?.message || "Ocorreu um erro ao excluir a memória."
      );
    }
  };

  if (booting) {
    return <LoadingScreen />;
  }

  if (!token || !user) {
    if (screen === "auth") {
      return (
        <Auth
          mode={authMode}
          onBack={(mode) =>
            mode
              ? setAuthMode(mode)
              : setScreen("welcome")
          }
          onSuccess={authSuccess}
        />
      );
    }

    return (
      <Welcome
        onLogin={() => {
          setAuthMode("login");
          setScreen("auth");
        }}
        onRegister={() => {
          setAuthMode("register");
          setScreen("auth");
        }}
      />
    );
  }

  if (screen === "createFamily") {
    return (
      <PrototypeCreateFamily
        token={token}
        onCreated={familyCreated}
        onCancel={() => setScreen(createFamilyReturn)}
      />
    );
  }

  if (screen === "chapter") {
    return (
      <ChapterDetail
        chapter={selected}
        token={token}
        onBack={() => setScreen("timeline")}
        onRefresh={() => refreshFamily()}
        onEdit={() => setScreen("editChapter")}
        onDelete={deleteChapter}
      />
    );
  }

  if (
    screen === "newChapter" ||
    screen === "editChapter"
  ) {
    return (
      <ChapterForm
        family={family}
        token={token}
        members={members}
        existing={
          screen === "editChapter"
            ? selected
            : undefined
        }
        onBack={() =>
          setScreen(
            screen === "editChapter"
              ? "chapter"
              : "home"
          )
        }
        onSaved={async () => {
          await refreshFamily();
          setScreen("timeline");
        }}
      />
    );
  }

  let content;

  switch (screen) {
    case "home":
    case "search":
      content = (
        <PrototypeHome
          family={family}
          chapters={chapters}
          onOpenChapter={openChapter}
          onShowTimeline={() => setScreen("timeline")}
          onCreateAlbum={() => setScreen("newChapter")}
          canManage={currentUserIsAdmin}
          onCreateGroup={() => openCreateFamily("home")}
          searchMode={screen === "search"}
          onShowGroups={() => setScreen("groups")}
        />
      );
      break;

    case "groups":
      content = (
        <PrototypeGroups
          families={families}
          activeFamilyId={family?.id}
          onSelectFamily={selectFamily}
          onEditFamily={() => openGroupSettings("groups")}
          onAddFamily={() => openCreateFamily("groups")}
          onManageMembers={() => openGroupMembers("groups")}
          isCurrentAdmin={currentUserIsAdmin}
          invitations={invitations}
          invitationBusyId={invitationBusyId}
          invitationsError={invitationsError}
          onRespondInvitation={answerInvitation}
        />
      );
      break;

    case "timeline":
      if (!family) {
        content = null;
        break;
      }
      content = (
        <Timeline
          chapters={chapters}
          members={members}
          setScreen={setScreen}
          openChapter={openChapter}
          onAdd={() => setScreen("newChapter")}
        />
      );
      break;

    case "members":
      content = (
        <Members
          family={family}
          token={token}
          members={members}
          onRefresh={() => refreshFamily()}
          onBack={() => setScreen(groupBack)}
          isAdmin={currentUserIsAdmin}
        />
      );
      break;

    case "profile":
      content = (
        <Profile
          user={user}
          family={family}
          members={members}
          chapters={chapters}
          token={token}
          onLogout={logout}
          onUserUpdated={setUser}
        />
      );
      break;

    case "settings":
      content = (
        <Settings
          family={family}
          token={token}
          onFamilyUpdated={(updated) => {
            setFamily(updated);
            setFamilies((previous) => previous.map((item) =>
              String(item.id) === String(updated.id) ? updated : item
            ));
          }}
          onBack={() => setScreen(groupBack)}
          onManageMembers={() => openGroupMembers("settings")}
          isAdmin={currentUserIsAdmin}
        />
      );
      break;

    default:
      content = (
        <PrototypeHome
          family={family}
          chapters={chapters}
          onOpenChapter={openChapter}
          onShowTimeline={() => setScreen("timeline")}
          onCreateAlbum={() => setScreen("newChapter")}
          canManage={currentUserIsAdmin}
          onCreateGroup={() => openCreateFamily("home")}
        />
      );
  }

  return (
    <AppLayout
      user={user}
      family={family}
      screen={screen}
      setScreen={setScreen}
      onLogout={logout}
      onAdd={() => setScreen("newChapter")}
    >
      {content}
    </AppLayout>
  );
}
