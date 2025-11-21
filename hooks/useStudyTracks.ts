import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StudyTrack, StudyTrackItem } from '../types/database';
import { OFFICIAL_RESOURCES } from '../data/officialResources';

export type StudyTrackWithItems = StudyTrack & {
  items: StudyTrackItem[];
};

type TrackState = {
  loading: boolean;
  error: string | null;
  tracks: StudyTrackWithItems[];
};

const initialState: TrackState = {
  loading: true,
  error: null,
  tracks: [],
};

const FALLBACK_TRACKS: StudyTrackWithItems[] = (() => {
  const map = new Map<string, StudyTrackWithItems>();
  OFFICIAL_RESOURCES.forEach((resource) => {
    const trackId = `offline-${resource.trackSlug}`;
    if (!map.has(trackId)) {
      map.set(trackId, {
        id: trackId,
        slug: resource.trackSlug,
        title: resource.trackTitle,
        description: resource.trackDescription,
        exam: resource.exam,
        color_hex: resource.trackColor,
        cover_url: null,
        created_at: new Date().toISOString(),
        items: [],
      });
    }
    const track = map.get(trackId)!;
    track.items.push({
      id: resource.id,
      track_id: trackId,
      lesson_id: null,
      order_index: track.items.length,
      kind: 'resource',
      title: resource.title,
      description: resource.description,
      resource_url: resource.url,
      estimated_minutes: resource.minutes,
      created_at: new Date().toISOString(),
    } as StudyTrackItem);
  });
  return Array.from(map.values());
})();

export function useStudyTracks() {
  const [state, setState] = useState<TrackState>(initialState);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { data, error } = await supabase
          .from('study_tracks')
          .select(
            '*, items:study_track_items(*, lesson:lessons(*, subject:subjects(name, slug, color_hex)))'
          )
          .order('title', { ascending: true })
          .order('order_index', { referencedTable: 'study_track_items', ascending: true });

        if (error) throw error;

        setState({
          loading: false,
          error: null,
          tracks: (data ?? []) as StudyTrackWithItems[],
        });
      } catch (error: any) {
        setState({
          loading: false,
          error: error?.message ?? 'Nao foi possivel carregar as trilhas.',
          tracks: [],
        });
      }
    };

    fetchTracks();
  }, []);

  const effectiveTracks = state.tracks.length > 0 ? state.tracks : FALLBACK_TRACKS;

  const trackMap = useMemo(() => {
    const map = new Map<string, StudyTrackWithItems>();
    effectiveTracks.forEach((track) => map.set(track.slug, track));
    return map;
  }, [effectiveTracks]);

  const resources = useMemo(() => {
    const allResources: Array<
      StudyTrackItem & { trackTitle: string; trackSlug: string; trackColor: string; trackExam: string }
    > = [];
    effectiveTracks.forEach((track) => {
      track.items
        .filter((item) => item.kind === 'resource')
        .forEach((item) =>
          allResources.push({
            ...item,
            trackTitle: track.title,
            trackSlug: track.slug,
            trackColor: track.color_hex,
            trackExam: track.exam || 'geral',
          })
        );
    });
    return allResources;
  }, [effectiveTracks]);

  return {
    ...state,
    tracks: effectiveTracks,
    trackMap,
    resources,
    getTrackBySlug: (slug?: string | null) => (slug ? trackMap.get(slug) : undefined),
  };
}
