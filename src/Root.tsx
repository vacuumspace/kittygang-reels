import { Composition } from 'remotion';
import { AutoReel, AutoCover, type Spec } from './autopilot/AutoReel';

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="AutoReel"
    component={AutoReel as any}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ spec: { id: 'none', total: 10, lines: [], shots: [{ start: 0, end: 10, kit: 'card' }], sfx: [] } as Spec }}
    calculateMetadata={({ props }: any) => ({ durationInFrames: Math.max(30, Math.round(props.spec.total * 30)) })}
  />
  <Composition
    id="AutoCover"
    component={AutoCover as any}
    durationInFrames={1}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ spec: { id: 'none', total: 10, lines: [], shots: [{ start: 0, end: 10, kit: 'card' }], sfx: [] } as Spec }}
  />
  </>
);
