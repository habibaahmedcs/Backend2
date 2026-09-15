const CUISINE_GROUPS = {
  egyptian: ["مصري", "مصرى", "egyptian"],
  syrian: ["سوري", "سورى", "syrian"],
  lebanese: ["لبناني", "lebanese"],
  palestinian: ["فلسطيني", "palestinian"],
  yemeni: ["يمني", "yemeni"],
  saudi: ["سعودي", "saudi"],
  algerian: ["جزائري", "algerian"],
  jordanian: ["أردني", "اردني", "jordanian"],
  moroccan: ["مغربي", "moroccan"],
  italian: ["إيطالي", "ايطالي", "italian"],
  japanese: ["ياباني", "japanese"],
  chinese: ["صيني", "chinese"],
  korean: ["كوري", "korean"],
  indian: ["هندي", "indian"],
  turkish: ["تركي", "turkish"],
  american: ["أمريكي", "امريكي", "american"],
  mexican: ["مكسيكي", "mexican"],
  other: ["أخرى", "اخرى", "other"],
};

const normalizeCuisine = (value) => {
  if (!value) return "";
  return String(value).trim();
};

const cuisineQuery = (value) => {
  const raw = normalizeCuisine(value);
  if (!raw || raw === "all" || raw === "الكل") return null;

  const lower = raw.toLowerCase();
  const group = Object.values(CUISINE_GROUPS).find((aliases) =>
    aliases.some((alias) => alias.toLowerCase() === lower)
  );

  const aliases = group || [raw];
  return {
    $or: aliases.map((alias) => ({
      cuisine: { $regex: `^${alias}$`, $options: "i" },
    })),
  };
};

const parseMenuItems = (body) => {
  if (!body) return undefined;
  const raw = body.menu || body.menuItems;
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

module.exports = { CUISINE_GROUPS, normalizeCuisine, cuisineQuery, parseMenuItems };
