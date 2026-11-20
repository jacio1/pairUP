"use client";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { listingHref } from "@/lib/local-data";
import {
  type SocialPost,
  type SocialComment,
  useCommentOnPostMutation,
  useDeletePostMutation,
  useEditPostMutation,
  useListingSocialQuery,
  usePublishPostMutation,
  useReactToPostMutation,
  useSocialCommentsQuery,
  useSocialFeedQuery,
} from "@/lib/social-api";
import { Heart, MessageCircle, SmilePlus, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { AttachmentInput, SocialMediaGallery } from "./social-media";

const emojis = ["🔥", "👍", "😂", "😮", "👏"];

export function SocialFeed({
  author,
  liked = false,
}: {
  author?: number;
  liked?: boolean;
}) {
  const t = useTranslations("Social");
  const {
    data: posts,
    isLoading,
    isError,
    refetch,
  } = useSocialFeedQuery(
    liked ? "liked=true" : author === undefined ? "" : `author=${author}`,
    { refetchOnMountOrArgChange: true },
  );
  return (
    <section className="space-y-4" aria-label={t(liked ? "liked" : "news")}>
      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      )}
      {isError && (
        <Button variant="outline" onClick={() => void refetch()}>
          {t("retry")}
        </Button>
      )}
      {posts?.length === 0 && (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          {t(liked ? "noLikes" : "empty")}
        </p>
      )}
      {posts?.map((post) => (
        <SocialCard key={post.id} post={post} />
      ))}
    </section>
  );
}

function SocialCard({ post }: { post: SocialPost }) {
  const t = useTranslations("Social");
  const format = useFormatter();
  const author = post.listing?.authorProfile ?? post.author;
  return (
    <article className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
      <header className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary"
        >
          {(author?.name || post.listing?.authorName || "?")
            .slice(0, 1)
            .toUpperCase()}
        </span>
        <div className="min-w-0">
          {author ? (
            <Link
              href={`/users/${author.id}`}
              className="block truncate text-sm font-semibold hover:text-primary"
            >
              {author.name}
            </Link>
          ) : (
            <p className="text-sm font-semibold">
              {post.listing?.authorName || t("unknownAuthor")}
            </p>
          )}
          <time
            dateTime={post.createdAt}
            className="block text-xs text-muted-foreground"
          >
            {format.dateTime(new Date(post.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        </div>
      </header>
      {post.listing && (
        <Link
          href={listingHref(post.listing)}
          className="block text-lg font-semibold wrap-anywhere hover:text-primary"
        >
          {post.listing.title}
        </Link>
      )}
      <p className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere empty:hidden">
        {post.listing?.description ?? post.text}
      </p>
      <SocialPostContent post={post} />
    </article>
  );
}

export function ListingAttachments({ id }: { id: string }) {
  const t = useTranslations("Social");
  const { data: post, isError, refetch } = useListingSocialQuery(id);
  if (isError && !post)
    return (
      <Button variant="outline" onClick={() => void refetch()}>
        {t("retry")}
      </Button>
    );
  return post && (post.media.length > 0 || post.canEdit) ? (
    <div className="space-y-3">
      <SocialPostContent post={post} />
    </div>
  ) : null;
}

function SocialPostContent({ post }: { post: SocialPost }) {
  const t = useTranslations("Social");
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deletePost, deleting] = useDeletePostMutation();
  return (
    <>
      <SocialMediaGallery files={post.media} />
      {!post.listing && <SocialActions post={post} />}
      {post.canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(!editing)}
            aria-expanded={editing}
          >
            {t(post.listing ? "editFiles" : "edit")}
          </Button>
          {!post.listing && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirm(!confirm)}
              aria-expanded={confirm}
            >
              {t("delete")}
            </Button>
          )}
        </div>
      )}
      {editing && <PostEditor post={post} close={() => setEditing(false)} />}
      {confirm && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
          <span className="mr-auto">{t("confirmDelete")}</span>
          <Button size="sm" variant="outline" onClick={() => setConfirm(false)}>
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={deleting.isLoading}
            onClick={() => void deletePost(post.id)}
          >
            {t("delete")}
          </Button>
          {deleting.isError && (
            <span role="alert" className="w-full text-destructive">
              {t("error")}
            </span>
          )}
        </div>
      )}
    </>
  );
}

export function PostEditor({
  post,
  close,
}: {
  post?: SocialPost;
  close?: () => void;
}) {
  const t = useTranslations("Social");
  const [text, setText] = useState(post?.text ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [remove, setRemove] = useState<string[]>([]);
  const [publish, publishing] = usePublishPostMutation();
  const [edit, editing] = useEditPostMutation();
  const kept = post?.media.filter((file) => !remove.includes(file.id)) ?? [];
  const busy = publishing.isLoading || editing.isLoading;
  return (
    <form
      className={post ? "space-y-3 rounded-xl border bg-card p-4" : "space-y-3"}
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await (post
          ? edit({ id: post.id, text, files, remove })
          : publish({ text, files }));
        if ("data" in result) {
          setText("");
          setFiles([]);
          setRemove([]);
          close?.();
        }
      }}
    >
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        {!post?.listing && (
          <label className="block space-y-2 text-sm font-medium">
            <span className={post ? undefined : "sr-only"}>
              {t(post ? "edit" : "postText")}
            </span>
            <textarea
              autoFocus={!post}
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={4000}
              rows={3}
              placeholder={t("placeholder")}
              className="block w-full resize-none rounded-lg border bg-background p-3 font-normal focus-visible:outline-primary"
            />
          </label>
        )}
        {post?.media.map((file) => {
          const removed = remove.includes(file.id);
          return (
            <Button
              key={file.id}
              size="sm"
              type="button"
              variant="outline"
              className="mr-2 max-w-full"
              aria-pressed={removed}
              disabled={removed && kept.length + files.length >= 10}
              onClick={() =>
                setRemove(
                  removed
                    ? remove.filter((id) => id !== file.id)
                    : [...remove, file.id],
                )
              }
            >
              <X className="size-4" />
              <span className="truncate">
                {t(removed ? "restoreFile" : "removeFile", { name: file.name })}
              </span>
            </Button>
          );
        })}
        <AttachmentInput
          files={files}
          onChange={setFiles}
          remaining={10 - kept.length}
        />
        <div className="flex justify-end gap-2">
          {close && (
            <Button type="button" variant="outline" onClick={close}>
              {t("cancel")}
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              busy ||
              (post?.listing
                ? files.length + remove.length === 0
                : !text.trim() && files.length + kept.length === 0)
            }
          >
            {t(post ? "save" : "publish")}
          </Button>
        </div>
      </fieldset>
      {(publishing.isError || editing.isError) && (
        <p role="alert" className="text-sm text-destructive">
          {t("error")}
        </p>
      )}
    </form>
  );
}

