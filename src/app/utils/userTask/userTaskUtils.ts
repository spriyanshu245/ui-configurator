import { Microsite } from "@/app/types/types";

export const saveMicrosite = (microsite: Microsite): Partial<Microsite> => {
  const { pages, version, ...micrositeWithoutPages } = microsite;
  return {
    ...micrositeWithoutPages,
    pages: pages,
  };
};
