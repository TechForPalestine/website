import { getEnv } from "../utils/getEnv";
import {
  HERO_PHOTO_EXPERIMENT,
  type HeroPhotoVariant,
  variantFromFeature,
} from "../utils/heroPhotoExperiment";
import { evalServerFeature, loadFeaturePayload } from "./growthbookServer";
import { requestAssignmentId } from "./navAssignment";

/** The hero photo variant GrowthBook assigns this visitor, or null when they are not in the
 * test (flag off, CDN down, or no stable id). `now` is for tests. */
export async function assignHeroPhoto(
  request: Request,
  locals: unknown,
  now?: () => Date
): Promise<HeroPhotoVariant | null> {
  try {
    const clientKey = getEnv("PUBLIC_GROWTHBOOK_CLIENT_KEY", locals);
    const payload = clientKey ? await loadFeaturePayload(clientKey) : undefined;
    if (!payload) return null;
    const id = await requestAssignmentId(request, locals, now);
    if (!id) return null;
    return variantFromFeature(evalServerFeature(payload, HERO_PHOTO_EXPERIMENT, id));
  } catch (error) {
    console.error("Hero photo assignment failed", error);
    return null;
  }
}
