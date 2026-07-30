import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { HomepageImagesService } from "@/services/HomepageImagesService";
import { updateHomepageImagesSchema } from "@/validators/homepageImages.schema";

const service = new HomepageImagesService();

export const GET = withErrorHandling(async () => {
  const images = await service.get();
  return apiSuccess(images);
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(updateHomepageImagesSchema, body);
  const images = await service.update(input);
  return apiSuccess(images);
});
