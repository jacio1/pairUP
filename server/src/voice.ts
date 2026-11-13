import { HttpException, Injectable } from "@nestjs/common";
import { AccessToken, TrackSource } from "livekit-server-sdk";

@Injectable()
export class VoiceService {
  async token(
    roomId: string,
    session: { id: number; name: string },
    expiresAt: Date,
  ) {
    const url = process.env.LIVEKIT_URL;
    const key = process.env.LIVEKIT_API_KEY;
    const secret = process.env.LIVEKIT_API_SECRET;
    if (!url || !/^wss?:\/\//.test(url) || !key || !secret) {
      throw new HttpException({ code: "VOICE_UNAVAILABLE" }, 503);
    }
    const ttl = Math.min(
      120,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    if (ttl < 1) throw new HttpException({ code: "UNAUTHORIZED" }, 401);
    const token = new AccessToken(key, secret, {
      identity: `session-${session.id}`,
      name: session.name,
      ttl,
    });
    token.addGrant({
      room: `pairup-${roomId}`,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canPublishData: false,
      canUpdateOwnMetadata: false,
    });
    return {
      url,
      token: await token.toJwt(),
      expiresAt: expiresAt.toISOString(),
    };
  }
}
