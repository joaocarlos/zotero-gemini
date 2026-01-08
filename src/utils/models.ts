import { config } from "../../package.json";
import { getPref, setPref } from "./prefs";

export interface GeminiModel {
  name: string;
  displayName?: string;
  supportedGenerationMethods: string[];
}

const CACHED_MODELS_PREF_KEY = "cachedModels";
const LAST_FETCH_PREF_KEY = "lastModelsFetch";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch available Gemini models from the API
 */
export async function fetchAvailableModelsFromAPI(): Promise<GeminiModel[]> {
  const apiKey = getPref("input") as string;

  if (!apiKey) {
    throw new Error("API key not found");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    // Filter models that support generateContent AND are Gemini models (not Gemma, embeddings, etc.)
    if (data.models && Array.isArray(data.models)) {
      let models = data.models.filter((model: any) => {
        const isGemini = model.name?.startsWith("models/gemini-");
        const supportsGenerate =
          model.supportedGenerationMethods?.includes("generateContent");
        // Exclude Nano Banana models (specialized image models)
        const displayName = (model.displayName || "").toLowerCase();
        const name = (model.name || "").toLowerCase();
        const isNanoBanana =
          displayName.includes("nano banana") || name.includes("nano-banana");
        return isGemini && supportsGenerate && !isNanoBanana;
      });

      // Sort models: "Latest" first, then by version (descending)
      models.sort((a: any, b: any) => {
        const aName = a.name || "";
        const bName = b.name || "";

        // Latest versions always come first
        const aIsLatest = aName.includes("-latest");
        const bIsLatest = bName.includes("-latest");

        if (aIsLatest && !bIsLatest) return -1;
        if (!aIsLatest && bIsLatest) return 1;

        // Extract version numbers (e.g., "3.0", "2.5", "2.0", "1.5")
        const versionRegex = /gemini-(\d+\.?\d*)/;
        const aMatch = aName.match(versionRegex);
        const bMatch = bName.match(versionRegex);

        const aVersion = aMatch ? parseFloat(aMatch[1]) : 0;
        const bVersion = bMatch ? parseFloat(bMatch[1]) : 0;

        // Sort by version descending (3.0 > 2.5 > 2.0 > 1.5)
        if (aVersion !== bVersion) {
          return bVersion - aVersion;
        }

        // If same version, sort alphabetically
        return aName.localeCompare(bName);
      });

      // Cache the fetched models
      cacheModels(models);

      return models;
    }

    return [];
  } catch (error) {
    ztoolkit.log("Error fetching models:", error);
    throw error;
  }
}

/**
 * Cache models in preferences
 */
function cacheModels(models: GeminiModel[]): void {
  try {
    setPref(CACHED_MODELS_PREF_KEY, JSON.stringify(models));
    setPref(LAST_FETCH_PREF_KEY, Date.now().toString());
  } catch (error) {
    ztoolkit.log("Error caching models:", error);
  }
}

/**
 * Get cached models from preferences
 */
export function getCachedModels(): GeminiModel[] | null {
  try {
    const cached = getPref(CACHED_MODELS_PREF_KEY) as string;
    if (!cached) return null;

    return JSON.parse(cached) as GeminiModel[];
  } catch (error) {
    ztoolkit.log("Error reading cached models:", error);
    return null;
  }
}

/**
 * Check if cached models are still fresh
 */
function isCacheFresh(): boolean {
  try {
    const lastFetch = getPref(LAST_FETCH_PREF_KEY) as string;
    if (!lastFetch) return false;

    const lastFetchTime = parseInt(lastFetch, 10);
    return Date.now() - lastFetchTime < CACHE_DURATION;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch models on startup (silent - no error dialogs)
 * Falls back to cached models or defaults if API fails
 */
export async function fetchModelsOnStartup(): Promise<void> {
  const apiKey = getPref("input") as string;

  // If no API key, skip fetch
  if (!apiKey) {
    ztoolkit.log("No API key configured, skipping model fetch");
    return;
  }

  // If cache is fresh, skip fetch
  if (isCacheFresh()) {
    ztoolkit.log("Model cache is fresh, skipping fetch");
    return;
  }

  // Try to fetch models silently
  try {
    await fetchAvailableModelsFromAPI();
    ztoolkit.log("Models fetched and cached successfully");
  } catch (error) {
    ztoolkit.log("Failed to fetch models on startup:", error);
    // Fail silently - cached or default models will be used
  }
}

/**
 * Populate a select element with available models
 */
export async function populateModelSelect(
  selectElement: HTMLSelectElement,
): Promise<void> {
  try {
    const currentValue = selectElement.value;
    selectElement.disabled = true;

    const models = await fetchAvailableModelsFromAPI();

    // Clear existing options
    selectElement.innerHTML = "";

    // Add models to select
    models.forEach((model) => {
      const option = selectElement.ownerDocument.createElement("option");
      const modelName = model.name.replace("models/", "");
      option.value = modelName;
      option.textContent = model.displayName || modelName;
      selectElement.appendChild(option);
    });

    // Restore previous selection if it exists
    const options = Array.from(selectElement.options) as HTMLOptionElement[];
    if (currentValue && options.some((opt) => opt.value === currentValue)) {
      selectElement.value = currentValue;
    } else if (options.length > 0) {
      // Default to first option
      selectElement.value = options[0].value;
    }

    selectElement.disabled = false;
  } catch (error) {
    selectElement.disabled = false;
    throw error;
  }
}

/**
 * Get the current model selection, with fallback to default
 */
export function getCurrentModel(): string {
  const model = getPref("model") as string;
  return model || "gemini-1.5-flash";
}

/**
 * Get models for dropdown population
 * Priority: cached models > fetch from API > fallback defaults
 */
export function getAvailableModels(): GeminiModel[] {
  // Try cached models first
  const cached = getCachedModels();
  if (cached && cached.length > 0) {
    return cached;
  }

  // Fall back to defaults
  return getDefaultModels();
}

/**
 * Get common default models (for initial dropdown population)
 */
export function getDefaultModels(): GeminiModel[] {
  return [
    {
      name: "models/gemini-2.5-flash",
      displayName: "Gemini 2.5 Flash",
      supportedGenerationMethods: ["generateContent"],
    },
    {
      name: "models/gemini-2.5-pro",
      displayName: "Gemini 2.5 Pro",
      supportedGenerationMethods: ["generateContent"],
    },
    {
      name: "models/gemini-2.0-flash-exp",
      displayName: "Gemini 2.0 Flash (Experimental)",
      supportedGenerationMethods: ["generateContent"],
    },
    {
      name: "models/gemini-1.5-pro",
      displayName: "Gemini 1.5 Pro",
      supportedGenerationMethods: ["generateContent"],
    },
    {
      name: "models/gemini-1.5-flash",
      displayName: "Gemini 1.5 Flash",
      supportedGenerationMethods: ["generateContent"],
    },
  ];
}
