import { AbsoluteFill } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Fredoka';

const { fontFamily } = loadFont('normal', { weights: ['600', '700'] });

// Small "Aaj ki theme" strip laid over the whole Instagram Story (transparent PNG, overlaid by ffmpeg).
// Sits near the bottom, just above Instagram's reply bar: the top is taken by the story header + speech text.
export const ThemeStrip: React.FC<{ name: string }> = ({ name }) => (
  <AbsoluteFill style={{ backgroundColor: 'transparent', fontFamily }}>
    <div style={{ position: 'absolute', bottom: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          maxWidth: 960, padding: '14px 34px', borderRadius: 999, background: '#E8457F', color: '#fff',
          fontSize: 40, fontWeight: 600, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)', border: '3px solid #FFE27A',
        }}
      >
        Aaj ki theme: <span style={{ color: '#FFE27A', fontWeight: 700 }}>{name}</span>
      </div>
    </div>
  </AbsoluteFill>
);
