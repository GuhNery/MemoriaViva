import { Platform, StyleSheet } from "react-native";

// Paleta interna baseada nas telas 4 e 5 do protótipo do Memória Viva.
const S = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#eaeaea" },
  shellInner: {
    flex: 1, width: "100%", maxWidth: 460, alignSelf: "center",
    backgroundColor: "#ffffff", overflow: "hidden",
  },
  header: {
    minHeight: 64, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 17, backgroundColor: "#ffffff",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  avatar: {
    width: 39, height: 39, borderRadius: 22, backgroundColor: "#15171c",
    alignItems: "center", justifyContent: "center",
  },
  headerGroup: { fontSize: 12, fontWeight: "600", color: "#5c5c62", flexShrink: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconAction: {
    width: 40, height: 40, borderRadius: 24, borderColor: "#eeeeef",
    borderWidth: 1, backgroundColor: "#ffffff", alignItems: "center",
    justifyContent: "center", ...Platform.select({
      web: { boxShadow: "0px 2px 5px rgba(0,0,0,0.12)" },
      default: { elevation: 2 },
    }),
  },
  main: { flex: 1, backgroundColor: "#ffffff" },
  footer: {
    minHeight: 73, flexDirection: "row", alignItems: "center",
    justifyContent: "space-around", backgroundColor: "#f4f4f5",
    borderTopWidth: 1, borderTopColor: "#ededf0", paddingBottom: 4,
  },
  footerTab: {
    minWidth: 77, minHeight: 56, alignItems: "center", justifyContent: "center",
    gap: 5,
  },
  footerCenter: {
    width: 44, height: 44, borderRadius: 25, backgroundColor: "#17181d",
    alignItems: "center", justifyContent: "center",
  },
  footerLabel: { fontSize: 10, color: "#74767f" },
  footerLabelSelected: { color: "#222329", fontWeight: "700" },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 },
  hero: {
    minHeight: 152, backgroundColor: "#14171b", borderRadius: 13,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    marginBottom: 26,
  },
  heroLogo: { width: 76, height: 76, borderRadius: 38 },
  heroCaption: { color: "#e9e6f6", fontSize: 11, letterSpacing: 1.5, marginTop: 6 },
  headingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 14, marginTop: 3,
  },
  heading: { color: "#202127", fontSize: 19, fontWeight: "700" },
  textLink: { color: "#45465c", fontWeight: "700", fontSize: 13, paddingVertical: 6 },
  searchField: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#dadbe1", borderRadius: 12,
    paddingHorizontal: 13, marginBottom: 16, backgroundColor: "#fff",
  },
  searchInput: { flex: 1, minHeight: 48, fontSize: 14, color: "#26272b" },
  memoryRow: {
    minHeight: 64, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 12, backgroundColor: "#fff", borderRadius: 12,
    borderWidth: 1, borderColor: "#ededf0", flexDirection: "row",
    alignItems: "center", gap: 13,
    ...Platform.select({
      web: { boxShadow: "0px 2px 3px rgba(0,0,0,0.08)" },
      default: { elevation: 2 },
    }),
  },
  memoryIconBox: {
    width: 34, height: 34, alignItems: "center",
    justifyContent: "center", borderRadius: 8, backgroundColor: "#f3f2f8",
  },
  memoryName: { fontSize: 14, fontWeight: "600", color: "#22232a" },
  memoryMeta: { color: "#777780", fontSize: 11, marginTop: 3 },
  empty: {
    backgroundColor: "#fafafc", borderRadius: 13, paddingHorizontal: 20,
    paddingVertical: 28, alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#eeeeef", marginTop: 6,
  },
  emptyTitle: { textAlign: "center", fontWeight: "700", color: "#2a2a31", fontSize: 15 },
  emptyBody: { textAlign: "center", fontSize: 13, lineHeight: 19, color: "#777881" },
  actionButton: {
    minHeight: 50, paddingHorizontal: 20, borderRadius: 11,
    backgroundColor: "#16181e", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  actionLabel: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  secondaryButton: {
    minHeight: 48, paddingHorizontal: 18, borderRadius: 11,
    borderWidth: 1, borderColor: "#e0e1e4", backgroundColor: "#fff",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  secondaryLabel: { color: "#303039", fontSize: 13, fontWeight: "600" },
  groupsTitle: { textAlign: "center", fontSize: 19, color: "#23242b", marginTop: 12, marginBottom: 20 },
  groupCard: {
    borderRadius: 12, minHeight: 73, borderWidth: 1, borderColor: "#ededee",
    backgroundColor: "#fff", paddingHorizontal: 15, paddingVertical: 13,
    marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 13,
    ...Platform.select({
      web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.10)" },
      default: { elevation: 2 },
    }),
  },
  groupIcon: {
    width: 38, height: 38, alignItems: "center", justifyContent: "center",
  },
  groupTitle: { fontSize: 14, color: "#222229", fontWeight: "700" },
  groupHint: { fontSize: 11, color: "#747580", marginTop: 5 },
  pencil: { width: 40, height: 45, alignItems: "center", justifyContent: "center" },
  addGroup: {
    minHeight: 66, marginTop: 4, backgroundColor: "#e1e1e2",
    borderRadius: 12, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 11,
  },
  addGroupText: { fontSize: 14, fontWeight: "700", color: "#2b2b31" },
  formTitle: { textAlign: "center", fontSize: 23, fontWeight: "700", color: "#22232a", marginTop: 10 },
  coverPlaceholder: {
    alignSelf: "center", height: 165, width: 165,
    borderRadius: 14, backgroundColor: "#faf9fa", borderColor: "#eeeeef",
    borderWidth: 1, justifyContent: "center", alignItems: "center",
    marginTop: 18, marginBottom: 30,
  },
  coverInner: {
    width: 120, height: 100, borderRadius: 10, backgroundColor: "#f1f1f2",
    alignItems: "center", justifyContent: "center",
  },
  field: { marginBottom: 18 },
  label: { color: "#30313a", fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: "#e0e1e4", borderRadius: 11,
    backgroundColor: "#fff", paddingHorizontal: 13, minHeight: 50,
    fontSize: 14, color: "#222229",
  },
  note: { textAlign: "center", fontSize: 12, color: "#74747f", lineHeight: 18, marginBottom: 14 },
  error: { backgroundColor: "#fff0f0", padding: 12, borderRadius: 10, marginBottom: 14 },
  errorText: { color: "#a32f3c", fontSize: 13 },
});

export default S;
