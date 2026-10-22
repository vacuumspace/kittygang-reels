import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Fredoka';
import { frameAt, coverAt } from './engine';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700'] });
const FPS = 30;

// spec comes from scripts/theme/build.js: pack art inline, audio files under public/theme/<id>/
export type ThemeSpec = { theme: { id: string; name: string; manifest: any }; art: Record<string, string>; avatars: string[]; day: string; times: string[]; numbers: { first: number; second: number; last: number }; total: number;
  calls: { at: number; until: number; file: string }[]; sfx: { at: number; name: string; vol?: number }[] };

const S: React.FC<{ at: number; src: string; vol?: number; until?: number }> = ({ at, src, vol = 1, until }) => (
  <Sequence from={Math.max(0, Math.round(at * FPS))} durationInFrames={until ? Math.round((until - at) * FPS) : undefined} layout="none">
    <Audio src={staticFile(src)} volume={(f) => vol * (until ? Math.max(0, Math.min(1, ((until - at) * FPS - f) / 8)) : 1)} />
  </Sequence>
);

export const ThemeReel: React.FC<{ spec: ThemeSpec }> = ({ spec }) => {
  const t = useCurrentFrame() / FPS;
  // party music under everything, dips while a number is being called
  const music = (f: number) => {
    const tt = f / FPS;
    const calling = spec.calls.some((c) => tt >= c.at - 0.15 && tt < c.until);
    return (calling ? 0.22 : 0.6) * Math.min(1, f / 10, (spec.total - tt) / 1.0);
  };
  return (
    <AbsoluteFill style={{ background: spec.theme.manifest.colors.gameGradient[1] }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, fontFamily }} dangerouslySetInnerHTML={{ __html: frameAt(spec, t) }} />
      <Audio src={staticFile(`theme/${spec.theme.id}/music.m4a`)} volume={music} />
      {spec.calls.map((c, i) => <S key={'c' + i} at={c.at} until={c.until} src={`theme/${spec.theme.id}/${c.file}`} vol={1} />)}
      {spec.sfx.map((s, i) => <S key={i} at={s.at} src={`sfx/${s.name}.wav`} vol={s.vol ?? 0.5} />)}
    </AbsoluteFill>
  );
};

export const ThemeCover: React.FC<{ spec: ThemeSpec }> = ({ spec }) => (
  <AbsoluteFill style={{ background: spec.theme.manifest.colors.gameGradient[1] }}>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, fontFamily }} dangerouslySetInnerHTML={{ __html: coverAt(spec) }} />
  </AbsoluteFill>
);
