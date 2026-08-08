import assert from "node:assert/strict";
import { createSlug } from "../../dist/common/utils/slug.js";
import {
  validateCreateCategoryInput,
  validateUpdateCategoryInput
} from "../../dist/modules/categories/categories.validation.js";

assert.equal(createSlug("Lập trình Web"), "lap-trinh-web");
assert.equal(createSlug("  Phát triển Web  "), "phat-trien-web");

const validCreate = validateCreateCategoryInput({
  name: "  Lập trình Web  ",
  description: "  Các khóa học phát triển website  "
});
assert.deepEqual(validCreate.data, {
  name: "Lập trình Web",
  description: "Các khóa học phát triển website"
});

assert.ok(validateCreateCategoryInput({ name: "" }).errors?.name);
assert.ok(validateCreateCategoryInput({ name: "Web", slug: "client-slug" }).errors?.slug);
assert.ok(validateUpdateCategoryInput({}).errors?.body);
assert.equal(validateUpdateCategoryInput({ description: null }).data?.description, null);

console.log("Categories validation tests passed");
