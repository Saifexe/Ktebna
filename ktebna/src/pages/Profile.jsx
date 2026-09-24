import { useContext, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  BookPlus,
  Bookmark,
  Camera,
  CirclePlus,
  Edit3,
  Eye,
  EyeOff,
  LibraryBig,
  LogOut,
  Mail,
  MonitorSmartphone,
  Settings,
  Trash2,
  UserX,
} from "lucide-react";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import { getMyConversations } from "../chat/chatService";
import { useSaved } from "../hooks/useSaved";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import Stat from "../ui/Stat";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import BookCover from "../components/BookCover";
import SavedGrid from "../components/SavedGrid";
import { MAX_SAVED, STATUSES, dealLabel, postStatus, statusLabel, timeAgo } from "../lib/listing";
import UpdateProfilePictureModal from "../account/modal/UpdateProfilePictureModal";
import DeleteUserModal from "../account/modal/DeleteUserModal";
import DeletePostModal from "../account/modal/DeletePostModal";

const Metric = ({ icon, n, label }) => {
  const Icon = icon;
  return (
    <div className="rounded-lg border bg-card p-4">
      <Icon className="float-end size-4 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <b className="font-display text-2xl">{n}</b>
    </div>
  );
};

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, logoutEverywhere, refreshUser } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "saved" ? "saved" : "listings";
  const { count: savedCount } = useSaved();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const settingsRef = useRef(null);
  const nameRef = useRef(null);

  // Focus the name field when editing starts (instead of autoFocus).
  useEffect(() => {
    if (editing) nameRef.current?.focus();
  }, [editing]);

  useEffect(() => setName(user.name), [user.name]);

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (e) => {
      if (!settingsRef.current?.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [settingsOpen]);

  const postsKey = ["myPosts", user.id];
  const { data: postsPage, isLoading } = useQuery({
    queryKey: postsKey,
    queryFn: async () => (await apiClient.get("/api/posts/me", { params: { page: 0, size: 100 } })).data,
  });
  const posts = postsPage?.data ?? [];
  const publicCount = posts.filter((p) => p.isPublic).length;

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user.id],
    queryFn: getMyConversations,
  });

  const optimistic = (update) => ({
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: postsKey });
      const previous = queryClient.getQueryData(postsKey);
      queryClient.setQueryData(postsKey, (old) => (old ? { ...old, data: update(old.data, vars) } : old));
      return { previous };
    },
    onError: (_e, _v, context) => {
      queryClient.setQueryData(postsKey, context?.previous);
      toast.error(t("sell.error"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const visibility = useMutation({
    mutationFn: ({ id, isPublic }) => apiClient.patch(`/api/posts/${id}/visibility`, { isPublic }),
    ...optimistic((list, { id, isPublic }) => list.map((p) => (p.id === id ? { ...p, isPublic } : p))),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/api/posts/${id}/status`, { status }),
    ...optimistic((list, { id, status }) => list.map((p) => (p.id === id ? { ...p, status } : p))),
  });

  const remove = useMutation({
    mutationFn: (post) => apiClient.delete(`/api/posts/${post.id}`),
    ...optimistic((list, post) => list.filter((p) => p.id !== post.id)),
  });

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.name) return setEditing(false);
    try {
      await apiClient.put("/api/account/name", { name: trimmed });
      await refreshUser();
      toast.success(t("userInfo.nameUpdateSuccess"));
      setEditing(false);
    } catch {
      toast.error(t("userInfo.nameUpdateError"));
    }
  };

  const renderListings = () => {
    if (isLoading) return <Spinner />;
    if (posts.length === 0) {
      return (
        <div className="mt-3">
          <EmptyState
            icon={BookPlus}
            title={t("profile.noListings")}
            text={t("profile.noListingsText")}
            action={<Button to="/sell">{t("nav.sell")}</Button>}
          />
        </div>
      );
    }
    return (
      <div className="mt-3 space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="flex gap-4 rounded-lg border bg-card p-3">
            <Link to={`/book/${post.id}`} className="shrink-0">
              <BookCover src={post.bookImage} alt={post.bookName} className="h-28 w-20 rounded" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={post.isPublic ? "trust" : "muted"}>
                  {post.isPublic ? t("profile.public") : t("profile.private")}
                </Badge>
                {postStatus(post) !== "AVAILABLE" && (
                  <Badge tone={postStatus(post) === "SOLD" ? "sold" : "reserved"}>
                    {statusLabel(post, t)}
                  </Badge>
                )}
              </div>
              <Link to={`/book/${post.id}`}>
                <h3 className="mt-2 truncate font-display text-xl font-bold hover:text-primary">
                  {post.bookName}
                </h3>
              </Link>
              {post.bookAuthor && (
                <p className="truncate text-sm text-muted-foreground">{post.bookAuthor}</p>
              )}
              <p className="mt-2 truncate font-bold text-primary">{dealLabel(post, t)}</p>
              <select
                value={postStatus(post)}
                onChange={(e) => setStatus.mutate({ id: post.id, status: e.target.value })}
                aria-label={t("status.change")}
                title={t("status.change")}
                className="mt-2 h-8 rounded-md border bg-background px-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(post, t, s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col items-end justify-between">
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {timeAgo(post.createdAt, i18n.language)}
              </span>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => visibility.mutate({ id: post.id, isPublic: !post.isPublic })}
                  aria-label={post.isPublic ? t("profile.hide") : t("profile.show")}
                  title={post.isPublic ? t("profile.hide") : t("profile.show")}
                >
                  {post.isPublic ? <EyeOff /> : <Eye />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  to={`/sell/${post.id}`}
                  aria-label={t("profile.edit")}
                  title={t("profile.edit")}
                >
                  <Edit3 />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPostToDelete(post)}
                  aria-label={t("profile.delete")}
                  title={t("profile.delete")}
                  className="hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <section className="rounded-lg border bg-card p-6 text-center">
        <div className="relative mx-auto w-fit">
          <Avatar
            src={user.profilePicture}
            name={user.name}
            className="size-24 border-4 border-background text-3xl shadow"
          />
          <button
            onClick={() => setPhotoOpen(true)}
            className="absolute bottom-0 end-0 grid size-8 place-items-center rounded-full border bg-background shadow transition-colors hover:text-primary"
            aria-label={t("profile.changePhoto")}
            title={t("profile.changePhoto")}
          >
            <Camera className="size-4" />
          </button>
        </div>

        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
            className="mx-auto mt-3 flex max-w-sm gap-2"
          >
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profile.namePlaceholder")}
              aria-label={t("profile.namePlaceholder")}
              className="h-10 min-w-0 flex-1 rounded-md border bg-surface-soft px-3 text-center font-display text-lg font-bold outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" disabled={!name.trim()}>
              {t("profile.save")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setName(user.name);
                setEditing(false);
              }}
            >
              {t("profile.cancel")}
            </Button>
          </form>
        ) : (
          <h1 className="mt-3 font-display text-3xl font-bold">{user.name}</h1>
        )}
        <p className="mt-1 flex items-center justify-center gap-1 text-xs text-trust">
          <Mail className="size-3" /> {user.email} · {t("profile.member")}
        </p>

        <div className="mx-auto mt-5 grid max-w-2xl grid-cols-3 rounded-md bg-surface-soft p-3">
          <Stat n={postsPage?.count ?? "–"} label={t("profile.listings")} />
          <Stat n={`${savedCount}/${MAX_SAVED}`} label={t("profile.saved")} />
          <Stat n={conversations.length} label={t("profile.conversations")} />
        </div>

        <div className="mx-auto mt-4 flex max-w-2xl gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
            <Edit3 /> {t("profile.editProfile")}
          </Button>
          <Button variant="outline" className="flex-1" onClick={logout}>
            <LogOut className="rtl:-scale-x-100" /> {t("profile.logout")}
          </Button>
          <div className="relative" ref={settingsRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label={t("profile.settings")}
              aria-expanded={settingsOpen}
            >
              <Settings />
            </Button>
            {settingsOpen && (
              <div className="absolute end-0 z-20 mt-2 w-52 overflow-hidden rounded-lg border bg-card text-start text-sm shadow-lg">
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    setPhotoOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-muted"
                >
                  <Camera className="size-4" /> {t("profile.changePhoto")}
                </button>
                <button
                  onClick={async () => {
                    setSettingsOpen(false);
                    try {
                      await logoutEverywhere();
                      toast.success(t("profile.loggedOutEverywhere"));
                    } catch {
                      toast.error(t("sell.error"));
                    }
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-muted"
                >
                  <MonitorSmartphone className="size-4" /> {t("profile.logoutEverywhere")}
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    setDeleteAccountOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-destructive hover:bg-muted"
                >
                  <UserX className="size-4" /> {t("profile.deleteAccount")}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-5 flex gap-2 overflow-auto" role="tablist">
        {[
          ["listings", t("profile.myListings")],
          ["saved", t("profile.savedBooks")],
        ].map(([key, label]) => (
          <Button
            key={key}
            role="tab"
            aria-selected={tab === key}
            variant={tab === key ? "default" : "secondary"}
            onClick={() => setParams(key === "saved" ? { tab: "saved" } : {})}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "saved" ? (
        <div className="mt-5">
          <SavedGrid />
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric icon={LibraryBig} n={posts.length} label={t("profile.total")} />
            <Metric icon={Eye} n={publicCount} label={t("profile.active")} />
            <Metric icon={EyeOff} n={posts.length - publicCount} label={t("profile.hidden")} />
          </div>

          <Link to="/saved" className="mt-4 block rounded-md bg-accent p-4 transition-colors hover:bg-accent/80">
            <div className="flex items-center justify-between gap-3">
              <b className="flex items-center gap-2">
                <Bookmark className="size-4 text-primary" /> {t("profile.shelf")}
              </b>
              <span className="text-xs font-bold text-primary">
                {t("profile.shelfCount", { count: savedCount })}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("profile.shelfText")}</p>
          </Link>

          <Button to="/sell" className="mt-4 h-12 w-full">
            <CirclePlus /> {t("profile.newListing")}
          </Button>

          <h2 className="mt-7 font-display text-2xl font-bold">{t("profile.activeListings")}</h2>

          {renderListings()}
        </>
      )}

      {photoOpen && (
        <UpdateProfilePictureModal
          open={photoOpen}
          handleClose={() => {
            setPhotoOpen(false);
            refreshUser();
          }}
          userProfilePicture={user.profilePicture}
        />
      )}
      <DeleteUserModal open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />
      <DeletePostModal
        open={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        post={postToDelete}
        onDelete={remove.mutate}
      />
    </div>
  );
};

export default Profile;
