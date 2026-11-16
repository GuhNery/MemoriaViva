const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "");
export const COLORS = {
  // Identidade Memória Viva: grafite, lavanda e superfícies claras.
  ink: "#24252d",
  teal: "#36384e",
  dark: "#191b22",
  paper: "#fcfbfe",
  card: "#ffffff",
  muted: "#7c7b89",
  line: "#e4e2eb",
  terracotta: "#776ba2",
  sage: "#f2f0f8",
  peach: "#efedf7",
  white: "#ffffff",
  danger: "#ad3c50",
};

export const api = async (path, token, options = {}) => {
  const isForm = options.body instanceof FormData;
  const headers = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.error?.message || "Não foi possível concluir a operação.",
    );
  return data;
};

export const initials = (name = "") => {
  if (typeof name !== "string" || !name.trim()) return "?";

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export const formatDate = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00`));
export const assetUrl = (url) =>
  url?.startsWith("http") ? url : `${API_URL}${url || ""}`;
