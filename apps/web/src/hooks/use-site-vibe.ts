import { useMutation } from '@tanstack/react-query';
import { saveVibeBriefResponseSchema } from '@prosektor/contracts';
import { api } from '@/server/api';

export interface SaveVibeBriefInput {
  siteId: string;
  business_name: string;
  business_summary: string;
  target_audience: string;
  tone_keywords: string[];
  goals: string[];
  must_have_sections: string[];
  primary_cta: string;
}

export function useSaveVibeBrief() {
  return useMutation({
    mutationFn: (input: SaveVibeBriefInput) => {
      const { siteId, ...payload } = input;
      return api.post(`/sites/${siteId}/vibe-brief`, payload, saveVibeBriefResponseSchema);
    },
  });
}
