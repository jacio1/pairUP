import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { ListingsService } from "./listings.service";
import { ProposalsService } from "./proposals.service";
import { SocialWriteGuard, type SocialRequest } from "./social.controller";
import { discardMedia, saveMedia, SocialUpload } from "./social-media";
@Controller("api")
export class ListingsController {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(ListingsService) private listingsService: ListingsService,
    @Inject(ProposalsService) private proposalsService: ProposalsService,
  ) {}
  @Get("listings") async listings(
    @Req() req: Request,
    @Query("mine") mine?: string,
  ) {
    const owner =
      mine === "true" ? await this.auth.require(req.headers.cookie) : null;
    return this.listingsService.listings(owner?.id);
  }
  @Post("listings")
  @UseGuards(SocialWriteGuard)
  @UseInterceptors(SocialUpload)
  async createListing(
    @Req() req: SocialRequest,
    @Body() body: unknown,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return saveMedia(files, async (media) => {
      let input = body;
      if (req.is("multipart/form-data")) {
        try {
          input = JSON.parse((body as { listing: string }).listing);
        } catch {
          input = null;
        }
      }
      const result = await this.listingsService.createListing(
        req.socialSession,
        input,
        media,
      );
      const claimed = new Set(result.socialPost?.media.map(({ id }) => id));
      await discardMedia(
        media.filter(({ id }) => !claimed.has(id)).map(({ id }) => id),
      );
      const { socialPost: _socialPost, ...listing } = result;
      return listing;
    });
  }
  @Get("proposals") async proposals(@Req() req: Request) {
    const session = await this.auth.require(req.headers.cookie);
    return this.proposalsService.proposals(this.auth.view(session));
  }
  @Post("listings/:id/proposals") async propose(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const session = await this.auth.require(req.headers.cookie);
    return this.proposalsService.propose(this.auth.view(session), id);
  }
  @Post("proposals/:id/respond") async respond(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { accept?: unknown },
  ) {
    const session = await this.auth.require(req.headers.cookie);
    return this.proposalsService.respond(this.auth.view(session), id, body);
  }
}
