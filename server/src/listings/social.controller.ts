import {
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Header,
  Inject,
  Injectable,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AuthService, type AuthSession } from "../auth/auth.service";
import { fail } from "../common/api-error";
import { RateLimiter } from "../core";
import { Database } from "../database/database.service";
import { attachmentPath } from "../files/file-storage";
import { profileAuthor, Profiles } from "../profiles/profiles.service";
import {
  discardMedia,
  MAX_SOCIAL_FILES,
  saveMedia,
  SocialUpload,
} from "./social-media";

export type SocialRequest = Request & { socialSession: AuthSession };
const emojis = ["❤️", "🔥", "👍", "😂", "😮", "👏"];

@Injectable()
export class SocialWriteGuard implements CanActivate {
  private limiter = new RateLimiter();

  constructor(@Inject(AuthService) private auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<SocialRequest>();
    req.socialSession = await this.auth.require(req.headers.cookie);
    if (!this.limiter.allow(String(req.socialSession.id), 90, 60000))
      return fail("RATE_LIMIT", 429);
    return true;
  }
}

const postDetails = {
  author: profileAuthor,
  media: { orderBy: { position: "asc" } },
  listing: {
    select: {
      id: true,
      publicId: true,
      title: true,
      description: true,
      authorProfile: profileAuthor,
      authorName: true,
      ownerSessionId: true,
    },
  },
  _count: { select: { comments: true } },
} satisfies Prisma.SocialPostInclude;

function limitedText(value: unknown, max: number) {
  if (typeof value !== "string" || value.length > max)
    return fail("INVALID_INPUT");
  return value.trim();
}

function removedIds(raw: unknown): string[] {
  if (raw === undefined) return [];
  try {
    const ids: unknown = JSON.parse(String(raw));
    if (
      Array.isArray(ids) &&
      ids.length <= MAX_SOCIAL_FILES &&
      ids.every((id) => typeof id === "string")
    )
      return ids;
  } catch {
    // Invalid multipart field.
  }
  return fail("INVALID_INPUT");
}