function SocialActions({ post }: { post: SocialPost }) {
  const t = useTranslations("Social");
  const openAuth = useAuth();
  const session = useAppSelector((state) => state.chat.session);
  const [react, reacting] = useReactToPostMutation();
  const [showComments, setShowComments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  function reaction(emoji: string) {
    const value = post.reactions.find((reaction) => reaction.emoji === emoji);
    return (
      <Button
        key={emoji}
        type="button"
        size="sm"
        variant={value?.active ? "secondary" : "outline"}
        className={value?.active ? "text-primary" : ""}
        aria-label={emoji === "❤️" ? t("like") : t("reactWith", { emoji })}
        aria-pressed={!!value?.active}
        disabled={reacting.isLoading}
        onClick={async () => {
          if (!session) return openAuth();
          const result = await react({
            id: post.id,
            emoji,
            active: !value?.active,
          });
          if (!result.error) setShowEmojis(false);
        }}
      >
        {emoji === "❤️" ? (
          <Heart className={value?.active ? "size-4 fill-current" : "size-4"} />
        ) : (
          emoji
        )}{" "}
        {value?.count ?? ""}
      </Button>
    );
  }
  return (
    <div className="space-y-3 border-t pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {reaction("❤️")}
        {emojis
          .filter(
            (emoji) =>
              showEmojis ||
              post.reactions.some((value) => value.emoji === emoji),
          )
          .map(reaction)}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={t("emoji")}
          aria-expanded={showEmojis}
          onClick={() => setShowEmojis(!showEmojis)}
        >
          <SmilePlus className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => setShowComments(!showComments)}
          aria-expanded={showComments}
          aria-label={t("comments", { count: post._count.comments })}
        >
          <MessageCircle className="size-4" /> {post._count.comments}
        </Button>
      </div>
      {reacting.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t("error")}
        </p>
      )}
      {showComments && <Comments id={post.id} />}
    </div>
  );
}

function Comments({ id }: { id: string }) {
  const t = useTranslations("Social");
  const session = useAppSelector((state) => state.chat.session);
  const openAuth = useAuth();
  const [text, setText] = useState("");
  const { data, isLoading, isError, refetch } = useSocialCommentsQuery({ id });
  const [comment, sending] = useCommentOnPostMutation();
  return (
    <div className="space-y-3">
      {isLoading && (
        <p role="status" className="text-xs">
          {t("loading")}
        </p>
      )}
      {isError && (
        <Button size="sm" onClick={() => void refetch()}>
          {t("retry")}
        </Button>
      )}
      {data?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noComments")}</p>
      )}
      {data && <CommentPage id={id} comments={data} />}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!session) return openAuth();
          const result = await comment({ id, text });
          if ("data" in result) setText("");
        }}
      >
        <input
          aria-label={t("comment")}
          placeholder={t("comment")}
          maxLength={1000}
          disabled={sending.isLoading}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="h-9 min-w-32 flex-1 rounded-md border bg-background px-3 text-sm focus-visible:outline-primary"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || sending.isLoading}
        >
          {t("send")}
        </Button>
      </form>
      {sending.isError && (
        <p role="alert" className="text-xs text-destructive">
          {t("error")}
        </p>
      )}
    </div>
  );
}

function CommentPage({
  id,
  comments,
}: {
  id: string;
  comments: SocialComment[];
}) {
  const t = useTranslations("Social");
  const [older, setOlder] = useState(false);
  const {
    data: next,
    isError,
    isFetching,
    refetch,
  } = useSocialCommentsQuery(
    { id, before: comments.at(-1)?.id },
    { skip: !older || comments.length < 50 },
  );
  return (
    <>
      {comments.length > 0 && (
        <ul className="space-y-2">
          {comments.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg bg-muted/55 px-3 py-2 text-sm wrap-anywhere"
            >
              <Link
                href={`/users/${entry.author.id}`}
                className="font-semibold hover:text-primary"
              >
                {entry.author.name}
              </Link>
              <p className="whitespace-pre-wrap">{entry.text}</p>
            </li>
          ))}
        </ul>
      )}
      {comments.length === 50 && !older && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOlder(true)}
        >
          {t("older")}
        </Button>
      )}
      {isFetching && (
        <p role="status" className="text-xs">
          {t("loading")}
        </p>
      )}
      {isError && (
        <Button size="sm" onClick={() => void refetch()}>
          {t("retry")}
        </Button>
      )}
      {next && <CommentPage id={id} comments={next} />}
    </>
  );
}
