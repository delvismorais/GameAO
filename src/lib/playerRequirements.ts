export type PlayerRequirementSource = {
  name?: string | null;
  platform?: string | null;
  subCategory?: string | null;
  sub_category?: string | null;
  categories?: string[] | null;
};

export function isFreeFireProduct(source: PlayerRequirementSource): boolean {
  return /free\s*fire|freefire/i.test([
    source.name ?? '',
    source.platform ?? '',
    source.subCategory ?? source.sub_category ?? '',
    ...(source.categories ?? []),
  ].join(' '));
}
