export type { Tag } from "./types";
export type { TagRepo } from "./ports";
export {
  makeTagsService,
  TagValidationError,
  TagNotFoundError,
  SystemTagImmutableError,
  type CreateTagInput,
  type TagsService,
} from "./service";
export { DEFAULT_SYSTEM_TAGS, CATEGORY_TAGS } from "./taxonomy";
