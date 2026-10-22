import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Fredoka';
import { frameAt, coverFrame } from './engine';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700'] });
export const FPS = 30;

export type Spec = { id: string; total: number; lines: any[]; shots: any[]; sfx: { at: number; name: string; vol?: number }[]; music?: string };

const S: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 1 }) => (
  <Sequence from={Math.max(0, Math.round(at * FPS))} layout="none"><Audio src={staticFile(src)} volume={vol} /></Sequence>
);

export const AutoReel: React.FC<{ spec: Spec }> = ({ spec }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // music ducks under speech and drops out for lines marked silence
  const music = (f: number) => {
    const tt = f / FPS;
    if (spec.lines.some((l) => l.silenceBefore && tt > l.start - 0.7 && tt < l.start)) return 0;
    // a shot can switch the party music off (e.g. the villain entry plays its own riff)
    if (spec.shots.some((s) => s.music === false && tt >= s.start && tt < s.end)) return 0;
    const talking = spec.lines.some((l) => tt >= l.start - 0.1 && tt <= l.start + l.dur + 0.1);
    return (talking ? 0.3 : 0.55) * Math.min(1, (spec.total - tt) / 1.2);
  };
  return (
    <AbsoluteFill style={{ background: '#FFF4F7' }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, fontFamily }} dangerouslySetInnerHTML={{ __html: frameAt(spec, t) }} />
      {spec.lines.map((l) => <S key={l.id} at={l.start} src={`autopilot/${spec.id}/${l.file}`} />)}
      {spec.music && <Audio src={staticFile(`autopilot/${spec.id}/music.wav`)} volume={music} />}
      {spec.sfx.map((s, i) => <S key={i} at={s.at} src={`sfx/${s.name}.wav`} vol={s.vol ?? 0.5} />)}
    </AbsoluteFill>
  );
};

// Cover image for the post (one frame): the reel's best moment plus a bold title.
export const AutoCover: React.FC<{ spec: Spec }> = ({ spec }) => (
  <AbsoluteFill style={{ background: '#FFF4F7' }}>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, fontFamily }} dangerouslySetInnerHTML={{ __html: coverFrame(spec) }} />
  </AbsoluteFill>
);
