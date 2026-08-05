import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return {
        shortCircuit: true,
        url: new URL(`${specifier.slice(2)}.ts`, repositoryRoot).href,
      };
    }
    return nextResolve(specifier, context);
  },
});

const { fetchAAMediaModels } = await import("./aa-media.ts");

test("uses supported V2 media endpoints and normalises Pro arena fields", async () => {
  const requested = [];
  const models = await fetchAAMediaModels(async (freeEndpoint, proEndpoint) => {
    requested.push([freeEndpoint, proEndpoint]);
    if (freeEndpoint !== "/media/text-to-image/models/free") return [];
    return [
      {
        id: "image-model-id",
        name: "Image Model",
        slug: "image-model",
        model_creator: {
          id: "e67e56e3-15cd-43db-b679-da4660a69f41",
          name: "OpenAI",
        },
        elo: 1266,
        ci_95: 11,
        rank: 1,
        samples: 4650,
        release_date: "2025-12-16",
        open_weights_url: "https://huggingface.co/example/image-model",
      },
    ];
  });

  assert.deepEqual(requested, [
    ["/media/text-to-image/models/free", "/media/text-to-image/models"],
    ["/media/image-editing/models/free", "/media/image-editing/models"],
    ["/media/text-to-video/models/free", "/media/text-to-video/models"],
    ["/media/image-to-video/models/free", "/media/image-to-video/models"],
    ["/media/text-to-speech/models/free", "/media/text-to-speech/models"],
  ]);
  assert.equal(models.length, 1);
  assert.equal(models[0].model_creator.slug, "openai");
  assert.equal(models[0].release_date, "2025-12-16");
  assert.equal(
    models[0].evaluations.artificial_analysis_media_text_to_image_elo,
    1266,
  );
  assert.equal(
    models[0].evaluations.artificial_analysis_media_text_to_image_rank,
    1,
  );
  assert.equal(
    models[0].evaluations.artificial_analysis_media_text_to_image_appearances,
    4650,
  );
  assert.equal(models[0].is_open_weights, true);
  assert.equal(
    models[0].huggingface_url,
    "https://huggingface.co/example/image-model",
  );
});
