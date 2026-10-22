import { Composition } from 'remotion';
import { AutoReel, AutoCover, type Spec } from './autopilot/AutoReel';
import { Slide } from './carousel/Slide';
import { ThemeReel, ThemeCover } from './theme/ThemeReel';

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
  <Composition
    id="ThemeReel"
    component={ThemeReel as any}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ spec: null as any }}
    calculateMetadata={({ props }: any) => ({ durationInFrames: Math.round((props.spec?.total || 10) * 30) })}
  />
  <Composition id="ThemeCover" component={ThemeCover as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ spec: null as any }} />
  <Composition id="Slide" component={Slide as any} durationInFrames={1} fps={30} width={1080} height={1350} defaultProps={{ svg: '' }} />
  </>
);