@Controller("api/social")
export class SocialController {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(Database) private db: Database,
    @Inject(Profiles) private profiles: Profiles,
  ) {}

  private async viewer(req: Request) {
    const session = await this.auth.session(req.headers.cookie);
    const profile =
      session &&
      (await this.db.publicProfile.findUnique({
        where: { sessionId: session.id },
        select: { id: true },
      }));
    return { sessionId: session?.id, profileId: profile ? profile.id : -1 };
  }

  private async cards(where: Prisma.SocialPostWhereInput, req: Request) {
    const viewer = await this.viewer(req);
    const posts = await this.db.socialPost.findMany({
      where,
      take: 100,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        ...postDetails,
        reactions: {
          where: { profileId: viewer.profileId },
          select: { emoji: true },
        },
      },
    });
    const counts = posts.length
      ? await this.db.socialReaction.groupBy({
          by: ["postId", "emoji"],
          where: { postId: { in: posts.map(({ id }) => id) } },
          _count: true,
        })
      : [];
    return posts.map(({ reactions, listing, ...post }) => ({
      ...post,
      listing: listing && {
        id: listing.id,
        publicId: listing.publicId,
        title: listing.title,
        description: listing.description,
        authorProfile: listing.authorProfile,
        authorName: listing.authorName,
      },
      canEdit: listing
        ? listing.ownerSessionId === viewer.sessionId
        : post.authorId === viewer.profileId,
      reactions: counts
        .filter((count) => count.postId === post.id)
        .map((count) => ({
          emoji: count.emoji,
          count: count._count,
          active: reactions.some(({ emoji }) => emoji === count.emoji),
        })),
    }));
  }

  @Get("feed")
  @Header("Cache-Control", "private, no-store")
  async feed(
    @Req() req: Request,
    @Query("author") author?: string,
    @Query("liked") liked?: string,
    @Query("listings") listings?: string,
  ) {
    if (liked === "true") {
      const { profileId } = await this.viewer(req);
      return this.cards(
        {
          listingId: { not: null },
          reactions: { some: { profileId, emoji: "❤️" } },
        },
        req,
      );
    }
    if (listings === "true")
      return this.cards({ listingId: { not: null } }, req);
    const authorId = Number(author);
    if (
      author !== undefined &&
      (!Number.isSafeInteger(authorId) || authorId < 1 || authorId > 2147483647)
    )
      return fail("INVALID_INPUT");
    return this.cards(
      { listingId: null, ...(author === undefined ? {} : { authorId }) },
      req,
    );
  }

  @Get("listings/:id")
  @Header("Cache-Control", "private, no-store")
  async listing(@Param("id") id: string, @Req() req: Request) {
    const [post] = await this.cards({ listingId: id }, req);
    if (!post) return fail("NOT_FOUND", 404);
    return post;
  }

  @Post("feed")
  @UseGuards(SocialWriteGuard)
  @UseInterceptors(SocialUpload)
  publish(
    @Req() req: SocialRequest,
    @Body("text") raw: unknown,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return saveMedia(files, async (media) => {
      const text = limitedText(raw, 4000);
      if (!text && !media.length) return fail("INVALID_INPUT");
      const author = await this.profiles.ensure(req.socialSession);
      return this.db.socialPost.create({
        data: { text, authorId: author.id, media: { create: media } },
      });
    });
  }

  @Patch(":id")
  @UseGuards(SocialWriteGuard)
  @UseInterceptors(SocialUpload)
  async edit(
    @Req() req: SocialRequest,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const removed = await saveMedia(files, async (media) => {
      const remove = removedIds(body?.remove);
      const { profileId } = await this.viewer(req);
      return this.db.$transaction(async (tx) => {
        const locked = await tx.socialPost.updateMany({
          where: {
            id,
            OR: [
              { listingId: null, authorId: profileId },
              { listing: { ownerSessionId: req.socialSession.id } },
            ],
          },
          data: { id },
        });
        if (!locked.count) return fail("FORBIDDEN", 403);
        const post = await tx.socialPost.findUniqueOrThrow({
          where: { id },
          include: { media: { orderBy: { position: "desc" } } },
        });
        const removed = post.media.filter((file) => remove.includes(file.id));
        const remaining = post.media.length - removed.length;
        if (remaining + media.length > MAX_SOCIAL_FILES)
          return fail("INVALID_INPUT");
        const text = post.listingId ? post.text : limitedText(body?.text, 4000);
        if (!post.listingId && !text && remaining + media.length === 0)
          return fail("INVALID_INPUT");
        const firstPosition = (post.media[0]?.position ?? -1) + 1;
        await tx.socialPost.update({
          where: { id },
          data: {
            text,
            media: {
              deleteMany: { id: { in: removed.map((file) => file.id) } },
              create: media.map((file, index) => ({
                ...file,
                position: firstPosition + index,
              })),
            },
          },
        });
        return removed.map((file) => file.id);
      });
    });
    await discardMedia(removed);
    return { ok: true };
  }

  @Delete(":id")
  @UseGuards(SocialWriteGuard)
  async delete(@Req() req: SocialRequest, @Param("id") id: string) {
    const { profileId } = await this.viewer(req);
    const media = await this.db.$transaction(async (tx) => {
      // Take the same row lock as an edit before reading the files to clean up.
      const locked = await tx.socialPost.updateMany({
        where: { id, authorId: profileId, listingId: null },
        data: { id },
      });
      if (!locked.count) return fail("NOT_FOUND", 404);
      const files = await tx.socialMedia.findMany({
        where: { postId: id },
        select: { id: true },
      });
      await tx.socialPost.delete({ where: { id } });
      return files;
    });
    await discardMedia(media.map((file) => file.id));
    return { ok: true };
  }

  @Put(":id/reactions")
  @UseGuards(SocialWriteGuard)
  async react(
    @Req() req: SocialRequest,
    @Param("id") postId: string,
    @Body() body: { emoji?: unknown; active?: unknown },
  ) {
    const { emoji, active } = body ?? {};
    if (
      typeof emoji !== "string" ||
      !emojis.includes(emoji) ||
      typeof active !== "boolean"
    )
      return fail("INVALID_INPUT");
    const { id: profileId } = await this.profiles.ensure(req.socialSession);
    const key = { postId, profileId };
    if (active) {
      if (
        !(await this.db.socialPost.findUnique({
          where: { id: postId },
          select: { id: true },
        }))
      )
        return fail("NOT_FOUND", 404);
      await this.db.socialReaction.upsert({
        where: { postId_profileId: key },
        create: { ...key, emoji },
        update: { emoji },
      });
    } else {
      await this.db.socialReaction.deleteMany({ where: { ...key, emoji } });
    }
    return { ok: true };
  }

  @Get(":id/comments")
  async comments(
    @Param("id") postId: string,
    @Query("before") before?: string,
  ) {
    const marker = before
      ? await this.db.socialComment.findFirst({
          where: { id: before, postId },
          select: { id: true },
        })
      : null;
    if (before && !marker) return fail("NOT_FOUND", 404);
    return this.db.socialComment.findMany({
      where: { postId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      ...(marker ? { cursor: marker, skip: 1 } : {}),
      include: { author: profileAuthor },
    });
  }

  @Post(":id/comments")
  @UseGuards(SocialWriteGuard)
  async comment(
    @Req() req: SocialRequest,
    @Param("id") postId: string,
    @Body("text") raw: unknown,
  ) {
    const text = limitedText(raw, 1000);
    if (!text) return fail("INVALID_INPUT");
    if (
      !(await this.db.socialPost.findUnique({
        where: { id: postId },
        select: { id: true },
      }))
    )
      return fail("NOT_FOUND", 404);
    const { id: authorId } = await this.profiles.ensure(req.socialSession);
    return this.db.socialComment.create({ data: { postId, authorId, text } });
  }

  @Get("media/:id/content")
  async content(
    @Param("id") id: string,
    @Query("download") download: string,
    @Res() res: Response,
  ) {
    const media = await this.db.socialMedia.findUnique({ where: { id } });
    if (!media) return fail("NOT_FOUND", 404);
    const path = attachmentPath(media.id);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("Cache-Control", "no-cache");
    if (download === "1" || media.kind === "file")
      return res.download(path, media.name);
    res.type(media.mime);
    return res.sendFile(path, { acceptRanges: true });
  }
}
