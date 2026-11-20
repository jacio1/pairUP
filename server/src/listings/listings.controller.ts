import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { ListingsService } from "./listings.service";
import { ProposalsService } from "./proposals.service";
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
  @Post("listings") async createListing(
    @Req() req: Request,
    @Body() body: unknown,
  ) {
    const session = await this.auth.require(req.headers.cookie);
    return this.listingsService.createListing(session, body);
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
