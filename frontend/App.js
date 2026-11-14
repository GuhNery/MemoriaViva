import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";

import { api } from "./src/services/api";
import { LoadingScreen } from "./src/components/ui";
import { AppLayout } from "./src/components/AppLayout";
import { Welcome, Auth } from "./src/screens/Onboarding";
import { HomeDashboard } from "./src/screens/HomeDashboard";
import { PrototypeGroups, PrototypeCreateFamily } from "./src/screens/PrototypeScreens";
import { GroupDashboard, AlbumSequence } from "./src/screens/GroupAlbumScreens";
import { AlbumForm } from "./src/screens/AlbumScreens";
import { CreateMemory } from "./src/screens/CreateMemory";
import { MediaDetail } from "./src/screens/MediaDetail";
import { Members, Settings } from "./src/screens/Account";
import { Profile } from "./src/screens/Profile";

const showMessage = (title, message) => {
  if (Platform.OS === "web") window.alert(title + ": " + message);
  else Alert.alert(title, message);
};

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("welcome");
  const [authMode, setAuthMode] = useState("login");
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [recentMemories, setRecentMemories] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [invitationBusyId, setInvitationBusyId] = useState(null);
  const [invitationsError, setInvitationsError] = useState("");
  const [createGroupReturn, setCreateGroupReturn] = useState("groups");
  const [membersReturn, setMembersReturn] = useState("group");
  const [settingsReturn, setSettingsReturn] = useState("group");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const refreshGroup = async (id = group?.id, authToken = token) => {
    if (!id || !authToken) return null;
    const result = await api(`/api/families/${id}`, authToken);
    setGroup(result.family);
    setAlbums(result.chapters || []);
    setMembers(result.members || []);
    setSelectedAlbum((current) => {
      if (!current) return current;
      return (result.chapters || []).find((a) => String(a.id) === String(current.id)) || current;
    });
    return result;
  };

  const refreshGroupList = async (authToken = token) => {
    if (!authToken) return [];
    const result = await api("/api/auth/me", authToken);
    setGroups(result.families || []);
    return result.families || [];
  };

  const loadSession = async (savedToken, authenticationData) => {
    try {
      const data = authenticationData || await api("/api/auth/me", savedToken);
      setToken(savedToken);
      setUser(data.user);
      setGroups(data.families || []);
      // Início é sempre a dashboard da conta; um grupo nunca é obrigatório.
      setScreen("home");
      if (data.families?.[0]) {
        await refreshGroup(data.families[0].id, savedToken);
      } else {
        setGroup(null);
        setMembers([]);
        setAlbums([]);
      }
    } catch (e) {
      await AsyncStorage.removeItem("mv_token").catch(() => {});
      setToken(null);
      setUser(null);
      setGroups([]);
      setGroup(null);
      setScreen("welcome");
    } finally {
      setBooting(false);
    }
  };

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem("mv_token")
      .then((saved) => {
        if (!live) return;
        if (saved) return loadSession(saved);
        setBooting(false);
      })
      .catch(() => { if (live) setBooting(false); });
    return () => { live = false; };
  }, []);

  // A dashboard usa memórias dos grupos autorizados, não álbuns do grupo ativo.
  useEffect(() => {
    if (!token || !["home", "groups", "search"].includes(screen)) return;
    let live = true;
    api("/api/invitations", token)
      .then((result) => {
        if (live) {
          setInvitations(result.invitations || []);
          setInvitationsError("");
        }
      })
      .catch((e) => { if (live) setInvitationsError(e.message || "Não foi possível consultar convites."); });

    Promise.allSettled(groups.map((g) => api(`/api/families/${g.id}`, token)))
      .then((results) => {
        if (!live) return;
        const memories = [];
        for (const item of results) {
          if (item.status !== "fulfilled") continue;
          const payload = item.value;
          for (const album of payload.chapters || []) {
            for (const media of album.media || []) {
              memories.push({ group: payload.family, album, media });
            }
          }
        }
        // "Últimas" = adicionadas recentemente, sem inventar histórico de visitas.
        memories.sort((a, b) =>
          String(b.media.createdAt || "").localeCompare(String(a.media.createdAt || ""))
        );
        setRecentMemories(memories.slice(0, 12));
      });
    return () => { live = false; };
  }, [token, screen, groups, refreshVersion]);

  const login = async (result) => {
    try {
      await AsyncStorage.setItem("mv_token", result.token);
      await loadSession(result.token, result);
    } catch (e) {
      showMessage("Erro ao entrar", e.message || "Não foi possível iniciar sessão.");
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setGroups([]);
    setGroup(null);
    setMembers([]);
    setAlbums([]);
    setSelectedAlbum(null);
    setSelectedMediaId(null);
    setRecentMemories([]);
    setInvitations([]);
    setScreen("welcome");
    setAuthMode("login");
    await AsyncStorage.removeItem("mv_token").catch(() => {});
  };

  const openCreateGroup = (returnTo) => {
    setCreateGroupReturn(returnTo);
    setScreen("createGroup");
  };

  const createGroup = async (created) => {
    await refreshGroup(created.id);
    setGroups((current) => [created, ...current.filter((g) => String(g.id) !== String(created.id))]);
    setRefreshVersion((v) => v + 1);
    setScreen("group");
  };

  const openGroup = async (target) => {
    try {
      await refreshGroup(target.id);
      setSelectedAlbum(null);
      setScreen("group");
    } catch (e) {
      showMessage("Erro ao abrir grupo", e.message || "Não foi possível carregar o grupo.");
    }
  };

  const openAlbum = (album) => {
    setSelectedAlbum(album);
    setScreen("album");
  };

  const openMedia = (media) => {
    setSelectedMediaId(media.id);
    setScreen("media");
  };

  const openMediaFromHome = async ({ group: target, album, media }) => {
    try {
      const payload = await refreshGroup(target.id);
      const currentAlbum = (payload.chapters || []).find((a) => String(a.id) === String(album.id));
      if (!currentAlbum) throw new Error("Álbum não encontrado.");
      setSelectedAlbum(currentAlbum);
      setSelectedMediaId(media.id);
      setScreen("media");
    } catch (e) {
      showMessage("Erro ao abrir memória", e.message || "Não foi possível abrir a lembrança.");
    }
  };

  const saveAlbum = async () => {
    await refreshGroup();
    setRefreshVersion((v) => v + 1);
    setScreen("group");
  };

  const saveMemory = async () => {
    await refreshGroup();
    setRefreshVersion((v) => v + 1);
    setScreen("album");
  };

  const openMembers = (returnTo = "group") => {
    setMembersReturn(returnTo);
    setScreen("members");
  };

  const openSettings = (returnTo = "group") => {
    setSettingsReturn(returnTo);
    setScreen("settings");
  };

  const updateGroup = (updated) => {
    if (!updated) return;
    setGroup(updated);
    setGroups((current) => current.map((g) =>
      String(g.id) === String(updated.id) ? updated : g
    ));
    setRefreshVersion((v) => v + 1);
  };

  const answerInvitation = async (invitation, action) => {
    if (!invitation?.id || invitationBusyId) return;
    try {
      setInvitationBusyId(invitation.id);
      setInvitationsError("");
      await api(`/api/invitations/${invitation.id}/${action}`, token, { method: "POST" });
      const list = await refreshGroupList();
      setInvitations((current) => current.filter((i) => String(i.id) !== String(invitation.id)));
      if (action === "accept") {
        const joined = list.find((g) => String(g.id) === String(invitation.groupId));
        if (joined) await openGroup(joined);
      }
      setRefreshVersion((v) => v + 1);
    } catch (e) {
      setInvitationsError(e.message || "Não foi possível responder ao convite.");
    } finally {
      setInvitationBusyId(null);
    }
  };

  if (booting) return <LoadingScreen />;

  if (!token || !user) {
    if (screen === "auth") {
      return <Auth
        mode={authMode}
        onBack={(mode) => mode ? setAuthMode(mode) : setScreen("welcome")}
        onSuccess={login}
      />;
    }
    return <Welcome
      onLogin={() => { setAuthMode("login"); setScreen("auth"); }}
      onRegister={() => { setAuthMode("register"); setScreen("auth"); }}
    />;
  }

  if (screen === "createGroup") {
    return <PrototypeCreateFamily
      token={token}
      onCreated={createGroup}
      onCancel={() => setScreen(createGroupReturn)}
    />;
  }

  if (screen === "group" && group) {
    const isAdmin = members.some((m) =>
      String(m.userId) === String(user.id) && m.permission === "admin"
    );
    return <GroupDashboard
      family={group}
      albums={albums}
      canManage={isAdmin}
      onBack={() => setScreen("groups")}
      onOpenAlbum={openAlbum}
      onCreateAlbum={() => setScreen("newAlbum")}
      onEditAlbum={(a) => { setSelectedAlbum(a); setScreen("editAlbum"); }}
      onMembers={() => openMembers("group")}
      onSettings={() => openSettings("group")}
    />;
  }

  if (screen === "newAlbum" || screen === "editAlbum") {
    return <AlbumForm
      family={group}
      token={token}
      existing={screen === "editAlbum" ? selectedAlbum : null}
      onSaved={saveAlbum}
      onBack={() => setScreen("group")}
    />;
  }

  if (screen === "album" && selectedAlbum) {
    return <AlbumSequence
      album={selectedAlbum}
      onBack={() => setScreen("group")}
      onAddMemory={() => setScreen("createMemory")}
      onOpenMemory={openMedia}
    />;
  }

  if (screen === "createMemory" && selectedAlbum) {
    return <CreateMemory
      album={selectedAlbum}
      token={token}
      onBack={() => setScreen("album")}
      onSaved={saveMemory}
    />;
  }

  if (screen === "media" && selectedMediaId) {
    return <MediaDetail
      mediaId={selectedMediaId}
      token={token}
      currentUserId={user.id}
      onBack={() => setScreen("album")}
      onRefresh={async () => {
        await refreshGroup();
        setRefreshVersion((v) => v + 1);
      }}
      onDeleted={async () => {
        await refreshGroup();
        setSelectedMediaId(null);
        setScreen("album");
        setRefreshVersion((v) => v + 1);
      }}
    />;
  }

  if (screen === "members" && group) {
    const isAdmin = members.some((m) =>
      String(m.userId) === String(user.id) && m.permission === "admin"
    );
    return <Members
      family={group}
      token={token}
      members={members}
      currentUserId={user.id}
      isAdmin={isAdmin}
      onBack={() => setScreen(membersReturn)}
      onRefresh={() => refreshGroup()}
    />;
  }

  if (screen === "settings" && group) {
    const isAdmin = members.some((m) =>
      String(m.userId) === String(user.id) && m.permission === "admin"
    );
    return <Settings
      family={group}
      token={token}
      isAdmin={isAdmin}
      onFamilyUpdated={updateGroup}
      onBack={() => setScreen(settingsReturn)}
      onManageMembers={() => openMembers("settings")}
    />;
  }

  let content;
  if (screen === "groups") {
    content = <PrototypeGroups
      families={groups}
      activeFamilyId={group?.id}
      invitations={invitations}
      invitationBusyId={invitationBusyId}
      invitationsError={invitationsError}
      onRespondInvitation={answerInvitation}
      onSelectFamily={openGroup}
      onEditFamily={(g) => openGroup(g).then(() => openSettings("groups"))}
      onAddFamily={() => openCreateGroup("groups")}
      isCurrentAdmin={false}
    />;
  } else if (screen === "profile") {
    content = <Profile
      user={user}
      token={token}
      onUserUpdated={setUser}
      onBack={() => setScreen("home")}
      onLogout={logout}
    />;
  } else {
    content = <HomeDashboard
      user={user}
      families={groups}
      recentMemories={recentMemories}
      invitationsCount={invitations.length}
      onOpenGroup={openGroup}
      onOpenMedia={openMediaFromHome}
      onGroups={() => setScreen("groups")}
      onCreateGroup={() => openCreateGroup("home")}
      searchMode={screen === "search"}
    />;
  }

  return (
    <AppLayout
      family={null}
      screen={screen}
      setScreen={setScreen}
      onOpenSettings={() => setScreen("profile")}
    >
      {content}
    </AppLayout>
  );
}
