import { AbsoluteFill } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Fredoka';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700'] });

// One carousel slide (1080 x 1350), drawn by carousels/build.js and passed in as an SVG string.
export const Slide: React.FC<{ svg: string }> = ({ svg }) => (
  <AbsoluteFill style={{ background: '#FFF0F5' }}>
    <svg viewBox="0 0 1080 1350" width={1080} height={1350} style={{ position: 'absolute', inset: 0, fontFamily }} dangerouslySetInnerHTML={{ __html: svg }} />
  </AbsoluteFill>
);
