import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Fredoka';
import { frameAt, coverFrame } from './engine';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700'] });
export const FPS = 30;

export type Spec = { id: string; total: number; lines: any[]; shots: any[]; sfx: { at: number; name: string; vol?: number }[]; music?: string; musicFile?: string; ambience?: { name: string; vol?: number };
  calls?: { at: number; until: number; file: string }[]; T?: any };

const S: React.FC<{ at: number; src: string; vol?: number; until?: number }> = ({ at, src, vol = 1, until }) => (
  <Sequence from={Math.max(0, Math.round(at * FPS))} durationInFrames={until ? Math.round((until - at) * FPS) : undefined} layout="none"><Audio src={staticFile(src)} volume={vol} /></Sequence>
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
    const talking = spec.lines.some((l) => tt >= l.start - 0.1 && tt <= l.start + l.dur + 0.1) || (spec.calls || []).some((c) => tt >= c.at - 0.15 && tt < c.until);
    return (talking ? 0.3 : 0.55) * Math.min(1, (spec.total - tt) / 1.2);
  };
  return (
    <AbsoluteFill style={{ background: '#FFF4F7' }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, fontFamily }} dangerouslySetInnerHTML={{ __html: frameAt(spec, t) }} />
      {spec.lines.map((l) => <S key={l.id} at={l.start} src={`autopilot/${spec.id}/${l.file}`} />)}
      {spec.music && <Audio src={staticFile(`autopilot/${spec.id}/${spec.musicFile || 'music.wav'}`)} volume={music} />}
      {(spec.calls || []).map((c, i) => <S key={'c' + i} at={c.at} until={c.until} src={`autopilot/${spec.id}/${c.file}`} />)}
      {/* room tone: soft party chatter under everything, so the scene never goes dead between lines */}
      {spec.ambience && <Audio src={staticFile(`sfx/${spec.ambience.name}.wav`)} loop volume={(f) => (spec.ambience!.vol ?? 0.12) * Math.min(1, f / 15, (spec.total * 30 - f) / 20)} />}
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
