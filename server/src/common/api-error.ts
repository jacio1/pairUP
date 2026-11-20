import { HttpException } from "@nestjs/common";
export function fail(code: string, status = 400): never {
  throw new HttpException({ code }, status);
}
